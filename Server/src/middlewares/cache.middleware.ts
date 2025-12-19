import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service';
import { cacheConfig } from '../config/cache.config';
import logger from '../utils/logger';

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  bypassAdmin?: boolean; // Skip cache for admin users
  condition?: (req: Request) => boolean; // Conditional caching
}

/**
 * Caching Middleware
 * Generic middleware for caching GET request responses
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if caching is enabled
    if (!cacheConfig.features.cacheEnabled) {
      return next();
    }

    // Check custom condition
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Bypass cache for admin users if specified
    if (options.bypassAdmin && req.user && (req.user as any).role === 'admin') {
      logger.debug('Bypassing cache for admin user');
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = options.keyGenerator
        ? options.keyGenerator(req)
        : generateDefaultCacheKey(req);

      // Try to get from cache
      const startTime = Date.now();
      const cachedData = await redisService.get<any>(cacheKey);
      const duration = Date.now() - startTime;

      if (cachedData) {
        // Cache hit
        logger.info(`Cache HIT: ${cacheKey} (${duration}ms)`);

        // Send cached response
        return res.status(200).json(cachedData);
      }

      // Cache miss - intercept response
      logger.info(`Cache MISS: ${cacheKey}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (body: any) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          const ttl = options.ttl || 300; // Default 5 minutes

          // Cache asynchronously (don't wait)
          redisService
            .set(cacheKey, body, ttl)
            .then(() => {
              logger.debug(`Cached response: ${cacheKey} (TTL: ${ttl}s)`);
            })
            .catch((error) => {
              logger.error(`Error caching response for ${cacheKey}:`, error);
            });
        }

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      // On error, just continue without caching
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Generate default cache key from request
 */
function generateDefaultCacheKey(req: Request): string {
  const baseUrl = req.baseUrl || '';
  const path = req.path || '';
  const query =
    Object.keys(req.query).length > 0 ? ':' + JSON.stringify(req.query) : '';

  // Include user ID for user-specific caches
  const userId = req.user ? `:user:${(req.user as any).id}` : '';

  return `cache:${cacheConfig.version}:route:${baseUrl}${path}${query}${userId}`;
}

/**
 * Specific middleware for games list caching
 */
export function cacheGamesList(ttl?: number) {
  return cacheMiddleware({
    ttl: ttl || cacheConfig.ttl.games_list,
    keyGenerator: (req) => {
      const page = req.query.page || '1';
      const limit = req.query.limit || '10';
      const status = req.query.status || '';
      const categoryId = req.query.categoryId || '';
      const search = req.query.search || '';

      const filters = [status, categoryId, search].filter(Boolean).join(':');
      return `cache:${cacheConfig.version}:games:list:${page}:${limit}${
        filters ? `:${filters}` : ''
      }`;
    },
  });
}

/**
 * Specific middleware for game detail caching
 */
export function cacheGameDetail(ttl?: number) {
  return cacheMiddleware({
    ttl: ttl || cacheConfig.ttl.game_detail,
    keyGenerator: (req) => {
      const gameId = req.params.id;
      return `cache:${cacheConfig.version}:game:${gameId}`;
    },
  });
}

/**
 * Specific middleware for categories list caching
 */
export function cacheCategories(ttl?: number) {
  return cacheMiddleware({
    ttl: ttl || cacheConfig.ttl.categories,
    keyGenerator: () => {
      return `cache:${cacheConfig.version}:categories:all`;
    },
  });
}

/**
 * Specific middleware for category games caching
 */
export function cacheCategoryGames(ttl?: number) {
  return cacheMiddleware({
    ttl: ttl || cacheConfig.ttl.games_list,
    keyGenerator: (req) => {
      const categoryId = req.params.id;
      const page = req.query.page || '1';
      const limit = req.query.limit || '10';
      return `cache:${cacheConfig.version}:category:${categoryId}:games:${page}:${limit}`;
    },
  });
}

/**
 * Specific middleware for search results caching
 */
export function cacheSearch(ttl?: number) {
  return cacheMiddleware({
    ttl: ttl || cacheConfig.ttl.search,
    keyGenerator: (req) => {
      const query = req.query.q || req.query.query || '';
      const filters = req.query.filters || '';
      const page = req.query.page || '1';
      return `cache:${cacheConfig.version}:search:${query}${
        filters ? `:${filters}` : ''
      }:${page}`;
    },
  });
}

/**
 * Specific middleware for analytics caching
 */
export function cacheAnalytics(ttl?: number) {
  return cacheMiddleware({
    ttl: ttl || cacheConfig.ttl.analytics,
    keyGenerator: (req) => {
      const type = req.params.type || 'general';
      const period = req.query.period || 'day';
      const date = req.query.date || '';
      return `cache:${cacheConfig.version}:analytics:${type}:${period}${
        date ? `:${date}` : ''
      }`;
    },
  });
}
