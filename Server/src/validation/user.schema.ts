import * as yup from 'yup';
import { RoleType } from '../entities/Role';

/**
 * Create user schema validation
 */
export const createUserSchema = yup.object({
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
  roleId: yup.string().uuid('Invalid role ID').required('Role ID is required')
});

/**
 * Update user schema validation
 */
export const updateUserSchema = yup.object({
  firstName: yup.string().trim(),
  lastName: yup.string().trim(),
  email: yup.string().email('Invalid email format'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  phoneNumber: yup.string(),
  roleId: yup.string().uuid('Invalid role ID'),
  isActive: yup.boolean()
}).test(
  'at-least-one-field',
  'At least one field must be provided',
  (value) => {
    return Object.keys(value).length > 0;
  }
);

/**
 * User ID param schema validation
 */
export const userIdParamSchema = yup.object({
  id: yup.string().uuid('Invalid user ID').required('User ID is required')
});

/**
 * Query params schema validation
 */
export const userQuerySchema = yup.object({
  page: yup.number().integer('Page must be an integer').min(1, 'Page must be at least 1'),
  limit: yup.number().integer('Limit must be an integer').min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100'),
  role: yup.string().oneOf(Object.values(RoleType), 'Invalid role'),
  search: yup.string(),
  isActive: yup.boolean()
});
