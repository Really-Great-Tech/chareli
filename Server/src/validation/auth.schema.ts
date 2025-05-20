import * as yup from 'yup';
import { RoleType } from '../entities/Role';
import { OtpType } from '../entities/Otp';

/**
 * Login schema validation
 */
export const loginSchema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required'),
  otpType: yup.string().oneOf(Object.values(OtpType), 'Invalid OTP type')
});

/**
 * Player registration schema validation
 */
export const registerPlayerSchema = yup.object({
  firstName: yup.string().trim().required('First name is required'),
  lastName: yup.string().trim().required('Last name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  isAdult: yup.boolean().default(false),
  hasAcceptedTerms: yup.boolean().required('You must accept the terms and conditions')
});

/**
 * Registration from invitation schema validation
 */
export const registerFromInvitationSchema = yup.object({
  firstName: yup.string().trim().required('First name is required'),
  lastName: yup.string().trim().required('Last name is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  // isAdult: yup.boolean().default(false),
  // hasAcceptedTerms: yup.boolean().required('You must accept the terms and conditions')
});

/**
 * OTP verification schema validation
 */
export const otpVerificationSchema = yup.object({
  userId: yup.string().uuid('Invalid user ID').required('User ID is required'),
  otp: yup.string().length(6, 'OTP must be 6 digits').required('OTP is required')
});

/**
 * Refresh token schema validation
 */
export const refreshTokenSchema = yup.object({
  refreshToken: yup.string().required('Refresh token is required')
});

/**
 * Invite user schema validation
 */
export const inviteUserSchema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  role: yup.string()
    .oneOf(Object.values(RoleType), 'Invalid role')
    .required('Role is required')
});

/**
 * Forgot password schema validation
 */
export const forgotPasswordSchema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required')
});

/**
 * Reset password schema validation
 */
export const resetPasswordSchema = yup.object({
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required')
});

/**
 * Request OTP schema validation
 */
export const requestOtpSchema = yup.object({
  userId: yup.string().uuid('Invalid user ID').required('User ID is required'),
  otpType: yup.string()
    .oneOf(Object.values(OtpType), 'Invalid OTP type')
    .required('OTP type is required')
});

/**
 * Change password schema validation
 */
export const changePasswordSchema = yup.object({
  oldPassword: yup.string().required('Current password is required'),
  newPassword: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('New password is required')
});
