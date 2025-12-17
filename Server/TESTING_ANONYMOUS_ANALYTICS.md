# Testing Guide - Anonymous User Analytics

## Test Checklist

- [ ] **Server Startup**: Verify database connects successfully
- [ ] **Anonymous User**: Test analytics with sessionId (no auth)
- [ ] **Logged-in User**: Test analytics with userId (with auth)
- [ ] **Queue Processing**: Verify both job types process
- [ ] **Database**: Verify both record types saved

---

## 1. Verify Server Startup

```bash
# Should see:
# ✅ Database connection established
# ✅ Analytics worker initialized
# ✅ Like worker initialized
```

**Check logs for errors** - sessionId column should work now.

---

## 2. Test Anonymous User Analytics

### Test A: Send Analytics Without Authentication
```bash
# No auth token - anonymous user
curl -X POST "http://localhost:5000/api/analytics" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "anon-session-abc123",
    "activityType": "game_play",
    "gameId": "d1fbe524-b5e6-434c-91c4-bd3e7032fc72",
    "startTime": "2025-12-17T17:30:00Z"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Analytics event queued for processing"
}
```

**Status Code**: `202 Accepted`

### Test B: Verify Queue Processing
```bash
# Wait 2-3 seconds, then check Redis
redis-cli ZCARD "bull:analytics-processing:completed"
# Should show increased count
```

### Test C: Check Database
```sql
-- Verify anonymous analytics saved
SELECT id, user_id, session_id, activity_type, created_at
FROM internal.analytics
WHERE session_id = 'anon-session-abc123'
LIMIT 5;
```

**Expected**: Row with `user_id = NULL`, `session_id = 'anon-session-abc123'`

---

## 3. Test Logged-in User Analytics

### Test A: Send Analytics With Authentication
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNGNlODFlNy1kYmEwLTRjNmYtODc3Zi03NGNiMDQwZjU1YTciLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6InN1cGVyYWRtaW4iLCJpYXQiOjE3NjU5ODQ3MjJ9.UEzd0dfU9BYiNLnehSlkgtcW8kHqI56Ft1Cmp-CkIjA"

curl -X POST "http://localhost:5000/api/analytics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "game_play",
    "gameId": "d1fbe524-b5e6-434c-91c4-bd3e7032fc72",
    "startTime": "2025-12-17T17:30:00Z"
  }'
```

**Expected Response**: Same `202 Accepted`

### Test B: Verify Database
```sql
-- Verify logged-in user analytics
SELECT id, user_id, session_id, activity_type
FROM internal.analytics
WHERE user_id = '34ce81e7-dba0-4c6f-877f-74cb040f55a7'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: Row with `user_id = '34ce81e7...'`, `session_id = NULL`

---

## 4. Test Error Cases

### Test A: Missing Both userId AND sessionId
```bash
# Should fail - no auth and no sessionId
curl -X POST "http://localhost:5000/api/analytics" \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "test",
    "startTime": "2025-12-17T17:30:00Z"
  }'
```

**Expected**: `400 Bad Request` - "Either authentication or sessionId is required"

---

## 5. Verify Worker Logs

Check server logs for:

```
[Analytics Worker] Processing analytics job... for session anon-session-abc123
[Analytics Worker] Successfully saved analytics... for session anon-session-abc123

[Analytics Worker] Processing analytics job... for user 34ce81e7...
[Analytics Worker] Successfully saved analytics... for user 34ce81e7...
```

---

## Quick Test Script

```bash
#!/bin/bash

echo "=== Testing Anonymous Analytics ==="

# Test anonymous user
echo "1. Testing anonymous user (no auth)..."
anon_result=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "http://localhost:5000/api/analytics" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-session-123","activityType":"test","startTime":"2025-12-17T17:00:00Z"}')

if [ "$anon_result" = "202" ]; then
  echo "✓ Anonymous user test passed (202)"
else
  echo "✗ Anonymous user test failed ($anon_result)"
fi

# Test logged-in user
echo "2. Testing logged-in user (with auth)..."
TOKEN="YOUR_TOKEN"
auth_result=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "http://localhost:5000/api/analytics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activityType":"test","startTime":"2025-12-17T17:00:00Z"}')

if [ "$auth_result" = "202" ]; then
  echo "✓ Logged-in user test passed (202)"
else
  echo "✗ Logged-in user test failed ($auth_result)"
fi

# Check queue
echo "3. Checking queue processing..."
sleep 3
completed=$(redis-cli ZCARD "bull:analytics-processing:completed")
echo "Completed jobs: $completed"

echo "=== Tests Complete ==="
```

---

## Expected Results

✅ **Anonymous users** can send analytics without logging in
✅ **Logged-in users** analytics still work as before
✅ **Queue processing** handles both types
✅ **Database** stores with correct userId or sessionId
✅ **Worker logs** show both user types

All tests passing = Ready for PR!
