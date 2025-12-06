/**
 * Safe Logger Utility
 *
 * Provides safe logging that:
 * - Only logs in development mode
 * - Sanitizes sensitive data
 * - Can be easily disabled for production
 */

const isDevelopment = import.meta.env.MODE === 'development';

// Sensitive keys to sanitize
const SENSITIVE_KEYS = [
  'token',
  'password',
  'secret',
  'apiKey',
  'accessToken',
  'refreshToken',
  'authorization',
  'auth',
  'key',
  'privateKey',
  'publicKey',
];

/**
 * Sanitize an object by masking sensitive values
 */
function sanitize(data: unknown): unknown {
  if (!data) return data;

  if (typeof data === 'string') {
    // Don't log long strings that might be tokens
    if (data.length > 100) {
      return `[REDACTED: ${data.length} chars]`;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item));
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
        lowerKey.includes(sensitiveKey.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Safe logger that only logs in development and sanitizes sensitive data
 */
export const logger = {
  /**
   * Debug log - only in development
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      const sanitized = args.map((arg) => sanitize(arg));
      console.log('[DEBUG]', ...sanitized);
    }
  },

  /**
   * Info log - only in development
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      const sanitized = args.map((arg) => sanitize(arg));
      console.info('[INFO]', ...sanitized);
    }
  },

  /**
   * Warning log - always logged but sanitized
   */
  warn: (...args: unknown[]) => {
    const sanitized = args.map((arg) => sanitize(arg));
    console.warn('[WARN]', ...sanitized);
  },

  /**
   * Error log - always logged but sanitized
   */
  error: (...args: unknown[]) => {
    const sanitized = args.map((arg) => sanitize(arg));
    console.error('[ERROR]', ...sanitized);
  },

  /**
   * Log only in development without sanitization (use carefully!)
   */
  devOnly: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEV]', ...args);
    }
  },
};

// Export a no-op logger for production
export const noopLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  devOnly: () => {},
};

export default logger;
