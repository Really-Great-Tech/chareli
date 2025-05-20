/**
 * Backend API routes
 */
export const BackendRoute = {
  USER: '/api/users',
  USER_BY_ID: '/api/users/:id',
  HEALTH: '/api/health',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_VERIFY_OTP: '/api/auth/verify-otp',
  AUTH_ME: '/api/auth/me',
  AUTH_CHANGE_PASSWORD: '/api/auth/me/change-password',
  AUTH_REFRESH_TOKEN: '/api/auth/refresh-token',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_REQUEST_OTP: '/api/auth/request-otp',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/auth/reset-password',
  AUTH_INVITE: '/api/auth/invite',
  AUTH_INVITATIONS: '/api/auth/invitations',
  AUTH_INVITATION_BY_ID: '/api/auth/invitations/:id',
  AUTH_VERIFY_INVITATION: '/api/auth/verify-invitation/:token',
  AUTH_REGISTER_FROM_INVITATION: '/api/auth/register/:token',
  AUTH_RESET_PASSWORD_FROM_INVITATION: '/api/auth/reset-password-from-invitation/:token',
  AUTH_REVOKE_ROLE: '/api/auth/revoke-role/:id',
  GAMES: '/api/games',
  GAME_BY_ID: '/api/games/:id',
  CATEGORIES: '/api/categories',
  CATEGORY_BY_ID: '/api/categories/:id',
} as const;
