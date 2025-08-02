import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Game, GameStatus } from '../entities/Games';
import { ApiError } from '../middlewares/errorHandler';
import config from '../config/config';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';

// Worker JWT secret - this should match the WORKER_JWT_SECRET in your Cloudflare Worker
const WORKER_JWT_SECRET = process.env.WORKER_JWT_SECRET || 'your-worker-jwt-secret';

const gameRepository = AppDataSource.getRepository(Game);

/**
 * @swagger
 * /r2-test/generate-access-token/{gameId}:
 *   post:
 *     summary: Generate game access token
 *     description: Generate a JWT token for accessing a specific game through the Cloudflare Worker. This token will be used by the worker to validate access to protected game files.
 *     tags: [R2 Testing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the game to generate access token for
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiresIn:
 *                 type: string
 *                 default: "1h"
 *                 description: Token expiration time (e.g., "1h", "30m", "2d")
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID for analytics (optional, defaults to authenticated user)
 *     responses:
 *       200:
 *         description: Access token generated successfully
 *       404:
 *         description: Game not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const generateGameAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gameId } = req.params;
    const { expiresIn = '1h', userId } = req.body;
    
    // Get the game with its file information
    const game = await gameRepository.findOne({
      where: { id: gameId, status: GameStatus.ACTIVE },
      relations: ['gameFile', 'thumbnailFile']
    });
    
    if (!game) {
      return next(ApiError.notFound(`Game with id ${gameId} not found or not active`));
    }
    
    if (!game.gameFile) {
      return next(ApiError.badRequest('Game file not found'));
    }
    
    // Use provided userId or fall back to authenticated user
    const targetUserId = userId || req.user?.userId;
    
    if (!targetUserId) {
      return next(ApiError.badRequest('User ID is required'));
    }
    
    // Calculate expiration time
    let expirationSeconds: number;
    const timeUnit = expiresIn.slice(-1);
    const timeValue = parseInt(expiresIn.slice(0, -1));
    
    switch (timeUnit) {
      case 's':
        expirationSeconds = timeValue;
        break;
      case 'm':
        expirationSeconds = timeValue * 60;
        break;
      case 'h':
        expirationSeconds = timeValue * 60 * 60;
        break;
      case 'd':
        expirationSeconds = timeValue * 24 * 60 * 60;
        break;
      default:
        expirationSeconds = 60 * 60; // Default to 1 hour
    }
    
    // Create JWT payload for the worker
    const payload = {
      userId: targetUserId,
      gameId: game.id,
      gameTitle: game.title,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expirationSeconds
    };
    
    // Generate JWT token using the worker secret
    const token = jwt.sign(payload, WORKER_JWT_SECRET);
    
    // Get the game file URL through the worker
    const workerUrl = config.r2.publicUrl; // This should be your worker URL
    const gameFileKey = game.gameFile.s3Key;
    const gameUrl = `${workerUrl}/${gameFileKey}`;
    
    const expiresAt = new Date((payload.iat + expirationSeconds) * 1000);
    
    res.status(200).json({
      success: true,
      data: {
        token,
        expiresAt: expiresAt.toISOString(),
        gameUrl,
        gameFileKey,
        cookieInstructions: {
          name: 'game-auth-token',
          value: token,
          domain: new URL(workerUrl).hostname,
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          expires: expiresAt.toISOString()
        },
        testInstructions: {
          message: 'To test access, set the cookie and visit the gameUrl',
          curlExample: `curl -H "Cookie: game-auth-token=${token}" "${gameUrl}"`,
          browserTest: `document.cookie = "game-auth-token=${token}; domain=${new URL(workerUrl).hostname}; path=/; secure; samesite=none"; window.open("${gameUrl}");`
        }
      }
    });
  } catch (error) {
    logger.error('Error generating game access token:', error);
    next(error);
  }
};

/**
 * @swagger
 * /r2-test/comprehensive-test:
 *   post:
 *     summary: Test R2 bucket access
 *     description: Comprehensive endpoint to test R2 bucket access through the Cloudflare Worker. This endpoint helps diagnose configuration issues, worker problems, and authentication flows.
 *     tags: [R2 Testing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 format: uuid
 *                 description: Specific game ID to test (optional, will use first available game if not provided)
 *               testThumbnail:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to test thumbnail access (public)
 *               testGameFile:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to test game file access (protected)
 *               generateToken:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to generate and test with authentication token
 *     responses:
 *       200:
 *         description: Test results with detailed diagnostics
 *       400:
 *         description: Bad request or configuration error
 *       500:
 *         description: Internal server error
 */
