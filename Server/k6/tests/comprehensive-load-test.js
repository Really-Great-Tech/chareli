// Comprehensive Load Test
// Simulates realistic user behavior combining all operations across the application
// Includes weighted distribution of different user types and actions

import { group, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Trend, Rate } from 'k6/metrics';
import { config, getScenario } from '../k6-config.js';
import {
  authenticate,
  authenticatedGet,
  authenticatedPost,
  authenticatedDelete,
  validateResponse,
  randomSleep,
  randomItem,
  parseBody,
  randomEmail,
  randomPhone,
  randomString,
} from '../utils/utils.js';
import http from 'k6/http';

// Custom metrics
const userJourneys = new Counter('user_journeys_completed');
const operationErrors = new Rate('operation_errors');
const journeyDuration = new Trend('journey_duration');

export const options = {
  scenarios: {
    comprehensive_test: getScenario(),
  },
  thresholds: {
    http_req_duration: [
      `p(95)<${config.thresholds.p95}`,
      `p(99)<${config.thresholds.p99}`,
    ],
    http_req_failed: [`rate<${config.thresholds.maxErrorRate / 100}`],
    errors: [`rate<${config.thresholds.maxErrorRate / 100}`],
    operation_errors: [`rate<0.05`], // Max 5% operation-level errors
  },
};

// Setup: Prepare test data
export function setup() {
  const baseUrl = config.baseUrl;

  // Get test user token
  const userToken = authenticate(
    baseUrl,
    config.testUserCredentials.email,
    config.testUserCredentials.password
  );

  // Get admin token
  const adminToken = authenticate(
    baseUrl,
    config.adminCredentials.email,
    config.adminCredentials.password
  );

  // Fetch available games
  const gamesResponse = http.get(`${baseUrl}/games?limit=50`);
  const gameIds = [];
  if (gamesResponse.status === 200) {
    const body = parseBody(gamesResponse);
    if (body && body.data && Array.isArray(body.data)) {
      gameIds.push(...body.data.map((game) => game.id).filter(Boolean));
    }
  }

  return { userToken, adminToken, gameIds };
}

export default function (data) {
  const baseUrl = config.baseUrl;
  const { userToken, adminToken, gameIds } = data;

  const journeyStart = Date.now();

  // Randomly choose a user journey (weighted distribution)
  const userType = Math.random();

  if (userType < 0.7) {
    // 70% - Casual Browser Journey
    casualBrowserJourney(baseUrl, userToken, gameIds);
  } else if (userType < 0.9) {
    // 20% - Active Player Journey
    activePlayerJourney(baseUrl, userToken, gameIds);
  } else {
    // 10% - Admin/Power User Journey
    if (adminToken) {
      adminJourney(baseUrl, adminToken);
    } else {
      casualBrowserJourney(baseUrl, userToken, gameIds);
    }
  }

  const journeyTime = Date.now() - journeyStart;
  journeyDuration.add(journeyTime);
  userJourneys.add(1);
}

/**
 * Casual Browser Journey: Browse games, view details, maybe like
 */
function casualBrowserJourney(baseUrl, token, gameIds) {
  group('Casual Browser Journey', () => {
    // 1. Browse home page (games list)
    const response1 = http.get(`${baseUrl}/games?page=1&limit=20`);
    if (
      !check(response1, { 'browse games success': (r) => r.status === 200 })
    ) {
      operationErrors.add(1);
    } else {
      operationErrors.add(0);
    }
    randomSleep(2, 5);

    // 2. View a specific game
    if (gameIds && gameIds.length > 0) {
      const gameId = randomItem(gameIds);
      const response2 = http.get(`${baseUrl}/games/${gameId}`);
      check(response2, { 'view game success': (r) => r.status === 200 });
      randomSleep(3, 8); // Reading game details
    }

    // 3. Maybe search for something
    if (Math.random() > 0.5) {
      const searchTerms = ['puzzle', 'action', 'racing', 'adventure'];
      const term = randomItem(searchTerms);
      http.get(`${baseUrl}/games?search=${term}`);
      randomSleep(1, 3);
    }

    // 4. View another game
    if (gameIds && gameIds.length > 1) {
      const gameId = randomItem(gameIds);
      http.get(`${baseUrl}/games/${gameId}`);
      randomSleep(2, 6);
    }

    // 5. Maybe like a game (if authenticated)
    if (token && gameIds && gameIds.length > 0 && Math.random() > 0.6) {
      const gameId = randomItem(gameIds);
      authenticatedPost(`${baseUrl}/games/${gameId}/like`, {}, token);
      randomSleep(1, 2);
    }
  });
}

