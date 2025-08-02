import { Router } from 'express';
import { 
  generateGameAccessToken, 
  testR2Access, 
  quickTest, 
  checkConfiguration 
} from '../controllers/r2TestController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// All R2 test routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: R2 Testing
 *   description: Endpoints for testing R2 bucket access through Cloudflare Worker
 */

// Configuration check endpoint
router.get('/configuration', checkConfiguration);

// Comprehensive test endpoint
router.post('/comprehensive-test', testR2Access);

// Generate access token for specific game
router.post('/generate-access-token/:gameId', generateGameAccessToken);

// Quick test for specific game
router.get('/quick-test/:gameId', quickTest);

export default router;
