import { Router } from 'express';
import { trackSignupClick, getSignupAnalyticsData, testIPCountry } from '../controllers/signupAnalyticsController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validationMiddleware';
import { analyticsSchema } from '../validation/signupAnalytics.schema';

const router = Router();

// Public endpoint to track signup button clicks
router.post('/click', validateBody(analyticsSchema), trackSignupClick);

// Admin-only endpoint to view analytics
router.get('/data', authenticate, isAdmin, getSignupAnalyticsData);

// Test endpoint for IP country detection
router.get('/test-ip/:ip', testIPCountry);

export default router;
