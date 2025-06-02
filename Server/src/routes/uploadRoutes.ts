import { Router } from 'express';
import {
  generatePresignedUrls,
  createGameFromUpload
} from '../controllers/uploadController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';
import { apiLimiter } from '../middlewares/rateLimitMiddleware';

const router = Router();

// All upload routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// Apply API rate limiter to all upload routes
router.use(apiLimiter);

// Upload routes
router.post('/presigned-urls', generatePresignedUrls);
router.post('/create-game', createGameFromUpload);

export default router;