export const testR2Access = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      gameId, 
      testThumbnail = true, 
      testGameFile = true, 
      generateToken = true 
    } = req.body;
    
    const testResults: any = {
      timestamp: new Date().toISOString(),
      configuration: {},
      tests: {},
      errors: [],
      warnings: [],
      recommendations: []
    };
    
    // 1. Configuration Check
    logger.info('Starting R2 access test - Configuration check');
    testResults.configuration = {
      storageProvider: config.storageProvider,
      r2AccountId: config.r2.accountId ? '✓ Set' : '✗ Missing',
      r2AccessKeyId: config.r2.accessKeyId ? '✓ Set' : '✗ Missing',
      r2SecretAccessKey: config.r2.secretAccessKey ? '✓ Set' : '✗ Missing',
      r2PublicUrl: config.r2.publicUrl || '✗ Missing',
      workerJwtSecret: WORKER_JWT_SECRET !== 'your-worker-jwt-secret' ? '✓ Set' : '✗ Using default',
      s3Bucket: config.s3.bucket || '✗ Missing'
    };
    
    // Check for configuration issues
    if (config.storageProvider !== 'r2') {
      testResults.warnings.push(`Storage provider is set to '${config.storageProvider}', expected 'r2'`);
    }
    
    if (!config.r2.publicUrl) {
      testResults.errors.push('R2_PUBLIC_URL is not configured');
      testResults.recommendations.push('Set R2_PUBLIC_URL environment variable to your Cloudflare Worker URL');
    }
    
    if (WORKER_JWT_SECRET === 'your-worker-jwt-secret') {
      testResults.errors.push('WORKER_JWT_SECRET is using default value');
      testResults.recommendations.push('Set WORKER_JWT_SECRET environment variable to match your Cloudflare Worker configuration');
    }
    
    // 2. Find a game to test with
    let testGame: Game | null = null;
    
    if (gameId) {
      testGame = await gameRepository.findOne({
        where: { id: gameId, status: GameStatus.ACTIVE },
        relations: ['gameFile', 'thumbnailFile']
      });
      
      if (!testGame) {
        testResults.errors.push(`Game with ID ${gameId} not found or not active`);
      }
    } else {
      // Find the first available active game
      testGame = await gameRepository.findOne({
        where: { status: GameStatus.ACTIVE },
        relations: ['gameFile', 'thumbnailFile'],
        order: { createdAt: 'DESC' }
      });
      
      if (!testGame) {
        testResults.errors.push('No active games found for testing');
        testResults.recommendations.push('Upload at least one game to test R2 access');
      }
    }
    
    if (!testGame) {
      res.status(400).json({
        success: false,
        data: testResults,
        message: 'Cannot proceed with tests - no game available'
      });
      return;
    }
    
    testResults.testGame = {
      id: testGame.id,
      title: testGame.title,
      hasGameFile: !!testGame.gameFile,
      hasThumbnailFile: !!testGame.thumbnailFile,
      gameFileKey: testGame.gameFile?.s3Key,
      thumbnailFileKey: testGame.thumbnailFile?.s3Key
    };
    
    // 3. Test thumbnail access (should be public)
    if (testThumbnail && testGame.thumbnailFile) {
      logger.info('Testing thumbnail access (public)');
      try {
        const thumbnailUrl = `${config.r2.publicUrl}/${testGame.thumbnailFile.s3Key}`;
        testResults.tests.thumbnail = {
          url: thumbnailUrl,
          expected: 'Public access (no authentication required)',
          status: 'ready_for_manual_test',
          instructions: 'Open this URL in a browser - it should load without authentication'
        };
      } catch (error) {
        testResults.tests.thumbnail = {
          status: 'error',
          error: (error as Error).message
        };
      }
    }
    
    // 4. Test game file access (should require authentication)
    if (testGameFile && testGame.gameFile) {
      logger.info('Testing game file access (protected)');
      try {
        const gameFileUrl = `${config.r2.publicUrl}/${testGame.gameFile.s3Key}`;
        testResults.tests.gameFile = {
          url: gameFileUrl,
          expected: 'Protected access (authentication required)',
          status: 'pending'
        };
        
        // Test without authentication (should fail)
        testResults.tests.gameFile.withoutAuth = {
          url: gameFileUrl,
          expected: 'Should return 401 Unauthorized',
          status: 'ready_for_manual_test',
          instructions: 'Open this URL in a browser - it should show "Access Denied: Missing authentication token"'
        };
        
        // Generate token for authenticated test
        if (generateToken) {
          const payload = {
            userId: req.user?.userId,
            gameId: testGame.id,
            gameTitle: testGame.title,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
          };
          
          const token = jwt.sign(payload, WORKER_JWT_SECRET);
          
          testResults.tests.gameFile.withAuth = {
            url: gameFileUrl,
            token: token,
            expected: 'Should serve the game file',
            status: 'ready_for_manual_test',
            instructions: 'Set cookie "game-auth-token" with the provided token value, then open the URL',
            cookieSetup: `document.cookie = "game-auth-token=${token}; domain=${new URL(config.r2.publicUrl).hostname}; path=/; secure; samesite=none";`,
            curlTest: `curl -H "Cookie: game-auth-token=${token}" "${gameFileUrl}"`
          };
        }
      } catch (error) {
        testResults.tests.gameFile = {
          status: 'error',
          error: (error as Error).message
        };
      }
    }
    
    // 5. Generate recommendations based on findings
    if (testResults.errors.length === 0) {
      testResults.recommendations.push('Configuration looks good! Use the provided URLs and tokens to test access manually.');
    }
    
    if (config.r2.publicUrl && !config.r2.publicUrl.startsWith('https://')) {
      testResults.warnings.push('R2_PUBLIC_URL should use HTTPS for production');
    }
    
    // 6. Provide debugging information
    testResults.debugging = {
      workerExpectedBehavior: {
        thumbnails: 'Should be accessible without authentication (path starts with "thumbnails/")',
        gameFiles: 'Should require JWT token in "game-auth-token" cookie',
        invalidToken: 'Should return 403 Forbidden with "Invalid or expired token" message',
        missingToken: 'Should return 401 Unauthorized with "Missing authentication token" message'
      },
      commonIssues: [
        'Worker not deployed or not accessible at R2_PUBLIC_URL',
        'WORKER_JWT_SECRET mismatch between backend and worker',
        'CORS issues preventing cookie setting',
        'Bucket name mismatch between worker and R2 configuration',
        'Worker environment variables not properly set'
      ],
      nextSteps: [
        '1. Test thumbnail URL in browser (should work without authentication)',
        '2. Test game file URL in browser (should show access denied)',
        '3. Set authentication cookie and test game file URL again (should work)',
        '4. Check browser developer tools for any CORS or cookie issues',
        '5. Check Cloudflare Worker logs for any errors'
      ]
    };
    
    const overallSuccess = testResults.errors.length === 0;
    
    res.status(200).json({
      success: overallSuccess,
      data: testResults,
      message: overallSuccess 
        ? 'Configuration check completed successfully. Use the provided test URLs and tokens to verify access.'
        : 'Configuration issues found. Please review the errors and recommendations.'
    });
    
  } catch (error) {
    logger.error('Error in R2 access test:', error);
    next(error);
  }
};

