# CRITICAL: Database Connection Pool Exhaustion at 10 VUs

## Issue Discovered

**Test**: Auth smoke test with **only 10 virtual users**
**Error**: `MaxClientsInSessionMode: max clients reached - in Session mode max clients are limited to pool_size`

## What This Means

Your **Supabase Micro database connection pool is being exhausted by just 10 concurrent users**. This is a critical infrastructure bottleneck that needs immediate attention.

### Connection Pool Analysis

**Supabase Micro Specs:**
- Direct connections: 120
- **Pooler connections: 1,000** (should be plenty)
- But getting: "max clients reached in Session mode"

**This suggests:**
1. ❌ Session pooling mode has much lower limits than transaction mode
2. ❌ Connection leaks - connections not being released
3. ❌ TypeORM connection pool misconfigured

## Root Causes

### Likely Cause: Supavisor Session Mode Limits

Supabase's Supavisor pooler has two modes:
- **Transaction mode**: High capacity (1,000 connections)
- **Session mode**: Much lower capacity (limited to `pool_size` setting)

**Your connection string is likely using Session mode**, which has a much smaller pool.

### How to Check

Look at your DATABASE_URL in `.env`:
```
# Transaction mode (good, high capacity)
postgres://user:pass@aws-0-region.pooler.supabase.com:6543/postgres

# Session mode (bad, low capacity)
postgres://user:pass@aws-0-region.pooler.supabase.com:5432/postgres
```

**Port 6543** = Transaction pooling (high capacity)
**Port 5432** = Session pooling (low capacity) ← **You're likely here**

## Impact on Load Testing

| VU Count | Expected | Reality |
|----------|----------|---------|
| 10 VUs | ✅ Should work fine | ❌ **Pool exhausted** |
| 100 VUs | ✅ Should be easy | ❌ **Will fail completely** |
| 1,000 VUs | ✅ Good with transaction mode | ❌ **Impossible** |
| 20,000 VUs | ⚠️ Near limits | ❌ **Not even close** |

**Bottom line**: You cannot load test beyond ~10 users with current setup.

## Solutions

### Immediate Fix: Switch to Transaction Pooling Mode

**Change your DATABASE_URL** from port 5432 to port 6543:

```bash
# In your .env or Secrets Manager
# OLD (Session mode):
DATABASE_URL=postgres://user:pass@aws-0-region.pooler.supabase.com:5432/postgres

# NEW (Transaction mode):
DATABASE_URL=postgres://user:pass@aws-0-region.pooler.supabase.com:6543/postgres
```

**Why this works:**
- Transaction mode pools connections more efficiently
- Can handle 1,000+ concurrent connections
- Each request gets a connection only for the duration of the transaction
- Connections are released immediately after query completes

### Additional Fixes

1. **Reduce TypeORM connection pool size** in your app:
```typescript
// In database config
{
  type: 'postgres',
  poolSize: 5,  // Reduce from 10 to 5 per instance
  max: 5,
  // ... other config
}
```

2. **Check for connection leaks**:
```typescript
// Make sure all queries use transactions or properly release
await dataSource.transaction(async (manager) => {
  // Your queries here
  // Connection auto-released
});
```

3. **Enable query timeout**:
```typescript
{
  extra: {
    statement_timeout: 30000,  // 30 second timeout
    query_timeout: 30000,
  }
}
```

## Verification Steps

After switching to transaction pooling:

```bash
# Run smoke test again
cd ~/chareli-1/Server/k6
k6 run --env BASE_URL=https://api-dev.arcadesbox.com/api \
  --env TEST_MODE=smoke \
  tests/auth-load-test.js
```

**Expected result**: No more "max clients reached" errors

## Long-term Recommendations

### For Dev Environment

1. ✅ Switch to transaction pooling (port 6543)
2. ✅ Reduce app connection pool size to 5 per instance
3. ✅ This should handle 100-500 concurrent users easily

### For Production (20k users)

1. Consider **Supabase Pro** ($99/mo) for:
   - Dedicated resources
   - Better connection pooling
   - More predictable performance

2. Or use **Dedicated Pooler** addon:
   - Independent connection pooler
   - Not affected by compute limits
   - Higher connection limits

3. **Optimize queries**:
   - Add missing indexes
   - Use query result caching
   - Implement read replicas if needed

## Current Test Results (Before Fix)

- 68% failure rate
- Connection pool exhausted multiple times
- **Cannot proceed with load testing** until this is fixed

## Action Required

**Before any further load testing:**

1. ✅ Update DATABASE_URL to use port 6543 (transaction pooling)
2. ✅ Redeploy application
3. ✅ Run smoke test to verify fix
4. ✅ Only then proceed to higher VU counts

---

**Priority**: 🔴 **CRITICAL** - Blocks all load testing
**Effort**: 5 minutes (change connection string)
**Impact**: Enables testing with 100-1000+ VUs

---

**Document Date**: 2025-12-17
**Discovered During**: Auth smoke test (10 VUs)
**Status**: ❌ **Blocking Issue** - Must fix before proceeding
