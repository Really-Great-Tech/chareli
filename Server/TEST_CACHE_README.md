# Redis Caching Test Suite

This directory contains comprehensive tests for the Redis caching implementation.

## Test Scripts

### `test-cache.sh` - Bash Integration Tests

Comprehensive bash script that tests all caching functionality.

**Prerequisites:**
- Server running on `http://localhost:3000`
- Redis running
- `jq` installed (`brew install jq` or `apt-get install jq`)
- Admin token for admin endpoints

**Usage:**

```bash
# Basic usage (tests public endpoints only)
./test-cache.sh

# With admin token (tests all endpoints)
ADMIN_TOKEN="your_admin_token_here" ./test-cache.sh

# Custom API URL
API_URL="http://localhost:5000/api" ./test-cache.sh

# Full test with all options
API_URL="http://localhost:3000/api" \
ADMIN_TOKEN="your_token" \
./test-cache.sh
```

**What it tests:**

1. **Redis Connection** - Verifies Redis is running
2. **Cache Stats** - Tests `/admin/cache/stats` endpoint
3. **Game Detail Caching** - Tests cache hit/miss for individual games
4. **Games List Caching** - Tests cache hit/miss for game lists
5. **Special Filters** - Tests `recently_added` and `popular` filters
6. **Analytics Caching** - Tests analytics aggregation caching
7. **Cache Invalidation** - Tests cache clearing endpoints
8. **Rate Limiting** - Verifies Redis-backed rate limiting works
9. **Cache Compression** - Checks memory usage and compression

**Expected Output:**

```
========================================
Redis Caching Test Suite
========================================

API URL: http://localhost:3000/api
Admin Token: ***set***

========================================
Checking Redis Connection
========================================

✓ PASS: Redis is running

========================================
Testing Game Detail Caching
========================================

TEST: Getting first game ID
INFO: Using game ID: abc-123-def
TEST: First request (cache miss)
✓ PASS: First request successful (245ms)
TEST: Second request (cache hit)
✓ PASS: Second request successful (12ms)
✓ PASS: Cache hit was 233ms faster (245ms → 12ms)

...

========================================
Test Summary
========================================

Total Tests: 15
Passed: 15
Failed: 0

All tests passed! ✓
```

## Getting an Admin Token

To test admin endpoints, you need an admin token:

```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@chareli.com",
    "password": "your_admin_password"
  }'

# Copy the token from the response
# Then use it in tests:
ADMIN_TOKEN="eyJhbGc..." ./test-cache.sh
```

## Troubleshooting

**Redis not running:**
```bash
# Start Redis
docker-compose up redis
# or
redis-server
```

**jq not installed:**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

**Server not running:**
```bash
cd Server
npm run dev
```

**Tests failing:**
- Check server logs for errors
- Verify Redis is running: `redis-cli ping`
- Check cache stats: `curl http://localhost:3000/api/admin/cache/stats -H "Authorization: Bearer TOKEN"`
- Clear cache and retry: `curl -X POST http://localhost:3000/api/admin/cache/clear -H "Authorization: Bearer TOKEN"`

## Performance Benchmarks

Expected performance improvements:

| Endpoint | First Request | Cached Request | Improvement |
|----------|--------------|----------------|-------------|
| Game Detail | 150-300ms | <30ms | 8-10x faster |
| Games List | 300-500ms | <50ms | 6-10x faster |
| Analytics | 500-1000ms | <50ms | 10-20x faster |

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Test Redis Caching
  run: |
    docker-compose up -d redis
    npm run dev &
    sleep 5
    ADMIN_TOKEN=${{ secrets.ADMIN_TOKEN }} ./test-cache.sh
```
