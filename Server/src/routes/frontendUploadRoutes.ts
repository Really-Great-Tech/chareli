import { Router } from 'express';
import { authenticate, canWrite } from '../middlewares/authMiddleware';
import { 
  createGameFromFrontendUpload,
  updateGameFromFrontendUpload,
  generateSignedUrl 
} from '../controllers/frontendUploadController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Generate signed URL for direct upload (requires write access)
router.post('/upload/signed-url', canWrite, generateSignedUrl);

// Create game from frontend upload (requires write access)
router.post('/games/frontend-upload', canWrite, createGameFromFrontendUpload);

// Update game from frontend upload (requires write access)
router.put('/games/:id/frontend-update', canWrite, updateGameFromFrontendUpload);

export default router;
