# Controller Caching Integration Guide

## Overview

This guide shows exactly how to integrate caching into the game and category controllers. The cache infrastructure is ready - this document provides the specific code changes needed.

## Game Controller Integration

### Import Statements (✅ DONE)

```typescript
import { cacheService } from '../services/cache.service';
import { cacheInvalidationService } from '../services/cache-invalidation.service';
```

### Method: `getGameById` (Lines 607-701)

**Add BEFORE the database query (after line 613):**

```typescript
// Try cache first
const cached = await cacheService.getGameById(id);
if (cached) {
  logger.debug(`Cache hit for game ${id}`);
  return res.status(200).json({
    success: true,
    data: cached
  });
}
```

**Add AFTER successful response preparation (before line 688):**

```typescript
// Cache the response
const responseData = {
  ...game,
  likeCount: calculateLikeCount(game, userLikesCount),
  userLikesCount,
  hasLiked,
  similarGames: similarGames,
};

await cacheService.setGameById(id, responseData);
```

### Method: `getAllGames` (Lines 227-545)

**Note:** This method has complex filtering logic. For Phase 1, we'll cache only the standard list queries (not special filters like 'popular', 'recommended', 'recently_added').

**Add at the beginning (after line 244):**

```typescript
// Only cache standard list queries (not special filters)
if (!filter && cacheService.isEnabled()) {
  const filterKey = [status, categoryId, search, createdById].filter(Boolean).join(':');
  const cached = await cacheService.getGamesList(pageNumber, limitNumber || 10, filterKey);

  if (cached) {
    logger.debug(`Cache hit for games list page ${pageNumber}`);
    return res.status(200).json(cached);
  }
}
```

**Add BEFORE the final response (before line 539):**

```typescript
// Cache the response (only for standard queries)
if (!filter && cacheService.isEnabled()) {
  const filterKey = [status, categoryId, search, createdById].filter(Boolean).join(':');
  const responseData = {
    data: games,
  };

  await cacheService.setGamesList(pageNumber, limitNumber || 10, responseData, filterKey);
}
```

### Method: `createGame` (Lines 779-969)

**Add AFTER successful game creation (find the `res.status(201).json` line, add before it):**

```typescript
// Invalidate caches after game creation
await cacheInvalidationService.invalidateGameCreation(
  savedGame.id,
  savedGame.categoryId
);
```

### Method: `updateGame` (Lines 971-1324)

**Add AFTER successful update (find the `res.status(200).json` line, add before it):**

```typescript
// Invalidate caches after game update
await cacheInvalidationService.invalidateGameUpdate(
  game.id,
  game.categoryId
);
```

### Method: `deleteGame` (Lines 1326-1403)

**Add AFTER successful deletion (find the `res.status(200).json` line, add before it):**

```typescript
// Invalidate caches after game deletion
await cacheInvalidationService.invalidateGameDeletion(
  id,
  game.categoryId
);
```

---

## Category Controller Integration

### File: `Server/src/controllers/categoryController.ts`

### Import Statements

```typescript
import { cacheService } from '../services/cache.service';
import { cacheInvalidationService } from '../services/cache-invalidation.service';
```

### Method: `getAllCategories`

**Add at the beginning:**

```typescript
// Try cache first
const cached = await cacheService.getCategoriesList();
if (cached) {
  logger.debug('Cache hit for categories list');
  return res.status(200).json({
    data: cached
  });
}
```

**Add before the response:**

```typescript
// Cache the categories
await cacheService.setCategoriesList(categories);
```

### Method: `getCategoryById`

**Add at the beginning:**

```typescript
// Try cache first
const cached = await cacheService.getCategoryById(id);
if (cached) {
  logger.debug(`Cache hit for category ${id}`);
  return res.status(200).json(cached);
}
```

**Add before the response:**

```typescript
// Cache the category
await cacheService.setCategoryById(id, category);
```

### Method: `createCategory`

**Add after successful creation:**

```typescript
// Invalidate categories cache
await cacheInvalidationService.invalidateCategoryUpdate(savedCategory.id);
```

### Method: `updateCategory`

**Add after successful update:**

```typescript
// Invalidate categories cache
await cacheInvalidationService.invalidateCategoryUpdate(id);
```

