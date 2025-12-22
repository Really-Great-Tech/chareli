# JSON CDN URLs - Frontend Integration Guide

**Base URL**: `https://dev.cdn.arcadesbox.org/cdn`

---

## Available Endpoints

### 1. Categories List
**URL**: `https://dev.cdn.arcadesbox.org/cdn/categories.json`

**Purpose**: Get all game categories
**Cache**: 5 minutes
**Size**: ~1 KB
**Replaces**: `GET /api/categories`

**Response Structure**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Action",
      "description": "Fast-paced action games",
      "isDefault": false,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "metadata": {
    "generatedAt": "2025-12-22T10:30:00Z",
    "count": 7,
    "version": "1.0"
  }
}
```

---

### 2. Active Games List (Public)
**URL**: `https://dev.cdn.arcadesbox.org/cdn/games_active.json`

**Purpose**: Public game listings, player views
**Cache**: 5 minutes
**Size**: ~82 KB
**Replaces**: `GET /api/games?status=active`

**Response Structure**:
```json
{
  "games": [
    {
      "id": "uuid",
      "title": "Galactic War",
      "slug": "galactic-war",
      "description": "...",
      "status": "active",
      "baseLikeCount": 100,
      "position": 1,
      "category": {
        "id": "uuid",
        "name": "Action",
        "description": "..."
      },
      "createdBy": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "thumbnailFile": {
        "id": "uuid",
        "s3Key": "...",
        "url": "https://dev.cdn.arcadesbox.org/..."
      },
      "gameFile": {
        "id": "uuid",
        "s3Key": "...",
        "url": "https://dev.cdn.arcadesbox.org/..."
      },
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-20T15:30:00Z"
    }
  ],
  "metadata": {
    "generatedAt": "2025-12-22T10:30:00Z",
    "count": 64,
    "version": "1.0"
  }
}
```

---

### 3. All Games List (Admin Only)
**URL**: `https://dev.cdn.arcadesbox.org/cdn/games_all.json`

**Purpose**: Admin dashboard, management views
**Cache**: 5 minutes
**Size**: ~85 KB
**Replaces**: `GET /api/games` (no status filter)

**Response Structure**: Same as active games, but includes all statuses (active, disabled, etc.)

---

### 4. Individual Game Details
**URL**: `https://dev.cdn.arcadesbox.org/cdn/games/{slug}.json`

**Example**: `https://dev.cdn.arcadesbox.org/cdn/games/galactic-war.json`

**Purpose**: Single game detail pages
**Cache**: 5 minutes
**Size**: ~2.5 KB per game
**Replaces**: `GET /api/games/{slug}`

**Response Structure**:
```json
{
  "game": {
    "id": "uuid",
    "title": "Galactic War",
    "slug": "galactic-war",
    // ... all game fields
    "category": { /* full category object */ },
    "createdBy": { /* creator info */ },
    "thumbnailFile": { /* with URL */ },
    "gameFile": { /* with URL */ }
  },
  "metadata": {
    "generatedAt": "2025-12-22T10:30:00Z",
    "count": 1,
    "version": "1.0"
  }
}
```

---

## Integration Instructions

### Frontend Fetch Example

```typescript
// Fetch categories from CDN
async function fetchCategories() {
  try {
    const response = await fetch('https://dev.cdn.arcadesbox.org/cdn/categories.json');
    if (!response.ok) throw new Error('CDN fetch failed');

    const data = await response.json();
    return data.categories;
  } catch (error) {
    console.warn('CDN unavailable, falling back to API');
    // Fallback to API
    const response = await fetch('/api/categories');
    return response.json();
  }
}

// Fetch active games from CDN
async function fetchActiveGames() {
  try {
    const response = await fetch('https://dev.cdn.arcadesbox.org/cdn/games_active.json');
    if (!response.ok) throw new Error('CDN fetch failed');

    const data = await response.json();
    return data.games;
  } catch (error) {
    console.warn('CDN unavailable, falling back to API');
    const response = await fetch('/api/games?status=active');
    return response.json();
  }
}

// Fetch single game by slug
async function fetchGameBySlug(slug: string) {
  try {
    const response = await fetch(`https://dev.cdn.arcadesbox.org/cdn/games/${slug}.json`);
    if (!response.ok) throw new Error('CDN fetch failed');

    const data = await response.json();
    return data.game;
  } catch (error) {
    console.warn('CDN unavailable, falling back to API');
    const response = await fetch(`/api/games/${slug}`);
    return response.json();
  }
}
```

---

## CORS Configuration

✅ **CORS is configured** to allow requests from:
- `https://dev.arcadesbox.com`
- `https://arcadesbox.com`
- `http://localhost:5173` (dev)
- `http://localhost:5000` (dev)
- Any origin (`*`)