/**
 * @swagger
 * /r2-test/quick-test/{gameId}:
 *   get:
 *     summary: Quick R2 access test
 *     description: Quick test to generate access token and URLs for a specific game. Useful for rapid testing during development.
 *     tags: [R2 Testing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the game to test
 *     responses:
 *       200:
 *         description: Quick test results
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export const quickTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gameId } = req.params;
    
    const game = await gameRepository.findOne({
      where: { id: gameId, status: GameStatus.ACTIVE },
      relations: ['gameFile', 'thumbnailFile']
    });
    
    if (!game) {
      return next(ApiError.notFound(`Game with id ${gameId} not found or not active`));
    }
    
    // Generate token
    const payload = {
      userId: req.user?.userId,
      gameId: game.id,
      gameTitle: game.title,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
    
    const token = jwt.sign(payload, WORKER_JWT_SECRET);
    const workerUrl = config.r2.publicUrl;
    
    const result = {
      game: {
        id: game.id,
        title: game.title
      },
      urls: {
        thumbnail: game.thumbnailFile ? `${workerUrl}/${game.thumbnailFile.s3Key}` : null,
        gameFile: game.gameFile ? `${workerUrl}/${game.gameFile.s3Key}` : null
      },
      token: token,
      testCommands: {
        thumbnailTest: game.thumbnailFile ? `curl "${workerUrl}/${game.thumbnailFile.s3Key}"` : 'No thumbnail available',
        gameFileWithoutAuth: game.gameFile ? `curl "${workerUrl}/${game.gameFile.s3Key}"` : 'No game file available',
        gameFileWithAuth: game.gameFile ? `curl -H "Cookie: game-auth-token=${token}" "${workerUrl}/${game.gameFile.s3Key}"` : 'No game file available'
      },
      browserTest: game.gameFile ? `
// Copy and paste this in browser console:
document.cookie = "game-auth-token=${token}; domain=${new URL(workerUrl).hostname}; path=/; secure; samesite=none";
window.open("${workerUrl}/${game.gameFile.s3Key}");
      `.trim() : 'No game file available for browser test'
    };
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Quick test data generated. Use the provided commands and URLs to test access.'
    });
    
  } catch (error) {
    logger.error('Error in quick R2 test:', error);
    next(error);
  }
};

/**
 * @swagger
 * /r2-test/configuration:
 *   get:
 *     summary: Check R2 configuration
 *     description: Check the current R2 and worker configuration status
 *     tags: [R2 Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration status
 */
