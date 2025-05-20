import * as yup from 'yup';

/**
 * Create category schema validation
 */
export const createCategorySchema = yup.object({
  name: yup.string().trim().required('Category name is required'),
  description: yup.string().trim().nullable()
});

/**
 * Update category schema validation
 */
export const updateCategorySchema = yup.object({
  name: yup.string().trim(),
  description: yup.string().trim().nullable()
}).test(
  'at-least-one-field',
  'At least one field must be provided',
  (value) => {
    return Object.keys(value).length > 0;
  }
);

/**
 * Category ID param schema validation
 */
export const categoryIdParamSchema = yup.object({
  id: yup.string().uuid('Invalid category ID').required('Category ID is required')
});

/**
 * Query params schema validation
 */
export const categoryQuerySchema = yup.object({
  page: yup.number().integer('Page must be an integer').min(1, 'Page must be at least 1'),
  limit: yup.number().integer('Limit must be an integer').min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100'),
  search: yup.string()
});
