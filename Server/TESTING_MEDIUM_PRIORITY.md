# Testing Guide - Medium Priority Optimizations

## Quick Test Checklist

- [ ] **Rate Limiting**: Test all 4 specialized limiters
- [ ] **Cache Warming**: Run script and verify cache
- [ ] **Database Indexes**: Run migration and verify performance

---

## 1. Test Multi-Tier Rate Limiting

### Test A: Upload Limiter (10 req/5min)
```bash
TOKEN="YOUR_TOKEN"

# Should succeed for first 10 requests
for i in {1..10}; do
  echo "Request $i"
  curl -s -X POST "http://localhost:5000/api/games/presigned-url" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"fileName":"test.zip","gameId":"test-game-id"}' | jq '.success'
done

# 11th request should be rate limited (429)
curl -X POST "http://localhost:5000/api/games/presigned-url" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.zip","gameId":"test-game-id"}'
# Expected: 429 Too Many Requests
```

### Test B: Like Limiter (30 req/min)
```bash
GAME_ID="YOUR_GAME_ID"

# Should succeed for first 30 requests
for i in {1..30}; do
  echo "Like $i"
  curl -s -X POST "http://localhost:5000/api/games/$GAME_ID/like" \
    -H "Authorization: Bearer $TOKEN" | jq '.success'
done

# 31st request should be rate limited
curl -X POST "http://localhost:5000/api/games/$GAME_ID/like" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 429 Too Many Requests
```

### Test C: Analytics Limiter (100 req/min)
```bash
# Test high volume - should allow 100 requests
for i in {1..100}; do
  echo "Analytics $i"
  curl -s -X POST "http://localhost:5000/api/analytics" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"activityType":"test","startTime":"2025-12-17T16:00:00Z"}' | jq '.success'
done

# 101st request should be rate limited
curl -X POST "http://localhost:5000/api/analytics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activityType":"test","startTime":"2025-12-17T16:00:00Z"}'
# Expected: 429 Too Many Requests
```

### Test D: Admin Limiter (300 req/min)
```bash
# Test high volume admin requests
for i in {1..300}; do
  echo "Admin request $i"
  curl -s "http://localhost:5000/api/admin/dashboard" \
    -H "Authorization: Bearer $TOKEN" | jq '.success'
done

# 301st request should be rate limited
curl "http://localhost:5000/api/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 429 Too Many Requests
```

### Verify Redis Rate Limit Keys
```bash
redis-cli KEYS "rl:*"
# Should show: rl:upload:, rl:like:, rl:analytics:, rl:admin: keys
```

---

## 2. Test Cache Warming Script

### Run Cache Warming
```bash
cd Server
npm run warm-cache
```

**Expected Output:**
```
[Cache Warming] Starting cache warm-up...
[Cache Warming] Database connected
[Cache Warming] Redis connected
[Cache Warming] Loading recently added games...
[Cache Warming] Loaded X recent games
[Cache Warming] Loading popular games...
[Cache Warming] Loaded X popular games
[Cache Warming] Caching individual game details...
[Cache Warming] Cached 10 top game details
[Cache Warming] Checking like counts...
[Cache Warming] Verified X like counts
[Cache Warming] ✓ Cache warm-up completed successfully
```

### Verify Cache Population
```bash
# Check cached games
redis-cli KEYS "cache:*game*" | head -20

# Verify game details cached
redis-cli EXISTS "cache:v1:game:SOME_GAME_ID"
# Should return: 1
```

---

## 3. Test Database Indexes

### Run Migration
```bash
cd Server

# Run migration
npm run typeorm migration:run

# Expected output: Migration AddPerformanceIndexes executed successfully
```

### Verify Indexes Created
```bash
# Connect to PostgreSQL
# Check indexes exist

# Verify analytics index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'analytics'
AND indexname = 'idx_analytics_user_activity_time';

# Verify games status+created index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'games'
AND indexname = 'idx_games_status_created';

# Verify games position index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'games'
AND indexname = 'idx_games_position';
```

### Test Query Performance
```bash
# Before: Check explain plan (should use index)
EXPLAIN ANALYZE
SELECT * FROM analytics
WHERE user_id = 'YOUR_USER_ID'
  AND activity_type = 'game_play'
ORDER BY start_time DESC
LIMIT 20;

# Look for: Index Scan using idx_analytics_user_activity_time
```

---

## Quick Automated Test

```bash
#!/bin/bash

echo "=== Testing Rate Limiters ==="
# Test upload limiter (should pass first 10)
for i in {1..11}; do
  result=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "http://localhost:5000/api/games/presigned-url" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"fileName":"test.zip","gameId":"test"}')
  echo "Upload request $i: $result"
  if [ $i -eq 11 ] && [ $result -eq 429 ]; then
    echo "✓ Upload limiter working"
  fi
done

echo ""
echo "=== Testing Cache Warming ==="
npm run warm-cache
if [ $? -eq 0 ]; then
  echo "✓ Cache warming successful"
fi

echo ""
echo "=== Verify Redis Keys ==="
redis-cli KEYS "cache:*" | wc -l
redis-cli KEYS "rl:*" | wc -l
```

---

## Expected Results

**Rate Limiting:**
- ✅ Upload endpoints limited to 10/5min
- ✅ Like endpoints limited to 30/min
- ✅ Analytics endpoints limited to 100/min
- ✅ Admin endpoints limited to 300/min

**Cache Warming:**
- ✅ Recently added games cached
- ✅ Popular games cached
- ✅ Top 10 game details cached
- ✅ Like counts verified

**Database Indexes:**
- ✅ 3 indexes created successfully
- ✅ Query plans using indexes
- ✅ 2-3x faster query execution

All tests passing means ready for PR!
