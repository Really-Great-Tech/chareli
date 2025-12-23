import logger from './logger';

/**
 * Performance timing utility for tracking slow queries and operations
 */
export class PerformanceTimer {
  private startTime: number;
  private label: string;
  private metadata: Record<string, any>;

  constructor(label: string, metadata: Record<string, any> = {}) {
    this.label = label;
    this.metadata = metadata;
    this.startTime = Date.now();
  }

  /**
   * End timing and log if exceeds threshold
   * @param thresholdMs - Log as warning if duration exceeds this (default: 1000ms)
   */
  end(thresholdMs: number = 1000): number {
    const duration = Date.now() - this.startTime;

    const logData = {
      label: this.label,
      duration: `${duration}ms`,
      ...this.metadata,
    };

    if (duration > thresholdMs) {
      logger.warn(`[SLOW QUERY] ${this.label} took ${duration}ms`, logData);
    } else {
      logger.debug(`[PERF] ${this.label} completed in ${duration}ms`, logData);
    }

    return duration;
  }

  /**
   * Get current elapsed time without ending the timer
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Decorator for timing async functions
 */
export function logPerformance(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const timer = new PerformanceTimer(
      `${target.constructor.name}.${propertyKey}`
    );
    try {
      const result = await originalMethod.apply(this, args);
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  };

  return descriptor;
}

/**
 * Simple wrapper for timing a block of code
 */
export async function timeAsync<T>(
  label: string,
  fn: () => Promise<T>,
  metadata: Record<string, any> = {}
): Promise<T> {
  const timer = new PerformanceTimer(label, metadata);
  try {
    const result = await fn();
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
}

/**
 * Middleware for timing HTTP requests
 */
export function performanceMiddleware(req: any, res: any, next: any) {
  const timer = new PerformanceTimer(`HTTP ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = timer.end(2000); // Warn if > 2s
    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalSend.call(this, data);
  };

  next();
}
