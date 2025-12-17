# OTP Bypass Setup for Load Testing

## Problem
First-time login requires OTP verification, but k6 tests cannot receive SMS/email OTPs automatically.

## Solution
The test now bypasses OTP by directly updating `hasCompletedFirstLogin = true` via admin endpoint after detecting OTP requirement.

## Setup Required

### 1. Get Admin Token

Login as admin and copy the access token:

```bash
curl -X POST https://api-dev.arcadesbox.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "your-admin@example.com",
    "password": "YourAdminPassword"
  }'
```

Copy the `accessToken` from the response.

### 2. Add to .env.k6

```bash
# Admin token for OTP bypass in load tests
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Test Flow with Bypass

**Full Journey (9 steps)**:

1. **Registration** - Create new user
2. **First Login** - Detect OTP required
3. **OTP Bypass** - Admin PATCH to set `hasCompletedFirstLogin: true`
4. **Second Login** - Get tokens (OTP bypassed)
4b. **Token Refresh** - Test token refresh for new user
6. **Forgot Password (Email)** - Test password reset
7. **Forgot Password (Phone)** - Test phone reset
8. **Existing User Login** - Test with pre-seeded account
9. **Token Refresh (Existing)** - Test token refresh again

## Benefits

- ✅ Full end-to-end auth flow
- ✅ Tests complete user journey
- ✅ Validates token refresh works
- ✅ Each VU is independent (no shared state)
- ✅ Realistic load pattern

## Without Admin Token

If `ADMIN_TOKEN` is not set:
- Steps 1-2 still work (registration + OTP detection)
- Step 3 logs warning but continues
- Steps 4-9 may fail (can't login without OTP completion)
- Test documents the OTP requirement

## Metrics

```
Authentication Journey:
  ✓ Registration Successes: 50/50 (100%)
  ✓ First Login OTP Required: 50/50 (100%)
  ✓ Second Login (Post-OTP): 50/50 (100%) ← Only with admin token
  ✓ Token Refresh Successes: 100/100 (100%) ← Only with admin token
```

## Production Alternative

For production load testing, you have 3 options:

### Option A: Test Mode OTP
Add a test mode that returns a fixed OTP:

```typescript
// In your OTP generation logic
if (process.env.NODE_ENV === 'test') {
  return '123456'; // Fixed OTP for testing
}
```

### Option B: Email/SMS Test Hooks
Integrate with your email/SMS provider's test API to retrieve OTPs programmatically.

### Option C: Pre-verified Users
Create a batch of users with `hasCompletedFirstLogin: true` before load testing.

---

**Current Implementation**: Option using admin bypass (fastest, most flexible)
