import * as yup from 'yup';

/**
 * Validation schema for creating analytics entry
 */
export const createAnalyticsSchema = yup.object({
  gameId: yup.string().uuid('Invalid game ID').nullable().optional(), // Optional for non-game activities
  activityType: yup.string().required('Activity type is required'),
  startTime: yup.date().required('Start time is required'),
  endTime: yup.date().optional(),
  sessionCount: yup.number().integer().min(1).optional(),
});

/**
 * Validation schema for updating analytics entry
 */
export const updateAnalyticsSchema = yup.object({
  endTime: yup.date().nullable(),
  sessionCount: yup.number().integer().min(1),
});

/**
 * Validation schema for analytics query parameters
 */
export const analyticsQuerySchema = yup.object({
  userId: yup.string().uuid(),
  gameId: yup.string().uuid(),
  activityType: yup.string(),
  startDate: yup.date(),
  endDate: yup.date(),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(10),
});

/**
 * Validation schema for analytics ID parameter
 */
export const analyticsIdParamSchema = yup.object({
  id: yup.string().uuid().required(),
});
