import { Router } from 'express';
import {
  registerPlayer,
  registerFromInvitation,
  login,
  verifyOtp,
  refreshToken,
  inviteUser,
  getCurrentUser,
  getAllInvitations,
  deleteInvitation,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  requestOtp,
  verifyInvitationToken,
  resetPasswordFromInvitation
} from '../controllers/authController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validationMiddleware';
import { authLimiter, createUserLimiter } from '../middlewares/rateLimitMiddleware';
import {
  registerPlayerSchema,
  registerFromInvitationSchema,
  loginSchema,
  otpVerificationSchema,
  refreshTokenSchema,
  inviteUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  requestOtpSchema
} from '../validation';
import * as yup from 'yup';

const router = Router();

// Public routes with rate limiting
router.post('/register', createUserLimiter, validateBody(registerPlayerSchema), registerPlayer);
router.post(
  '/register/:token',
  createUserLimiter,
  validateParams(yup.object({ token: yup.string().required('Token is required') })),
  validateBody(registerFromInvitationSchema),
  registerFromInvitation
);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/verify-otp', authLimiter, validateBody(otpVerificationSchema), verifyOtp);
router.post('/request-otp', authLimiter, validateBody(requestOtpSchema), requestOtp);
router.post('/refresh-token', validateBody(refreshTokenSchema), refreshToken);
router.get(
  '/verify-invitation/:token',
  validateParams(yup.object({ token: yup.string().required('Token is required') })),
  verifyInvitationToken
);
router.post(
  '/reset-password-from-invitation/:token',
  validateParams(yup.object({ token: yup.string().required('Token is required') })),
  validateBody(resetPasswordSchema),
  resetPasswordFromInvitation
);

// Password reset routes
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.get('/reset-password/:token', validateParams(yup.object({ token: yup.string().required('Token is required') })), verifyResetToken);
router.post(
  '/reset-password/:token',
  authLimiter,
  validateParams(yup.object({ token: yup.string().required('Token is required') })),
  validateBody(resetPasswordSchema),
  resetPassword
);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/invite', authenticate, isAdmin, validateBody(inviteUserSchema), inviteUser);
router.get('/invitations', authenticate, isAdmin, getAllInvitations);
router.delete(
  '/invitations/:id',
  authenticate,
  isAdmin,
  validateParams(yup.object({ id: yup.string().uuid('Invalid invitation ID').required('Invitation ID is required') })),
  deleteInvitation
);

export default router;
