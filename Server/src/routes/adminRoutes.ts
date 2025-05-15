import { Router } from 'express';
import { 
  getDashboardAnalytics,
  getUsersWithAnalytics,
  getUserAnalyticsById,
  getGamesWithAnalytics,
  getGameAnalyticsById,
  runInactiveUsersCheck,
  getUserActivityLog
} from '../controllers/adminDashboardController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';

const router = Router();

// All admin routes require authentication and admin privileges
router.use(authenticate, isAdmin);

// Dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

// Users with analytics
router.get('/users-analytics', getUsersWithAnalytics);

// Get analytics for a specific user
router.get('/users/:id/analytics', getUserAnalyticsById);

// Games with analytics
router.get('/games-analytics', getGamesWithAnalytics);

// Get analytics for a specific game
router.get('/games/:id/analytics', getGameAnalyticsById);

// User activity log
router.get('/user-activity-log', getUserActivityLog);

// Manually trigger inactive users check
router.post('/check-inactive-users', runInactiveUsersCheck);

export default router;