/**
 * Active Player Journey: More engaged, creates analytics, uses more features
 */
function activePlayerJourney(baseUrl, token, gameIds) {
  group('Active Player Journey', () => {
    if (!token) {
      // User needs to login
      const loginResponse = http.post(
        `${baseUrl}/auth/login`,
        JSON.stringify({
          email: config.testUserCredentials.email,
          password: config.testUserCredentials.password,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (loginResponse.status !== 200) {
        operationErrors.add(1);
        return;
      }

      const loginBody = parseBody(loginResponse);
      token = loginBody?.data?.accessToken;
    }

    operationErrors.add(0);

    // 1. Check stats
    authenticatedGet(`${baseUrl}/users/me/stats`, token);
    randomSleep(1, 2);

    // 2. Send heartbeat
    authenticatedPost(`${baseUrl}/users/heartbeat`, {}, token);
    randomSleep(0.5, 1);

    // 3. Browse games
    authenticatedGet(`${baseUrl}/games?page=1&limit=20`, token);
    randomSleep(2, 4);

    // 4. Select a game to "play"
    if (gameIds && gameIds.length > 0) {
      const gameId = randomItem(gameIds);

      // View game details
      authenticatedGet(`${baseUrl}/games/${gameId}`, token);
      randomSleep(1, 2);

      // Create analytics entry (start playing)
      const analyticsPayload = {
        gameId: gameId,
        startTime: new Date().toISOString(),
      };
      const analyticsResponse = authenticatedPost(
        `${baseUrl}/analytics`,
        analyticsPayload,
        token
      );

      let analyticsId = null;
      if (
        analyticsResponse.status === 200 ||
        analyticsResponse.status === 201
      ) {
        const body = parseBody(analyticsResponse);
        analyticsId = body?.data?.id;
      }

      // "Play" the game (simulate with sleep)
      randomSleep(30, 120); // 30 seconds to 2 minutes

      // End analytics entry
      if (analyticsId) {
        authenticatedPost(`${baseUrl}/analytics/${analyticsId}/end`, {}, token);
      }

      // Like the game
      if (Math.random() > 0.4) {
        authenticatedPost(`${baseUrl}/games/${gameId}/like`, {}, token);
        randomSleep(1, 2);
      }
    }

    // 5. Check online status
    authenticatedGet(`${baseUrl}/users/online-status`, token);
    randomSleep(1, 2);

    // 6. Browse more games
    authenticatedGet(`${baseUrl}/games?page=2&limit=20`, token);
    randomSleep(2, 4);
  });
}

/**
 * Admin Journey: Check analytics, manage system
 */
function adminJourney(baseUrl, adminToken) {
  group('Admin Journey', () => {
    // 1. Check dashboard
    authenticatedGet(`${baseUrl}/admin/dashboard`, adminToken);
    randomSleep(2, 4);

    // 2. View games analytics
    authenticatedGet(`${baseUrl}/admin/games-analytics`, adminToken);
    randomSleep(2, 4);

    // 3. View users analytics
    authenticatedGet(
      `${baseUrl}/admin/users-analytics?sortBy=createdAt&sortOrder=desc`,
      adminToken
    );
    randomSleep(2, 4);

    // 4. Check cache stats
    authenticatedGet(`${baseUrl}/admin/cache/stats`, adminToken);
    randomSleep(1, 2);

    // 5. View games popularity
    authenticatedGet(`${baseUrl}/admin/games-popularity`, adminToken);
    randomSleep(2, 3);

    // 6. Check user activity log
    authenticatedGet(`${baseUrl}/admin/user-activity-log`, adminToken);
    randomSleep(2, 3);
  });
}

export function handleSummary(data) {
  const summary = {
    'reports/comprehensive-load-test-summary.json': JSON.stringify(
      data,
      null,
      2
    ),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };

  // Generate HTML report if enabled
  if (config.reporting.enableHtml) {
    summary['reports/comprehensive-load-test-report.html'] = htmlReport(data);
  }

  return summary;
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';

  let summary = `\n${indent}Comprehensive Load Test Summary\n${indent}${'='.repeat(
    60
  )}\n`;

  if (data.metrics) {
    summary += `\n${indent}Overall Metrics:\n`;
    summary += `${indent}  - Total Requests: ${
      data.metrics.http_reqs?.values?.count || 0
    }\n`;
    summary += `${indent}  - Failed Requests: ${
      (data.metrics.http_req_failed?.values?.rate * 100)?.toFixed(2) || 0
    }%\n`;
    summary += `${indent}  - Avg Duration: ${
      data.metrics.http_req_duration?.values?.avg?.toFixed(2) || 0
    }ms\n`;
    summary += `${indent}  - p95 Duration: ${
      data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0
    }ms\n`;
    summary += `${indent}  - p99 Duration: ${
      data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0
    }ms\n`;
    summary += `${indent}  - Max Duration: ${
      data.metrics.http_req_duration?.values?.max?.toFixed(2) || 0
    }ms\n`;

    summary += `\n${indent}User Journey Metrics:\n`;
    summary += `${indent}  - Journeys Completed: ${
      data.metrics.user_journeys_completed?.values?.count || 0
    }\n`;
    summary += `${indent}  - Avg Journey Duration: ${
      data.metrics.journey_duration?.values?.avg?.toFixed(2) || 0
    }ms\n`;
    summary += `${indent}  - Operation Error Rate: ${
      (data.metrics.operation_errors?.values?.rate * 100)?.toFixed(2) || 0
    }%\n`;

    summary += `\n${indent}VU Metrics:\n`;
    summary += `${indent}  - VUs Max: ${
      data.metrics.vus_max?.values?.max || 0
    }\n`;
    summary += `${indent}  - Iterations: ${
      data.metrics.iterations?.values?.count || 0
    }\n`;
  }

  return summary;
}

import { check } from 'k6';

function htmlReport(data) {
  // Basic HTML report template
  return `
<!DOCTYPE html>
<html>
<head>
  <title>k6 Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .metric { margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #4CAF50; }
    .warning { border-left-color: #ff9800; }
    .error { border-left-color: #f44336; }
  </style>
</head>
<body>
  <h1>Comprehensive Load Test Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  <h2>Test Configuration</h2>
  <div class="metric">
    <strong>Base URL:</strong> ${config.baseUrl}<br>
    <strong>Test Mode:</strong> ${config.testMode}<br>
    <strong>VU Range:</strong> ${config.vus.min} - ${config.vus.max}<br>
  </div>

  <h2>Overall Results</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Requests</td><td>${
      data.metrics.http_reqs?.values?.count || 0
    }</td></tr>
    <tr><td>Failed Requests</td><td>${(
      (data.metrics.http_req_failed?.values?.rate || 0) * 100
    ).toFixed(2)}%</td></tr>
    <tr><td>Avg Response Time</td><td>${(
      data.metrics.http_req_duration?.values?.avg || 0
    ).toFixed(2)}ms</td></tr>
    <tr><td>p95 Response Time</td><td>${(
      data.metrics.http_req_duration?.values?.['p(95)'] || 0
    ).toFixed(2)}ms</td></tr>
    <tr><td>p99 Response Time</td><td>${(
      data.metrics.http_req_duration?.values?.['p(99)'] || 0
    ).toFixed(2)}ms</td></tr>
    <tr><td>Max VUs</td><td>${data.metrics.vus_max?.values?.max || 0}</td></tr>
    <tr><td>Total Iterations</td><td>${
      data.metrics.iterations?.values?.count || 0
    }</td></tr>
  </table>

  <h2>Performance Analysis</h2>
  <div class="metric ${
    (data.metrics.http_req_failed?.values?.rate || 0) > 0.01 ? 'error' : ''
  }">
    <strong>Error Rate:</strong> ${(
      (data.metrics.http_req_failed?.values?.rate || 0) * 100
    ).toFixed(2)}%
    ${
      (data.metrics.http_req_failed?.values?.rate || 0) > 0.01
        ? ' ⚠️ Above threshold!'
        : ' ✓ Within threshold'
    }
  </div>

  <div class="metric ${
    (data.metrics.http_req_duration?.values?.['p(95)'] || 0) >
    config.thresholds.p95
      ? 'warning'
      : ''
  }">
    <strong>p95 Response Time:</strong> ${(
      data.metrics.http_req_duration?.values?.['p(95)'] || 0
    ).toFixed(2)}ms
    ${
      (data.metrics.http_req_duration?.values?.['p(95)'] || 0) >
      config.thresholds.p95
        ? ' ⚠️ Above threshold!'
        : ' ✓ Within threshold'
    }
  </div>
</body>
</html>
  `;
}
