import { Router } from 'express';
import {
  getAllGames,
  getGameById,
  getGameByPosition,
  createGame,
  updateGame,
  deleteGame,
  uploadGameFiles,
  uploadGameFilesForUpdate
} from '../controllers/gameController';
import { authenticate, isAdmin, optionalAuthenticate } from '../middlewares/authMiddleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware';
import { apiLimiter } from '../middlewares/rateLimitMiddleware';
import {
  createGameSchema,
  updateGameSchema,
  gameIdParamSchema,
  gameQuerySchema
} from '../validation';

const router = Router();

// Public routes with optional authentication (for personalized features like recommendations)
router.get('/', optionalAuthenticate, validateQuery(gameQuerySchema), getAllGames);
router.get('/position/:position', optionalAuthenticate, getGameByPosition);
router.get('/:id', optionalAuthenticate, validateParams(gameIdParamSchema), getGameById);

router.use(authenticate);
router.use(isAdmin);

// Apply API rate limiter to all game routes
router.use(apiLimiter);

// Game routes
router.post('/', uploadGameFiles, createGame);
router.put('/:id', validateParams(gameIdParamSchema), uploadGameFilesForUpdate, updateGame);
router.delete('/:id', validateParams(gameIdParamSchema), deleteGame);

export default router;
