import { Router } from 'express';
import { 
  generateGameAccessToken, 
  testR2Access, 
  quickTest, 
  checkConfiguration 
} from '../controllers/r2TestController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// All R2 test routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: R2 Testing
 *   description: Endpoints for testing R2 bucket access through Cloudflare Worker
 */

router.get('/configuration', checkConfiguration);
router.post('/comprehensive-test', testR2Access);
router.post('/generate-access-token/:gameId', generateGameAccessToken);
router.get('/quick-test/:gameId', quickTest);

export default router;
