// User Operations Load Test
// Tests user-related endpoints including profile, stats, heartbeat, online status

import { group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { config, getScenario } from '../k6-config.js';
import {
  authenticate,
  authenticatedGet,
  authenticatedPost,
  authenticatedPut,
  validateResponse,
  randomSleep,
  parseBody,
} from '../utils/utils.js';

// Custom metrics
const heartbeatRequests = new Counter('heartbeat_requests');
const profileRequests = new Counter('profile_requests');
const statsRequests = new Counter('stats_requests');
const userDuration = new Trend('user_operation_duration');

export const options = {
  scenarios: {
    user_load_test: getScenario(),
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

// Setup: Get auth token and user ID
export function setup() {
  const baseUrl = config.baseUrl;

  const token = authenticate(
    baseUrl,
    config.testUserCredentials.email,
    config.testUserCredentials.password
  );

  if (!token) {
    throw new Error('Failed to authenticate user');
  }

  // Get current user to retrieve user ID
  const meResponse = authenticatedGet(`${baseUrl}/auth/me`, token);
  let userId = null;
  if (meResponse.status === 200) {
    const body = parseBody(meResponse);
    if (body && body.data && body.data.id) {
      userId = body.data.id;
    }
  }

  return { token, userId };
}

export default function (data) {
  const baseUrl = config.baseUrl;
  const { token, userId } = data;

  if (!token) {
    console.error('No token available, skipping user tests');
    return;
  }

  // Test 1: Get Current User (via /auth/me)
  group('GET /auth/me - Get Current User', () => {
    const startTime = Date.now();
    const response = authenticatedGet(`${baseUrl}/auth/me`, token);
    userDuration.add(Date.now() - startTime);

    profileRequests.add(1);

    validateResponse(
      response,
      {
        'get current user returns 200': (r) => r.status === 200,
        'current user has data': (r) => {
          const body = parseBody(r);
          return body && body.data && body.data.id;
        },
        'current user has email': (r) => {
          const body = parseBody(r);
          return body && body.data && body.data.email;
        },
      },
      'Get Current User'
    );

    randomSleep(1, 2);
  });

  // Test 2: Get User Stats
  group('GET /users/me/stats - Get User Stats', () => {
    const response = authenticatedGet(`${baseUrl}/users/me/stats`, token);

    statsRequests.add(1);

    validateResponse(
      response,
      {
        'user stats returns 200': (r) => r.status === 200,
        'user stats has data': (r) => {
          const body = parseBody(r);
          return body && body.data;
        },
      },
      'Get User Stats'
    );

    randomSleep(1, 3);
  });

  // Test 3: Send Heartbeat (for online status)
  group('POST /users/heartbeat - Send Heartbeat', () => {
    const startTime = Date.now();
    const response = authenticatedPost(`${baseUrl}/users/heartbeat`, {}, token);
    userDuration.add(Date.now() - startTime);

    heartbeatRequests.add(1);

    validateResponse(
      response,
      {
        'heartbeat returns 200/204': (r) =>
          r.status === 200 || r.status === 204,
      },
      'Send Heartbeat'
    );

    randomSleep(5, 10); // Heartbeats are typically sent less frequently
  });

  // Test 4: Get Online Status
  group('GET /users/online-status - Get Online Status', () => {
    const response = authenticatedGet(`${baseUrl}/users/online-status`, token);

    validateResponse(
      response,
      {
        'online status returns 200': (r) => r.status === 200,
        'online status has data': (r) => {
          const body = parseBody(r);
          return body && body.data;
        },
      },
      'Get Online Status'
    );

    randomSleep(2, 4);
  });

  // Test 5: Get User by ID (requires owner or admin)
  if (userId) {
    group('GET /users/:id - Get User Profile', () => {
      const response = authenticatedGet(`${baseUrl}/users/${userId}`, token);

      profileRequests.add(1);

      validateResponse(
        response,
        {
          'get user profile returns 200': (r) => r.status === 200,
          'user profile has data': (r) => {
            const body = parseBody(r);
            return body && body.data && body.data.id === userId;
          },
        },
        'Get User Profile'
      );

      randomSleep(1, 2);
    });
  }

  // Test 6: Update User Profile
  if (userId) {
    group('PUT /users/:id - Update User Profile', () => {
      const updateData = {
        username: `user_${Date.now()}`,
      };

      const response = authenticatedPut(
        `${baseUrl}/users/${userId}`,
        updateData,
        token
      );

      validateResponse(
        response,
        {
          'update user returns 200': (r) => r.status === 200,
          'update user has data': (r) => {
            const body = parseBody(r);
            return body && body.data;
          },
        },
        'Update User Profile'
      );

      randomSleep(2, 4);
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/user-load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';

  let summary = `\n${indent}User Load Test Summary\n${indent}${'='.repeat(
    50
  )}\n`;

  if (data.metrics) {
    summary += `\n${indent}HTTP Metrics:\n`;
    summary += `${indent}  - Requests: ${
      data.metrics.http_reqs?.values?.count || 0
    }\n`;
    summary += `${indent}  - Failed: ${
      (data.metrics.http_req_failed?.values?.rate * 100)?.toFixed(2) || 0
    }%\n`;
    summary += `${indent}  - Duration p95: ${
      data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0
    }ms\n`;
    summary += `${indent}  - Duration p99: ${
      data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0
    }ms\n`;

    summary += `\n${indent}User Operation Metrics:\n`;
    summary += `${indent}  - Heartbeat Requests: ${
      data.metrics.heartbeat_requests?.values?.count || 0
    }\n`;
    summary += `${indent}  - Profile Requests: ${
      data.metrics.profile_requests?.values?.count || 0
    }\n`;
    summary += `${indent}  - Stats Requests: ${
      data.metrics.stats_requests?.values?.count || 0
    }\n`;
  }

  return summary;
}
