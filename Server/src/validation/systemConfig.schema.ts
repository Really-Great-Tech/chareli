import * as yup from 'yup';

/**
 * Create system config schema validation
 */
export const createSystemConfigSchema = yup.object({
  key: yup.string().required('Config key is required'),
  value: yup.mixed().required('Config value is required'),
  description: yup.string().nullable()
});

/**
 * Update system config schema validation
 */
export const updateSystemConfigSchema = yup.object({
  value: yup.mixed().required('Config value is required'),
  description: yup.string().nullable()
});

/**
 * System config key param schema validation
 */
export const systemConfigKeyParamSchema = yup.object({
  key: yup.string().required('Config key is required')
});

/**
 * Query params schema validation
 */
export const systemConfigQuerySchema = yup.object({
  search: yup.string()
});
