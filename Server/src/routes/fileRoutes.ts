import { Router } from 'express';
import {
  getAllFiles,
  getFileById,
  createFile,
  updateFile,
  deleteFile,
  uploadFile,
  uploadFileForUpdate
} from '../controllers/fileController';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware';
import { apiLimiter } from '../middlewares/rateLimitMiddleware';
import { setUniversalCloudFrontCookies } from '../middlewares/authMiddleware';
import { cloudFrontService } from '../services/cloudfront.service';
import {
  createFileSchema,
  updateFileSchema,
  fileIdParamSchema,
  fileQuerySchema
} from '../validation';

const router = Router();

// Apply API rate limiter to all file routes
router.use(apiLimiter);

/**
 * @swagger
 * /files/cloudfront/config:
 *   get:
 *     summary: Get CloudFront configuration status
 *     description: Returns detailed CloudFront configuration status for DevOps troubleshooting. Shows what environment variables are missing and provides specific action items.
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: CloudFront configuration status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall:
 *                   type: string
 *                   example: "🚨 CloudFront Configuration Issues Detected"
 *                 configuration:
 *                   type: object
 *                   properties:
 *                     distributionDomain:
 *                       type: string
 *                       example: "❌ MISSING"
 *                     keyPairId:
 *                       type: string
 *                       example: "✅ K1MG939NUWLVLL"
 *                     privateKey:
 *                       type: string
 *                       example: "❌ Failed to Retrieve"
 *                 missing:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["CLOUDFRONT_DISTRIBUTION_DOMAIN"]
 *                 devOpsAction:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     required:
 *                       type: array
 *                       items:
 *                         type: string
 *                     examples:
 *                       type: object
 *       500:
 *         description: Configuration check failed
 */
router.get('/cloudfront/config', async (req, res) => {
  try {
    const configStatus = await cloudFrontService.getConfigurationStatus();
    res.status(200).json(configStatus);
  } catch (error) {
    res.status(500).json({
      status: '❌ Configuration Check Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET routes that need AWS access - use CloudFront middleware
router.get('/', setUniversalCloudFrontCookies, validateQuery(fileQuerySchema), getAllFiles);
router.get('/:id', setUniversalCloudFrontCookies, validateParams(fileIdParamSchema), getFileById);
router.post('/', uploadFile, createFile);
router.put('/:id', validateParams(fileIdParamSchema), uploadFileForUpdate, updateFile);
router.delete('/:id', validateParams(fileIdParamSchema), deleteFile);

export default router;
