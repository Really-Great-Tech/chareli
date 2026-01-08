import { Router, Request, Response } from 'express';
import { jsonCdnService } from '../services/jsonCdn.service';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /cdn/version:
 *   get:
 *     summary: Get current CDN version
 *     description: Returns the latest CDN version timestamp for cache-busting.
 *       Frontend clients should append this version as a query parameter
 *       (e.g., ?v=1704729600000) to CDN URLs to ensure fresh content.
 *     tags: [CDN]
 *     responses:
 *       200:
 *         description: CDN version retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: number
 *                       description: Unix timestamp of last CDN update
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: ISO timestamp of last CDN update
 *                     enabled:
 *                       type: boolean
 *                       description: Whether CDN is enabled
 */
router.get('/version', (req: Request, res: Response) => {
  try {
    const version = jsonCdnService.getVersion();
    const enabled = jsonCdnService.isEnabled();

    res.status(200).json({
      success: true,
      data: {
        version,
        updatedAt: new Date(version).toISOString(),
        enabled,
      },
    });
  } catch (error) {
    logger.error('Error getting CDN version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get CDN version',
    });
  }
});

/**
 * @swagger
 * /cdn/metrics:
 *   get:
 *     summary: Get CDN service metrics
 *     description: Returns metrics about JSON CDN generation including
 *       generation count, duration, and failure count.
 *     tags: [CDN]
 *     responses:
 *       200:
 *         description: CDN metrics retrieved successfully
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = jsonCdnService.getMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting CDN metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get CDN metrics',
    });
  }
});

export default router;
