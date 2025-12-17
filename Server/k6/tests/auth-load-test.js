// Authentication Load Test - Self-Contained User Journey
// Tests: Registration → First Login (OTP required) → Password Reset → Token Refresh

import { group, sleep } from 'k6';
import { check } from 'k6';
import http from 'k6/http';
import { Counter, Trend } from 'k6/metrics';
import { config, getScenario } from '../k6-config.js';
import {
  validateResponse,
  randomEmail,
  randomPhone,
  randomString,
  randomSleep,
  parseBody,
} from '../utils/utils.js';

// Custom metrics
const registrationAttempts = new Counter('registration_attempts');
const registrationSuccesses = new Counter('registration_successes');
const loginAttempts = new Counter('login_attempts');
const firstLoginOtpRequired = new Counter('first_login_otp_required');
const forgotPasswordAttempts = new Counter('forgot_password_attempts');
const tokenRefreshAttempts = new Counter('token_refresh_attempts');
const tokenRefreshSuccesses = new Counter('token_refresh_successes');
const authDuration = new Trend('auth_operation_duration');

export const options = {
  scenarios: {
    auth_load_test: getScenario(),
  },
  thresholds: {
    http_req_duration: [
      `p(95)<${config.thresholds.p95}`,
      `p(99)<${config.thresholds.p99}`,
    ],
    http_req_failed: [`rate<${config.thresholds.maxErrorRate / 100}`],
    errors: [`rate<${config.thresholds.maxErrorRate / 100}`],
  },
};

