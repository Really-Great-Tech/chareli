import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

const router = Router();

// Test-only endpoints for load testing and development
// These endpoints are ONLY available in non-production environments
if (process.env.NODE_ENV !== 'production') {
  /**
   * @route PATCH /test/users/:userId/complete-first-login
   * @desc Mark user's first login as complete (bypasses OTP for testing)
   * @access Public (dev/test only)
   */
  router.patch(
    '/users/:userId/complete-first-login',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { userId } = req.params;

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: userId } });

        if (!user) {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
          return;
        }

        // Update user to mark first login as complete
        await userRepository.update(userId, { hasCompletedFirstLogin: true });

        res.status(200).json({
          success: true,
          message: 'User first login marked as complete',
        });
      } catch (error) {
        console.error('Error completing first login:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * @route POST /test/users/batch-complete-first-login
   * @desc Mark multiple users' first login as complete
   * @access Public (dev/test only)
   */
  router.post(
    '/users/batch-complete-first-login',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
          res.status(400).json({
            success: false,
            message: 'userIds must be a non-empty array',
          });
          return;
        }

        const userRepository = AppDataSource.getRepository(User);

        // Update all users in batch
        await userRepository
          .createQueryBuilder()
          .update(User)
          .set({ hasCompletedFirstLogin: true })
          .whereInIds(userIds)
          .execute();

        res.status(200).json({
          success: true,
          message: `${userIds.length} users updated`,
        });
      } catch (error) {
        console.error('Error batch completing first login:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
} else {
  // In production, return 404 for all test routes
  router.all('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Test endpoints are not available in production',
    });
  });
}

export default router;
