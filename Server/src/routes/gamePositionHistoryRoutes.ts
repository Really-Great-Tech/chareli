import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import {
  getGamePositionHistory,
  recordGameClick,
  getClickAnalytics,
  getAllPositionHistory,
  getPositionPerformance
} from '../controllers/gamePositionHistoryController';

const router = Router();

router.post('/:gameId/click', recordGameClick);

router.use(authenticate);

router.get('/analytics', getClickAnalytics);
router.get('/performance', getPositionPerformance);
router.get('/', getAllPositionHistory);
router.get('/:gameId', getGamePositionHistory);

export default router;
