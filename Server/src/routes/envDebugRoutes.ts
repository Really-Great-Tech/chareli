import { Router } from 'express';
import { getEnvironmentDebug } from '../controllers/envDebugController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * /env-debug:
 *   get:
 *     summary: Get environment variables debug information
 *     description: |
 *       Returns all environment variables and configuration status for debugging purposes.
 *       - Requires ADMIN or SUPERADMIN role
 *       - Sensitive values are masked by default
 *       - Use ?full=true query parameter to see full values (SUPERADMIN only)
 *       - Disabled in production unless ALLOW_ENV_DEBUG=true is set
 *     tags: [Environment Debug]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: full
 *         schema:
 *           type: boolean
 *         description: Show full values instead of masked (SUPERADMIN only)
 *         example: false
 *     responses:
 *       200:
 *         description: Environment debug information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-09T12:09:10.000Z"
 *                 environment:
 *                   type: string
 *                   example: development
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalVariables:
 *                       type: number
 *                       example: 45
 *                     setVariables:
 *                       type: number
 *                       example: 38
 *                     missingVariables:
 *                       type: number
 *                       example: 7
 *                     configStatus:
 *                       type: string
 *                       example: "⚠ Some configuration issues found"
 *                 environmentVariables:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                   example:
 *                     NODE_ENV: "development"
 *                     PORT: "5000"
 *                     DB_PASSWORD: "****ess"
 *                     JWT_SECRET: "****key_here"
 *                 processedConfig:
 *                   type: object
 *                   description: The processed configuration object with masked sensitive values
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "EMAIL_PASSWORD is not set"
 *                     - "CLOUDFRONT_KEY_PAIR_ID is not set"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Authentication required
 *       403:
 *         description: Insufficient permissions or disabled in production
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Admin access required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Failed to retrieve environment debug information
 */
router.get('/', authenticate, isAdmin, getEnvironmentDebug);

export default router;
