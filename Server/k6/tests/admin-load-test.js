// Admin Dashboard Load Test
// Tests admin-only endpoints including analytics, user management, and cache operations

import { group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { config, getScenario } from '../k6-config.js';
import {
  authenticate,
  authenticatedGet,
  authenticatedPost,
  validateResponse,
  randomSleep,
  parseBody,
} from '../utils/utils.js';

// Custom metrics
const dashboardRequests = new Counter('dashboard_requests');
const analyticsRequests = new Counter('analytics_requests');
const cacheOperations = new Counter('cache_operations');
const adminDuration = new Trend('admin_operation_duration');

export const options = {
  scenarios: {
    admin_load_test: getScenario(),
  },
  thresholds: {
    http_req_duration: [
      `p(95)<${config.thresholds.p95 * 1.5}`,
      `p(99)<${config.thresholds.p99 * 1.5}`,
    ], // Higher threshold for admin queries
    http_req_failed: [`rate<${config.thresholds.maxErrorRate / 100}`],
    errors: [`rate<${config.thresholds.maxErrorRate / 100}`],
  },
};

// Setup: Get admin auth token
export function setup() {
  const payload = {
    email: config.adminCredentials.email,
    password: config.adminCredentials.password,
  };

  const response = http.post(
    `${config.baseUrl}/auth/login`,
    JSON.stringify(payload),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (response.status !== 200) {
    console.error(
      `Authentication failed for ${config.adminCredentials.email}: ${response.status} - ${response.body}`
    );
    throw new Error('Failed to authenticate as admin');
  }

  const body = parseBody(response);

  // Check for tokens in nested structure: data.tokens.accessToken
  const accessToken =
    body?.data?.tokens?.accessToken || body?.data?.accessToken;

  if (!accessToken) {
    console.error(
      `Authentication failed for ${config.adminCredentials.email}: No access token in response - ${response.body}`
    );
    throw new Error('Failed to authenticate as admin');
  }

  return accessToken;
}

export default function (data) {
  const baseUrl = config.baseUrl;
  // The setup function now returns the token directly, not an object
  const adminToken = data;

  if (!adminToken) {
    console.error('No admin token available, skipping admin tests');
    return;
  }

  // Test 1: Get Dashboard Analytics
  group('GET /admin/dashboard - Dashboard Analytics', () => {
    const startTime = Date.now();
    const response = authenticatedGet(`${baseUrl}/admin/dashboard`, adminToken);
    adminDuration.add(Date.now() - startTime);

    dashboardRequests.add(1);

    validateResponse(
      response,
      {
        'dashboard returns 200': (r) => r.status === 200,
        'dashboard has data': (r) => {
          const body = parseBody(r);
          return body && body.data;
        },
      },
      'Dashboard Analytics'
    );

    randomSleep(2, 4);
  });

  // Test 2: Get Games Popularity Metrics
  group('GET /admin/games-popularity - Games Popularity', () => {
    const response = authenticatedGet(
      `${baseUrl}/admin/games-popularity`,
      adminToken
    );

    analyticsRequests.add(1);

    validateResponse(
      response,
      {
        'games popularity returns 200': (r) => r.status === 200,
        'games popularity has data': (r) => {
          const body = parseBody(r);
          return body && body.data;
        },
      },
      'Games Popularity'
    );

    randomSleep(1, 3);
  });

  // Test 3: Get All Games with Analytics
  group('GET /admin/games-analytics - Games Analytics', () => {
    const response = authenticatedGet(
      `${baseUrl}/admin/games-analytics`,
      adminToken
    );

    analyticsRequests.add(1);

    validateResponse(
      response,
      {
        'games analytics returns 200': (r) => r.status === 200,
        'games analytics has array': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
      },
      'Games Analytics'
    );

    randomSleep(2, 4);
  });

  // Test 4: Get All Users with Analytics
  group('GET /admin/users-analytics - Users Analytics', () => {
    const sortOptions = ['createdAt', 'lastLoggedIn', 'email'];
    const sortBy = sortOptions[Math.floor(Math.random() * sortOptions.length)];
    const sortOrder = Math.random() > 0.5 ? 'asc' : 'desc';

    const response = authenticatedGet(
      `${baseUrl}/admin/users-analytics?sortBy=${sortBy}&sortOrder=${sortOrder}`,
      adminToken
    );

    analyticsRequests.add(1);

    validateResponse(
      response,
      {
        'users analytics returns 200': (r) => r.status === 200,
        'users analytics has array': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
      },
      'Users Analytics'
    );

    randomSleep(2, 4);
  });

  // Test 5: Get User Activity Log
  group('GET /admin/user-activity-log - User Activity Log', () => {
    const response = authenticatedGet(
      `${baseUrl}/admin/user-activity-log`,
      adminToken
    );

    analyticsRequests.add(1);

    validateResponse(
      response,
      {
        'activity log returns 200': (r) => r.status === 200,
        'activity log has data': (r) => {
          const body = parseBody(r);
          return body && body.data;
        },
      },
      'User Activity Log'
    );

    randomSleep(2, 3);
  });

  // Test 6: Get Cache Stats
  group('GET /admin/cache/stats - Cache Statistics', () => {
    const response = authenticatedGet(
      `${baseUrl}/admin/cache/stats`,
      adminToken
    );

    cacheOperations.add(1);

    validateResponse(
      response,
      {
        'cache stats returns 200': (r) => r.status === 200,
        'cache stats has data': (r) => {
          const body = parseBody(r);
          return body && body.data && typeof body.data.enabled === 'boolean';
        },
        'cache stats has metrics': (r) => {
          const body = parseBody(r);
          return (
            body &&
            body.data &&
            (body.data.hits !== undefined || body.data.misses !== undefined)
          );
        },
      },
      'Cache Statistics'
    );

    randomSleep(1, 2);
  });

  // Note: We're NOT testing cache clear operations in load tests
  // to avoid disrupting the application during testing

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/admin-load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';

  let summary = `\n${indent}Admin Load Test Summary\n${indent}${'='.repeat(
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

    summary += `\n${indent}Admin Operation Metrics:\n`;
    summary += `${indent}  - Dashboard Requests: ${
      data.metrics.dashboard_requests?.values?.count || 0
    }\n`;
    summary += `${indent}  - Analytics Requests: ${
      data.metrics.analytics_requests?.values?.count || 0
    }\n`;
    summary += `${indent}  - Cache Operations: ${
      data.metrics.cache_operations?.values?.count || 0
    }\n`;
  }

  return summary;
}
