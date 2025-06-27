import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';
import config from './config';
import logger from '../utils/logger';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry for error monitoring and performance tracking
 * Only active in production mode
 * @param app Express application instance
 */
export const initializeSentry = (app: Express): void => {
  if (!config.sentry.enabled) {
    logger.info('Sentry is disabled (non-production environment)');
    return;
  }

  if (!config.sentry.dsn) {
    logger.warn('Sentry DSN not provided, skipping Sentry initialization');
    return;
  }

  logger.info(
    `Initializing Sentry in ${config.sentry.environment} environment`
  );

  Sentry.init({
    dsn: config.sentry.dsn,
    integrations: [nodeProfilingIntegration()],
    environment: config.sentry.environment,
    tracesSampleRate: config.sentry.tracesSampleRate,
    profileSessionSampleRate: 1.0,
    profileLifecycle: 'trace',
    sendDefaultPii: true,
    beforeSend(event) {
      if (config.env === 'production') {
        return event;
      }
      return null;
    },
  });
};

/**
 * Create Sentry request handler middleware
 * Captures request data for error reporting
 */
export const sentryRequestHandler = () => {
  if (config.sentry.enabled) {
    // @ts-ignore - Ignore TypeScript errors for Sentry API
    return Sentry.Handlers.requestHandler();
  }
  return (_req: Request, _res: Response, next: NextFunction) => next();
};

/**
 * Create Sentry tracing middleware
 * Enables performance monitoring
 */
export const sentryTracingHandler = () => {
  if (config.sentry.enabled) {
    // @ts-ignore - Ignore TypeScript errors for Sentry API
    return Sentry.Handlers.tracingHandler();
  }
  return (_req: Request, _res: Response, next: NextFunction) => next();
};

/**
 * Create Sentry error handler middleware
 * Captures and reports errors to Sentry
 */
export const sentryErrorHandler = () => {
  if (config.sentry.enabled) {
    // @ts-ignore - Ignore TypeScript errors for Sentry API
    return Sentry.Handlers.errorHandler();
  }
  return (err: Error, _req: Request, _res: Response, next: NextFunction) =>
    next(err);
};

/**
 * Capture and report an exception to Sentry
 * @param error Error to capture
 */
export const captureException = (error: Error): string => {
  if (config.sentry.enabled) {
    return Sentry.captureException(error);
  }
  return '';
};

/**
 * Capture and report a message to Sentry
 * @param message Message to capture
 * @param level Severity level
 */
export const captureMessage = (
  message: string,
  level?: Sentry.SeverityLevel
): string => {
  if (config.sentry.enabled) {
    return Sentry.captureMessage(message, level);
  }
  return '';
};

/**
 * Set user information for error context
 * @param user User information
 */
export const setUser = (user: Sentry.User | null): void => {
  if (config.sentry.enabled) {
    Sentry.setUser(user);
  }
};

/**
 * Set additional context for error reporting
 * @param name Context name
 * @param context Context data
 */
export const setContext = (
  name: string,
  context: Record<string, unknown>
): void => {
  if (config.sentry.enabled) {
    Sentry.setContext(name, context);
  }
};

/**
 * Set tag for error filtering and categorization
 * @param key Tag key
 * @param value Tag value
 */
export const setTag = (key: string, value: string): void => {
  if (config.sentry.enabled) {
    Sentry.setTag(key, value);
  }
};