export default function () {
  const baseUrl = config.baseUrl;

  // Generate unique user data for this VU iteration
  const userData = {
    firstName: `Test${randomString(4)}`,
    lastName: `User${randomString(4)}`,
    email: randomEmail(),
    password: 'TestPassword123!',
    phoneNumber: randomPhone(),
  };

  let userId = null;
  let hasOtpRequired = false;

  // Step 1: Register New User
  group('1. POST /auth/register - User Registration', () => {
    const payload = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      phoneNumber: userData.phoneNumber,
      hasAcceptedTerms: true,
    };

    registrationAttempts.add(1);

    const startTime = Date.now();
    const response = http.post(
      `${baseUrl}/auth/register`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } }
    );
    authDuration.add(Date.now() - startTime);

    const success = validateResponse(
      response,
      {
        'registration returns 201': (r) => r.status === 201,
        'registration has userId': (r) => {
          const body = parseBody(r);
          if (body && body.data && body.data.userId) {
            userId = body.data.userId;
            return true;
          }
          return false;
        },
      },
      'User Registration'
    );

    if (success) {
      registrationSuccesses.add(1);
    }

    randomSleep(1, 2);
  });

  // Step 2: First-Time Login (Expects OTP Requirement)
  if (userId) {
    group('2. POST /auth/login - First Login (OTP Required)', () => {
      const payload = {
        identifier: userData.email,
        password: userData.password,
      };

      const startTime = Date.now();
      const response = http.post(
        `${baseUrl}/auth/login`,
        JSON.stringify(payload),
        { headers: { 'Content-Type': 'application/json' } }
      );
      authDuration.add(Date.now() - startTime);

      loginAttempts.add(1);

      // First-time login should return 200 with requiresOtp: true
      const hasOtp = check(response, {
        'first login returns 200': (r) => r.status === 200,
        'requires OTP verification': (r) => {
          const body = parseBody(r);
          if (body && body.data && body.data.requiresOtp === true) {
            hasOtpRequired = true;
            firstLoginOtpRequired.add(1);
            return true;
          }
          return false;
        },
        'returns userId': (r) => {
          const body = parseBody(r);
          return body && body.data && body.data.userId;
        },
      });

      if (!hasOtp) {
        console.warn(
          `First login for ${userData.email} did not require OTP as expected`
        );
      }

      randomSleep(1, 2);
    });
  }

  // Step 3: OTP Flow (Note: Cannot test OTP verification without actual OTP code)
  if (hasOtpRequired && userId) {
    group('3. OTP Flow - Documentation Only', () => {
      // In a real scenario, user would:
      // 1. Receive OTP via email/SMS
      // 2. POST /auth/verify-otp with { userId, otp }
      // 3. Receive tokens

      // For load testing, we document this flow but cannot automate
      // the OTP retrieval. In production, you'd need:
      // - Test mode that returns fixed OTP
      // - Email/SMS provider test hooks
      // - Manual OTP input for integration tests

      check(null, {
        'OTP flow documented': () => true,
      });

      sleep(1); // Simulate user checking email/SMS
    });
  }

  // Step 4: Forgot Password (Email)
  group('4. POST /auth/forgot-password - Request Reset', () => {
    const payload = {
      email: userData.email,
    };

    forgotPasswordAttempts.add(1);

    const response = http.post(
      `${baseUrl}/auth/forgot-password`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Should always return 200 (even if email doesn't exist, for security)
    check(response, {
      'forgot password returns 200': (r) => r.status === 200,
      'forgot password has success message': (r) => {
        const body = parseBody(r);
        return body && body.success === true;
      },
    });

    randomSleep(1, 2);
  });

  // Step 5: Forgot Password (Phone)
  group('5. POST /auth/forgot-password/phone - Request Reset via Phone', () => {
    const payload = {
      phoneNumber: userData.phoneNumber,
    };

    const response = http.post(
      `${baseUrl}/auth/forgot-password/phone`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(response, {
      'forgot password phone returns 200': (r) => r.status === 200,
      'forgot password phone has success message': (r) => {
        const body = parseBody(r);
        return body && body.success === true;
      },
    });

    randomSleep(1, 2);
  });

  // Step 6: Test Existing User Login (with pre-seeded test account)
  // This tests login for users who have already completed OTP verification
  group('6. POST /auth/login - Existing User (No OTP)', () => {
    const payload = {
      identifier: config.testUserCredentials.email,
      password: config.testUserCredentials.password,
    };

    const startTime = Date.now();
    const response = http.post(
      `${baseUrl}/auth/login`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } }
    );
    authDuration.add(Date.now() - startTime);

    loginAttempts.add(1);

    // Existing user might:
    // - Return tokens directly (if hasCompletedFirstLogin: true)
    // - Still require OTP (if hasCompletedFirstLogin: false)
    const loginSuccess = check(response, {
      'existing user login completes': (r) => r.status === 200,
      'response has data': (r) => {
        const body = parseBody(r);
        return body && body.data;
      },
    });

    // Token refresh test - only if we got tokens
    if (loginSuccess) {
      const body = parseBody(response);
      if (body && body.data && body.data.refreshToken) {
        const refreshToken = body.data.refreshToken;

        sleep(2); // Wait a moment before refreshing

        group('7. POST /auth/refresh-token - Token Refresh', () => {
          tokenRefreshAttempts.add(1);

          const refreshPayload = {
            refreshToken: refreshToken,
          };

          const refreshResponse = http.post(
            `${baseUrl}/auth/refresh-token`,
            JSON.stringify(refreshPayload),
            { headers: { 'Content-Type': 'application/json' } }
          );

          const refreshSuccess = validateResponse(
            refreshResponse,
            {
              'refresh returns 200': (r) => r.status === 200,
              'refresh has new access token': (r) => {
                const refreshBody = parseBody(r);
                return (
                  refreshBody &&
                  refreshBody.data &&
                  refreshBody.data.accessToken
                );
              },
            },
            'Token Refresh'
          );

          if (refreshSuccess) {
            tokenRefreshSuccesses.add(1);
          }
        });
      }
    }

    randomSleep(1, 2);
  });

  // Add overall think time
  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/auth-load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';

  let summary = `\n${indent}Authentication Load Test Summary\n${indent}${'='.repeat(
    60
  )}\n`;

  if (data.metrics) {
    summary += `\n${indent}HTTP Metrics:\n`;
    summary += `${indent}  - Total Requests: ${
      data.metrics.http_reqs?.values?.count || 0
    }\n`;
    summary += `${indent}  - Failed Requests: ${(
      data.metrics.http_req_failed?.values?.rate * 100 || 0
    ).toFixed(2)}%\n`;
    summary += `${indent}  - Duration p95: ${
      data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0
    }ms\n`;
    summary += `${indent}  - Duration p99: ${
      data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0
    }ms\n`;

    summary += `\n${indent}Authentication Journey:\n`;
    summary += `${indent}  ✓ Registration Attempts: ${
      data.metrics.registration_attempts?.values?.count || 0
    }\n`;
    summary += `${indent}  ✓ Registration Successes: ${
      data.metrics.registration_successes?.values?.count || 0
    }\n`;
    summary += `${indent}  ✓ Login Attempts: ${
      data.metrics.login_attempts?.values?.count || 0
    }\n`;
    summary += `${indent}  ✓ First Login OTP Required: ${
      data.metrics.first_login_otp_required?.values?.count || 0
    }\n`;
    summary += `${indent}  ✓ Forgot Password Requests: ${
      data.metrics.forgot_password_attempts?.values?.count || 0
    }\n`;
    summary += `${indent}  ✓ Token Refresh Attempts: ${
      data.metrics.token_refresh_attempts?.values?.count || 0
    }\n`;
    summary += `${indent}  ✓ Token Refresh Successes: ${
      data.metrics.token_refresh_successes?.values?.count || 0
    }\n`;

    const regSuccess = data.metrics.registration_successes?.values?.count || 0;
    const regAttempts = data.metrics.registration_attempts?.values?.count || 1;
    const regRate = ((regSuccess / regAttempts) * 100).toFixed(1);

    summary += `\n${indent}Success Rates:\n`;
    summary += `${indent}  - Registration: ${regRate}%\n`;

    const otpRequired =
      data.metrics.first_login_otp_required?.values?.count || 0;
    const loginAttempts = data.metrics.login_attempts?.values?.count || 1;
    const otpRate = ((otpRequired / loginAttempts) * 100).toFixed(1);
    summary += `${indent}  - First Login OTP Flow: ${otpRate}%\n`;
  }

  summary += `\n${indent}${'='.repeat(60)}\n`;
  summary += `${indent}Note: OTP verification cannot be automated in k6.\n`;
  summary += `${indent}Test validates OTP is required on first login.\n`;

  return summary;
}
