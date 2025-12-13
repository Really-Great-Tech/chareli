import { Router } from 'express';
import {
  getAllGames,
  getGameById,
  getGameByPosition,
  createGame,
  updateGame,
  deleteGame,
  uploadGameFiles,
  uploadGameFilesForUpdate,
  generatePresignedUrl,
  getGameProcessingStatus,
  retryGameProcessing,
  bulkUpdateFreeTime,
  likeGame,
  unlikeGame,
  createMultipartUpload,
  getMultipartUploadPartUrl,
  completeMultipartUpload,
  abortMultipartUpload,
} from '../controllers/gameController';
import {
  authenticate,
  isAdmin,
  optionalAuthenticate,
} from '../middlewares/authMiddleware';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validationMiddleware';
import {
  createGameSchema,
  updateGameSchema,
  gameIdParamSchema,
  gameQuerySchema,
} from '../validation';

const router = Router();

// Public routes with optional authentication (for personalized features like recommendations)
router.get(
  '/',
  optionalAuthenticate,
  validateQuery(gameQuerySchema),
  getAllGames
);
router.get('/position/:position', optionalAuthenticate, getGameByPosition);
router.get(
  '/:id',
  optionalAuthenticate,
  validateParams(gameIdParamSchema),
  getGameById
);

// Like/unlike routes (authenticated users only)
router.post(
  '/:id/like',
  authenticate,
  validateParams(gameIdParamSchema),
  likeGame
);
router.delete(
  '/:id/like',
  authenticate,
  validateParams(gameIdParamSchema),
  unlikeGame
);

router.use(authenticate);
router.use(isAdmin);

router.post('/presigned-url', generatePresignedUrl);

// Multipart upload routes
router.post('/multipart/create', createMultipartUpload);
router.post('/multipart/part-url', getMultipartUploadPartUrl);
router.post('/multipart/complete', completeMultipartUpload);
router.post('/multipart/abort', abortMultipartUpload);

router.post('/bulk-update-free-time', bulkUpdateFreeTime);
router.post('/', uploadGameFiles, createGame);
router.put(
  '/:id',
  validateParams(gameIdParamSchema),
  uploadGameFilesForUpdate,
  updateGame
);
router.delete('/:id', validateParams(gameIdParamSchema), deleteGame);

// Game processing status routes
router.get(
  '/:id/processing-status',
  validateParams(gameIdParamSchema),
  getGameProcessingStatus
);
router.post(
  '/:id/retry-processing',
  validateParams(gameIdParamSchema),
  retryGameProcessing
);

export default router;