export const checkConfiguration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const configStatus = {
      storageProvider: {
        current: config.storageProvider,
        expected: 'r2',
        status: config.storageProvider === 'r2' ? '✓' : '✗'
      },
      r2: {
        accountId: {
          status: config.r2.accountId ? '✓ Set' : '✗ Missing',
          configured: !!config.r2.accountId
        },
        accessKeyId: {
          status: config.r2.accessKeyId ? '✓ Set' : '✗ Missing',
          configured: !!config.r2.accessKeyId
        },
        secretAccessKey: {
          status: config.r2.secretAccessKey ? '✓ Set' : '✗ Missing',
          configured: !!config.r2.secretAccessKey
        },
        publicUrl: {
          status: config.r2.publicUrl ? '✓ Set' : '✗ Missing',
          value: config.r2.publicUrl,
          configured: !!config.r2.publicUrl
        }
      },
      worker: {
        jwtSecret: {
          status: WORKER_JWT_SECRET !== 'your-worker-jwt-secret' ? '✓ Set' : '✗ Using default',
          configured: WORKER_JWT_SECRET !== 'your-worker-jwt-secret'
        }
      },
      bucket: {
        name: config.s3.bucket,
        status: config.s3.bucket ? '✓ Set' : '✗ Missing'
      }
    };
    
    const issues = [];
    const recommendations = [];
    
    if (config.storageProvider !== 'r2') {
      issues.push(`Storage provider is '${config.storageProvider}', should be 'r2'`);
      recommendations.push('Set STORAGE_PROVIDER=r2 in your environment variables');
    }
    
    if (!config.r2.accountId) {
      issues.push('R2 Account ID is missing');
      recommendations.push('Set CLOUDFLARE_ACCOUNT_ID in your environment variables');
    }
    
    if (!config.r2.accessKeyId) {
      issues.push('R2 Access Key ID is missing');
      recommendations.push('Set R2_ACCESS_KEY_ID in your environment variables');
    }
    
    if (!config.r2.secretAccessKey) {
      issues.push('R2 Secret Access Key is missing');
      recommendations.push('Set R2_SECRET_ACCESS_KEY in your environment variables');
    }
    
    if (!config.r2.publicUrl) {
      issues.push('R2 Public URL is missing');
      recommendations.push('Set R2_PUBLIC_URL to your Cloudflare Worker URL in your environment variables');
    }
    
    if (WORKER_JWT_SECRET === 'your-worker-jwt-secret') {
      issues.push('Worker JWT Secret is using default value');
      recommendations.push('Set WORKER_JWT_SECRET to match your Cloudflare Worker configuration');
    }
    
    if (!config.s3.bucket) {
      issues.push('S3/R2 bucket name is missing');
      recommendations.push('Set AWS_S3_BUCKET to your R2 bucket name in your environment variables');
    }
    
    const isConfigured = issues.length === 0;
    
    res.status(200).json({
      success: isConfigured,
      data: {
        configuration: configStatus,
        issues,
        recommendations,
        summary: {
          totalIssues: issues.length,
          isFullyConfigured: isConfigured,
          readyForTesting: isConfigured
        }
      },
      message: isConfigured 
        ? 'R2 configuration is complete and ready for testing'
        : `Found ${issues.length} configuration issue(s). Please review the recommendations.`
    });
    
  } catch (error) {
    logger.error('Error checking R2 configuration:', error);
    next(error);
  }
};
