import { Router } from 'express';
import {
  registerPlayer,
  registerFromInvitation,
  login,
  verifyOtp,
  refreshToken,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  forgotPasswordPhone,
  requestOtp
} from '../controllers/authController';
import {
  inviteUser,
  getCurrentUser,
  getAllInvitations,
  deleteInvitation,
  verifyInvitationToken,
  resetPasswordFromInvitation,
  revokeRole,
  changePassword,
  changeUserRole
} from '../controllers/userManagementController';
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
  requestOtpSchema,
  changePasswordSchema
} from '../validation';
import * as yup from 'yup';

const router = Router();

// Public routes with rate limiting
router.post('/register', validateBody(registerPlayerSchema), registerPlayer);
router.post(
  '/register/:token',
  createUserLimiter,
  validateParams(yup.object({ token: yup.string().required('Token is required') })),
  validateBody(registerFromInvitationSchema),
  registerFromInvitation
);
router.post('/login', validateBody(loginSchema), login);
router.post('/verify-otp', validateBody(otpVerificationSchema), verifyOtp);
router.post('/request-otp', validateBody(requestOtpSchema), requestOtp);
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

// Email-based password reset routes
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.get('/reset-password/:token', validateParams(yup.object({ token: yup.string().required('Token is required') })), verifyResetToken);
// Password reset routes (supports both email and phone)
router.post('/forgot-password/phone', validateBody(yup.object({
  phoneNumber: yup.string().required('Phone number is required')
})), forgotPasswordPhone);

// Email-based reset (with token)
router.post(
  '/reset-password/:token',
  validateBody(resetPasswordSchema),
  resetPassword
);

// Phone-based reset (no token)
router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  resetPassword
);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/me/change-password', authenticate, validateBody(changePasswordSchema), changePassword);
router.post('/invite', authenticate, isAdmin, validateBody(inviteUserSchema), inviteUser);
router.get('/invitations', authenticate, isAdmin, getAllInvitations);
router.delete(
  '/invitations/:id',
  authenticate,
  isAdmin,
  validateParams(yup.object({ id: yup.string().uuid('Invalid invitation ID').required('Invitation ID is required') })),
  deleteInvitation
);
router.put(
  '/revoke-role/:id',
  authenticate,
  isAdmin,
  validateParams(yup.object({ id: yup.string().uuid('Invalid user ID').required('User ID is required') })),
  revokeRole
);

router.put(
  '/users/:id/role',
  authenticate,
  isAdmin,
  validateParams(yup.object({ id: yup.string().uuid('Invalid user ID').required('User ID is required') })),
  validateBody(yup.object({ role: yup.string().oneOf(['player', 'editor', 'admin', 'superadmin'], 'Invalid role').required('Role is required') })),
  changeUserRole
);

export default router;
