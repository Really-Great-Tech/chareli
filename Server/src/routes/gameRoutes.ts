import { Router } from 'express';
import {
  getAllGames,
  getGameById,
  createGame,
  getGameSessionCookies,
  updateGame,
  deleteGame,
  uploadGameFiles,
  uploadGameFilesForUpdate,
} from '../controllers/gameController';
import { 
  authenticate, 
  isAdmin, 
  optionalAuthenticate,
  setCloudFrontCookies,
  setUniversalCloudFrontCookies
} from '../middlewares/authMiddleware';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validationMiddleware';
import { apiLimiter } from '../middlewares/rateLimitMiddleware';
import {
  createGameSchema,
  updateGameSchema,
  gameIdParamSchema,
  gameQuerySchema,
} from '../validation';

const router = Router();

// GET routes that need AWS access for thumbnails/game files - use Universal CloudFront middleware
router.get('/', optionalAuthenticate, setUniversalCloudFrontCookies, validateQuery(gameQuerySchema), getAllGames);
router.get('/:id', optionalAuthenticate, setUniversalCloudFrontCookies, validateParams(gameIdParamSchema), getGameById);

router.use(authenticate);
router.use(isAdmin);

// Apply API rate limiter to all game routes
router.use(apiLimiter);

// Game routes
router.post('/', uploadGameFiles, createGame);
router.put(
  '/:id',
  validateParams(gameIdParamSchema),
  uploadGameFilesForUpdate,
  updateGame
);
router.delete('/:id', validateParams(gameIdParamSchema), deleteGame);

router.post(
  '/:id/session',
  authenticate,
  validateParams(gameIdParamSchema),
  getGameSessionCookies
);

export default router;
