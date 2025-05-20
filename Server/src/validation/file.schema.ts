import * as yup from 'yup';

/**
 * Create file schema validation
 */
export const createFileSchema = yup.object({
  type: yup.string().required('File type is required'),
  filename: yup.string().optional()
});

/**
 * Update file schema validation
 */
export const updateFileSchema = yup.object({
  s3Key: yup.string(),
  s3Url: yup.string(),
  type: yup.string()
}).test(
  'at-least-one-field',
  'At least one field must be provided',
  (value) => {
    return Object.keys(value).length > 0;
  }
);

/**
 * File ID param schema validation
 */
export const fileIdParamSchema = yup.object({
  id: yup.string().uuid('Invalid file ID').required('File ID is required')
});

/**
 * Query params schema validation
 */
export const fileQuerySchema = yup.object({
  page: yup.number().integer('Page must be an integer').min(1, 'Page must be at least 1'),
  limit: yup.number().integer('Limit must be an integer').min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100'),
  type: yup.string(),
  search: yup.string()
});