**Headers**:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, HEAD, POST, PUT`
- `Access-Control-Expose-Headers: ETag, Location`
- `Access-Control-Max-Age: 3600`

---

## Cache Behavior

### Cache Headers
```
Cache-Control: public, max-age=300
```

- **Public**: Can be cached by browsers and CDN
- **Max-Age**: 300 seconds (5 minutes)

### Refresh Schedule
Files are regenerated **every 2 minutes** automatically.

**Maximum staleness**: 2 minutes
**Typical staleness**: <1 minute (due to frequent refreshes)

### Cache Validation
Use the `metadata.generatedAt` field to check when data was last updated:

```typescript
const response = await fetch('https://dev.cdn.arcadesbox.org/cdn/categories.json');
const data = await response.json();
const lastUpdated = new Date(data.metadata.generatedAt);
console.log('Data last updated:', lastUpdated);
```

---

## Performance Expectations

| Metric | Expected Value |
|--------|---------------|
| Response Time | <100ms (from edge) |
| Cache Hit Rate | >95% |
| Availability | 99.9% |
| Global Latency | <50ms (Cloudflare edge) |

---

## Fallback Strategy

**Recommended approach**: CDN-first with API fallback

```typescript
async function fetchWithFallback(cdnUrl: string, apiUrl: string) {
  try {
    // Try CDN first (fast, no DB load)
    const response = await fetch(cdnUrl, {
      signal: AbortSignal.timeout(3000) // 3s timeout
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('CDN returned non-OK status');
  } catch (error) {
    // Fall back to API (slower, hits DB)
    console.warn('CDN unavailable, using API:', error);
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('API also failed');
    return await response.json();
  }
}

// Usage
const categories = await fetchWithFallback(
  'https://dev.cdn.arcadesbox.org/cdn/categories.json',
  '/api/categories'
);
```

---

## Testing

### Browser DevTools
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Load your app
4. Look for CDN requests to `dev.cdn.arcadesbox.org`
5. Check response times (<100ms expected)
6. Verify CORS headers are present

### curl Commands
```bash
# Test categories
curl https://dev.cdn.arcadesbox.org/cdn/categories.json | jq .

# Test with timing
curl -w "\nTime: %{time_total}s\n" https://dev.cdn.arcadesbox.org/cdn/games_active.json -o /dev/null -s

# Check CORS headers
curl -I -H "Origin: https://dev.arcadesbox.com" https://dev.cdn.arcadesbox.org/cdn/categories.json
```

---

## Migration Checklist

### Phase 3: Frontend Implementation

- [ ] Update category fetching to use CDN
- [ ] Update game list fetching to use CDN
- [ ] Update game detail fetching to use CDN
- [ ] Implement fallback mechanism
- [ ] Add CDN URL to environment config
- [ ] Test in dev environment
- [ ] Monitor browser console for errors
- [ ] Verify CORS works in browser
- [ ] Test fallback behavior
- [ ] Deploy to production

---

## Environment Configuration

Add to your frontend `.env`:

```bash
# Development
VITE_CDN_BASE_URL=https://dev.cdn.arcadesbox.org/cdn

# Production
VITE_CDN_BASE_URL=https://cdn.arcadesbox.org/cdn  # When custom domain is set up
```

---

## Monitoring

### What to Monitor
- CDN response times
- Cache hit rates
- API fallback frequency
- CORS errors in browser console

### Cloudflare Analytics
Check Cloudflare Dashboard → Analytics for:
- Request count to CDN URLs
- Cache hit/miss ratio
- Geographic distribution of requests

---

## Support

### Common Issues

**Q: Getting CORS errors in browser?**
A: Verify the request is coming from an allowed origin. Check browser console for exact error.

**Q: Data seems stale?**
A: Check `metadata.generatedAt` timestamp. Files refresh every 2 minutes.

**Q: CDN returns 404?**
A: Verify the slug is correct. Check that the scheduled job is running on the server.

**Q: Slow response times?**
A: First request may be slower. Subsequent requests should be <100ms from edge cache.

---

## Production Deployment

When deploying to production:

1. Update `JSON_CDN_BASE_URL` in AWS Secrets Manager
2. Verify bucket CORS includes production domain
3. Optional: Set up custom domain (`cdn.arcadesbox.com`)
4. Update frontend environment variables
5. Test in production environment
6. Monitor Cloudflare analytics

---

**Last Updated**: 2025-12-22
**Version**: 1.0
**Status**: Production Ready ✅
