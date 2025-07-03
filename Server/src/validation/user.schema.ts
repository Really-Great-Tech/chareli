import * as yup from 'yup';
import { RoleType } from '../entities/Role';

/**
 * Create user schema validation
 * Frontend handles field requirements based on auth config
 */
export const createUserSchema = yup.object({
  email: yup.string().email("Invalid email format").optional(),
  phoneNumber: yup.string().optional(),
  firstName: yup.string().optional(),
  lastName: yup.string().optional(),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d).+$/,
      "Password is too weak (consider adding letters and numbers)"
    )
    .matches(
      /^(?=.*[A-Z])/,
      "Password must contain at least one uppercase letter"
    )
    .required("Password is required"),
  fileId: yup.string().uuid("Invalid file ID").optional(),
  isAdult: yup.boolean().default(false),
  hasAcceptedTerms: yup.boolean().default(false),
});

/**
 * Update user schema validation
 */
export const updateUserSchema = yup
  .object({
    firstName: yup.string().trim(),
    lastName: yup.string().trim(),
    email: yup.string().email("Invalid email format"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .matches(
        /^(?=.*[a-zA-Z])(?=.*\d).+$/,
        "Password is too weak (consider adding letters and numbers)"
      )
      .matches(
        /^(?=.*[A-Z])/,
        "Password must contain at least one uppercase letter"
      ),
    phoneNumber: yup.string(),
    roleId: yup.string().uuid("Invalid role ID"),
    isActive: yup.boolean(),
    fileId: yup.string().uuid("Invalid file ID"),
    isAdult: yup.boolean(),
    hasAcceptedTerms: yup.boolean(),
    lastLoggedIn: yup.date(),
  })
  .test(
    "at-least-one-field",
    "At least one field must be provided",
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
  isActive: yup.boolean(),
  isAdult: yup.boolean(),
  hasAcceptedTerms: yup.boolean()
});
