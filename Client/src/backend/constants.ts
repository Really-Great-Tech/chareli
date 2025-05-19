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
  AUTH_REFRESH_TOKEN: '/api/auth/refresh-token',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_REQUEST_OTP: '/api/auth/request-otp',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/auth/reset-password',
} as const;