### Method: `deleteCategory`

**Add after successful deletion:**

```typescript
// Invalidate categories cache
await cacheInvalidationService.invalidateCategoryUpdate(id);
```

---

## Rate Limiting Migration

### File: `Server/src/middlewares/rateLimitMiddleware.ts`

**Replace the entire file with:**

```typescript
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request, Response } from 'express';
import { ApiError } from './errorHandler';
import { redisService } from '../services/redis.service';

/**
 * Rate limiter for authentication endpoints
 * Limits login, registration, and OTP verification attempts
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known issue with ioredis types
    client: redisService.getClient(),
    prefix: 'rl:auth:',
  }),
  handler: (_req: Request, _res: Response) => {
    throw new ApiError(429, 'Too many authentication attempts, please try again later');
  }
});

/**
 * Rate limiter for general API endpoints
 * Prevents abuse of the API
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known issue with ioredis types
    client: redisService.getClient(),
    prefix: 'rl:api:',
  }),
  handler: (_req: Request, _res: Response) => {
    throw new ApiError(429, 'Too many requests, please try again later');
  }
});

/**
 * Rate limiter for user creation endpoints
 * Prevents mass account creation
 */
export const createUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known issue with ioredis types
    client: redisService.getClient(),
    prefix: 'rl:user:',
  }),
  handler: (_req: Request, _res: Response) => {
    throw new ApiError(429, 'Too many user creation attempts, please try again later');
  }
});
```

---

## Environment Variables

### File: `Server/.env.example`

**Add these lines:**

```bash
# Redis Cache Configuration
REDIS_CACHE_ENABLED=true
REDIS_COMPRESSION_ENABLED=true
REDIS_CIRCUIT_BREAKER_ENABLED=true
```

---

## Testing Checklist

### Manual Testing

1. **Test Cache Hit:**
   - Make GET request to `/api/games/:id`
   - Make same request again - should be faster
   - Check logs for "Cache hit" message

2. **Test Cache Invalidation:**
   - GET a game
   - UPDATE the game
   - GET the game again - should show updated data

3. **Test Redis Failure:**
   - Stop Redis
   - Make API requests - should still work (slower)
   - Check logs for circuit breaker messages

### Automated Tests

Create test file: `Server/src/services/__tests__/cache.service.test.ts`

```typescript
import { cacheService } from '../cache.service';
import { redisService } from '../redis.service';

describe('CacheService', () => {
  beforeAll(async () => {
    await redisService.connect();
  });

  afterAll(async () => {
    await redisService.disconnect();
  });

  it('should cache and retrieve a game', async () => {
    const mockGame = { id: 'test-123', title: 'Test Game' };

    await cacheService.setGameById('test-123', mockGame);
    const cached = await cacheService.getGameById('test-123');

    expect(cached).toEqual(mockGame);
  });

  it('should invalidate game cache', async () => {
    const mockGame = { id: 'test-456', title: 'Test Game 2' };

    await cacheService.setGameById('test-456', mockGame);
    await cacheService.invalidateGame('test-456');
    const cached = await cacheService.getGameById('test-456');

    expect(cached).toBeNull();
  });
});
```

---

## Performance Monitoring

### Add Cache Stats Endpoint

**File:** `Server/src/routes/admin.routes.ts` (or create if doesn't exist)

```typescript
import { Router } from 'express';
import { cacheService } from '../services/cache.service';

const router = Router();

router.get('/cache/stats', async (req, res) => {
  const stats = await cacheService.getStats();
  res.json(stats);
});

router.post('/cache/clear', async (req, res) => {
  await cacheService.clearAll();
  res.json({ message: 'Cache cleared successfully' });
});

export default router;
```

---

## Deployment Notes

1. **Redis must be running** before starting the application
2. **Environment variables** must be set
3. **Monitor cache hit rates** via `/admin/cache/stats`
4. **Clear cache** if needed via `/admin/cache/clear`

---

## Next Steps

1. Apply the code changes above to the controllers
2. Update rate limiting middleware
3. Add environment variables
4. Test manually
5. Add automated tests
6. Monitor performance in staging
7. Deploy to production with feature flag
