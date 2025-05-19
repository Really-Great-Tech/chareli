export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: Role
}

export interface LoginCredentials {
  email: string;
  password: string;
  otpType?: 'SMS' | 'EMAIL' | 'BOTH';
}

export interface OtpVerification {
  userId: string;
  otp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type RegistrationData = Partial<User> & {
  password: string;
  hasAcceptedTerms: boolean;
  isAdult: boolean;
};

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}
