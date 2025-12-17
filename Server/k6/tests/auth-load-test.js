// Authentication Load Test
// Tests all authentication-related endpoints including login, registration, OTP, password reset

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
const loginAttempts = new Counter('login_attempts');
const loginSuccesses = new Counter('login_successes');
const registrationAttempts = new Counter('registration_attempts');
const registrationSuccesses = new Counter('registration_successes');
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

  // Test 1: User Registration
  group('POST /auth/register - User Registration', () => {
    const payload = {
      firstName: `Test${randomString(4)}`,
      lastName: `User${randomString(4)}`,
      email: randomEmail(),
      password: 'TestPassword123!',
      phoneNumber: randomPhone(),
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
        'registration returns 200 or 201': (r) =>
          r.status === 200 || r.status === 201,
        'registration has data': (r) => {
          const body = parseBody(r);
          return body && body.data;
        },
      },
      'User Registration'
    );

    if (success) {
      registrationSuccesses.add(1);
    }

    randomSleep(1, 3);
  });

  // Test 2: User Login
  group('POST /auth/login - User Login', () => {
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

    const success = validateResponse(
      response,
      {
        'login returns 200': (r) => r.status === 200,
        'login has access token': (r) => {
          const body = parseBody(r);
          return body && body.data && body.data.accessToken;
        },
        'login has refresh token': (r) => {
          const body = parseBody(r);
          return body && body.data && body.data.refreshToken;
        },
      },
      'User Login'
    );

    if (success) {
      loginSuccesses.add(1);
    }

    randomSleep(1, 2);
  });

  // Test 3: Request OTP
  group('POST /auth/request-otp - Request OTP', () => {
    const payload = {
      phoneNumber: randomPhone(),
    };

    const response = http.post(
      `${baseUrl}/auth/request-otp`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    // OTP might fail for non-existent users in test environment
    check(response, {
      'request-otp completes': (r) => r.status >= 200 && r.status < 500,
    });

    randomSleep(2, 4);
  });

  // Test 4: Forgot Password (Email)
  group('POST /auth/forgot-password - Forgot Password Email', () => {
    const payload = {
      email: randomEmail(), // Random email for testing
    };

    const response = http.post(
      `${baseUrl}/auth/forgot-password`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(response, {
      'forgot-password completes': (r) => r.status >= 200 && r.status < 500,
    });

    randomSleep(1, 3);
  });

  // Test 5: Forgot Password (Phone)
  group('POST /auth/forgot-password/phone - Forgot Password Phone', () => {
    const payload = {
      phoneNumber: randomPhone(),
    };

    const response = http.post(
      `${baseUrl}/auth/forgot-password/phone`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(response, {
      'forgot-password-phone completes': (r) =>
        r.status >= 200 && r.status < 500,
    });

    randomSleep(1, 2);
  });

  // Test 6: Refresh Token (requires valid refresh token - might fail in load test)
  group('POST /auth/refresh-token - Refresh Token', () => {
    // First, login to get tokens
    const loginPayload = {
      identifier: config.testUserCredentials.email,
      password: config.testUserCredentials.password,
    };

    const loginResponse = http.post(
      `${baseUrl}/auth/login`,
      JSON.stringify(loginPayload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (loginResponse.status === 200) {
      const loginBody = parseBody(loginResponse);
      if (loginBody && loginBody.data && loginBody.data.refreshToken) {
        const refreshPayload = {
          refreshToken: loginBody.data.refreshToken,
        };

        const response = http.post(
          `${baseUrl}/auth/refresh-token`,
          JSON.stringify(refreshPayload),
          { headers: { 'Content-Type': 'application/json' } }
        );

        validateResponse(
          response,
          {
            'refresh-token returns 200': (r) => r.status === 200,
            'refresh-token has new access token': (r) => {
              const body = parseBody(r);
              return body && body.data && body.data.accessToken;
            },
          },
          'Refresh Token'
        );
      }
    }

    randomSleep(1, 2);
  });

  // Add overall sleep to simulate user think time
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
  const enableColors = options.enableColors || false;

  let summary = `\n${indent}Authentication Load Test Summary\n${indent}${'='.repeat(
    50
  )}\n`;

  if (data.metrics) {
    summary += `\n${indent}HTTP Metrics:\n`;
    summary += `${indent}  - Requests: ${
      data.metrics.http_reqs?.values?.count || 0
    }\n`;
    summary += `${indent}  - Failed: ${
      data.metrics.http_req_failed?.values?.rate || 0
    }\n`;
    summary += `${indent}  - Duration p95: ${
      data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0
    }ms\n`;
    summary += `${indent}  - Duration p99: ${
      data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0
    }ms\n`;

    summary += `\n${indent}Authentication Metrics:\n`;
    summary += `${indent}  - Login Attempts: ${
      data.metrics.login_attempts?.values?.count || 0
    }\n`;
    summary += `${indent}  - Login Successes: ${
      data.metrics.login_successes?.values?.count || 0
    }\n`;
    summary += `${indent}  - Registration Attempts: ${
      data.metrics.registration_attempts?.values?.count || 0
    }\n`;
    summary += `${indent}  - Registration Successes: ${
      data.metrics.registration_successes?.values?.count || 0
    }\n`;
  }

  return summary;
}
