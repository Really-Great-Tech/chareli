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
  generatePresignedUrl
} from '../controllers/gameController';
import { authenticate, isAdmin, optionalAuthenticate } from '../middlewares/authMiddleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware';
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

router.post('/presigned-url', generatePresignedUrl);
router.post('/', uploadGameFiles, createGame);
router.put('/:id', validateParams(gameIdParamSchema), uploadGameFilesForUpdate, updateGame);
router.delete('/:id', validateParams(gameIdParamSchema), deleteGame);

export default router;
