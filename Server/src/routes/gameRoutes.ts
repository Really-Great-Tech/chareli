import { Router } from 'express';
import {
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame
} from '../controllers/gameController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware';
import { apiLimiter } from '../middlewares/rateLimitMiddleware';
import {
  createGameSchema,
  updateGameSchema,
  gameIdParamSchema,
  gameQuerySchema
} from '../validation';

const router = Router();

// All game routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// Apply API rate limiter to all game routes
router.use(apiLimiter);

// Game routes
router.get('/', validateQuery(gameQuerySchema), getAllGames);
router.get('/:id', validateParams(gameIdParamSchema), getGameById);
router.post('/', validateBody(createGameSchema), createGame);
router.put('/:id', validateParams(gameIdParamSchema), validateBody(updateGameSchema), updateGame);
router.delete('/:id', validateParams(gameIdParamSchema), deleteGame);

export default router;
