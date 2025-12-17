// Game Read Operations Load Test
// Tests all game read endpoints including list, detail, by position, etc.

import { group, sleep } from 'k6';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { config, getScenario } from '../k6-config.js';
import {
  authenticate,
  authenticatedGet,
  validateResponse,
  randomSleep,
  randomItem,
  parseBody,
} from '../utils/utils.js';
import http from 'k6/http';

// Custom metrics
const gameListRequests = new Counter('game_list_requests');
const gameDetailRequests = new Counter('game_detail_requests');
const cacheHits = new Counter('cache_hits');
const readDuration = new Trend('game_read_duration');

export const options = {
  scenarios: {
    game_read_test: getScenario(),
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

// Setup: Get auth token and cache some game IDs
export function setup() {
  const baseUrl = config.baseUrl;

  // Login to get token (optional authentication)
  const token = authenticate(
    baseUrl,
    config.testUserCredentials.email,
    config.testUserCredentials.password
  );

  // Fetch some games to get IDs for detail testing
  const gamesResponse = http.get(`${baseUrl}/games?limit=50`);
  const gameIds = [];

  if (gamesResponse.status === 200) {
    const body = parseBody(gamesResponse);
    if (body && body.data && Array.isArray(body.data)) {
      gameIds.push(...body.data.map((game) => game.id).filter(Boolean));
    }
  }

  return { token, gameIds };
}

export default function (data) {
  const baseUrl = config.baseUrl;
  const { token, gameIds } = data;

  // Test 1: Get All Games (Public endpoint)
  group('GET /games - List All Games', () => {
    const params = [
      '',
      '?page=1&limit=20',
      '?page=2&limit=20',
      '?sortBy=createdAt&sortOrder=desc',
      '?search=game',
    ];

    const param = randomItem(params);
    const startTime = Date.now();
    const response = http.get(`${baseUrl}/games${param}`);
    readDuration.add(Date.now() - startTime);

    gameListRequests.add(1);

    const hasPaginationParam = param.includes('limit=');

    validateResponse(
      response,
      {
        'games list returns 200': (r) => r.status === 200,
        'games list has data array': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
        // Only check for pagination when limit parameter is used
        ...(hasPaginationParam && {
          'games list has pagination when limited': (r) => {
            const body = parseBody(r);
            return body && body.pagination;
          },
        }),
      },
      'List Games'
    );

    // Check for cache headers
    if (response.headers['X-Cache-Hit'] || response.headers['x-cache-hit']) {
      cacheHits.add(1);
    }

    randomSleep(0.5, 2);
  });

  // Test 2: Get Game by ID
  if (gameIds && gameIds.length > 0) {
    group('GET /games/:id - Get Game Details', () => {
      const gameId = randomItem(gameIds);

      const startTime = Date.now();
      const response = token
        ? authenticatedGet(`${baseUrl}/games/${gameId}`, token)
        : http.get(`${baseUrl}/games/${gameId}`);
      readDuration.add(Date.now() - startTime);

      gameDetailRequests.add(1);

      validateResponse(
        response,
        {
          'game detail returns 200': (r) => r.status === 200,
          'game detail has data': (r) => {
            const body = parseBody(r);
            return body && body.data && body.data.id === gameId;
          },
          'game detail has title': (r) => {
            const body = parseBody(r);
            return body && body.data && body.data.title;
          },
        },
        'Get Game Detail'
      );

      if (response.headers['X-Cache-Hit'] || response.headers['x-cache-hit']) {
        cacheHits.add(1);
      }

      randomSleep(0.5, 1.5);
    });
  }

  // Test 3: Get Game by Position
  group('GET /games/position/:position - Get Game by Position', () => {
    const position = Math.floor(Math.random() * 20) + 1; // Positions 1-20

    const response = token
      ? authenticatedGet(`${baseUrl}/games/position/${position}`, token)
      : http.get(`${baseUrl}/games/position/${position}`);

    validateResponse(
      response,
      {
        'game by position completes': (r) =>
          r.status === 200 || r.status === 404,
        'game by position has correct structure when found': (r) => {
          if (r.status === 200) {
            const body = parseBody(r);
            return body && body.data;
          }
          return true;
        },
      },
      'Get Game by Position'
    );

    randomSleep(1, 2);
  });

  // Test 4: Search Games
  group('GET /games?search=... - Search Games', () => {
    const searchTerms = ['space', 'dragon', 'puzzle', 'race', 'adventure'];
    const term = randomItem(searchTerms);

    const response = http.get(`${baseUrl}/games?search=${term}&limit=20`);

    validateResponse(
      response,
      {
        'game search returns 200': (r) => r.status === 200,
        'game search has data': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
      },
      'Search Games'
    );

    randomSleep(1, 3);
  });

  // Test 5: Filter Games by Category
  group('GET /games?categoryId=... - Filter by Category', () => {
    // Try with a random UUID (might not exist, but tests the endpoint)
    const mockCategoryId = '00000000-0000-0000-0000-000000000001';

    const response = http.get(
      `${baseUrl}/games?categoryId=${mockCategoryId}&limit=20`
    );

    check(response, {
      'game filter by category completes': (r) => r.status === 200,
    });

    randomSleep(1, 2);
  });

  // Test 6: Pagination Stress
  group('GET /games - Pagination Test', () => {
    const page = Math.floor(Math.random() * 10) + 1;
    const limit = 20;

    const response = http.get(`${baseUrl}/games?page=${page}&limit=${limit}`);

    validateResponse(
      response,
      {
        'pagination returns 200': (r) => r.status === 200,
        'pagination has data array': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
      },
      'Game Pagination'
    );

    randomSleep(0.5, 1.5);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/game-read-load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';

  let summary = `\n${indent}Game Read Load Test Summary\n${indent}${'='.repeat(
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

    summary += `\n${indent}Game Read Metrics:\n`;
    summary += `${indent}  - Game List Requests: ${
      data.metrics.game_list_requests?.values?.count || 0
    }\n`;
    summary += `${indent}  - Game Detail Requests: ${
      data.metrics.game_detail_requests?.values?.count || 0
    }\n`;
    summary += `${indent}  - Cache Hits: ${
      data.metrics.cache_hits?.values?.count || 0
    }\n`;
  }

  return summary;
}
