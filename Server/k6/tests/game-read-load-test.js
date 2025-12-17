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

    validateResponse(
      response,
      {
        'games list returns 200': (r) => r.status === 200,
        'games list has data array': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
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

  // Test 3: Get Game by Position (only test positions we know exist)
  if (gameIds && gameIds.length > 0) {
    group('GET /games/position/:position - Get Game by Position', () => {
      // Use a position from 1 to the number of games we have
      const maxPosition = Math.min(gameIds.length, 20);
      const position = Math.floor(Math.random() * maxPosition) + 1;

      const response = token
        ? authenticatedGet(`${baseUrl}/games/position/${position}`, token)
        : http.get(`${baseUrl}/games/position/${position}`);

      validateResponse(
        response,
        {
          'game by position returns 200': (r) => r.status === 200,
          'game by position has data': (r) => {
            const body = parseBody(r);
            return body && body.data;
          },
        },
        'Get Game by Position'
      );

      randomSleep(1, 2);
    });
  }

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

  // Test 5: Filter Games by Status (removed category test with mock UUID)

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

  // Test 7: Special Filter - Recently Added
  group('GET /games?filter=recently_added - Recently Added Games', () => {
    const response = http.get(`${baseUrl}/games?filter=recently_added`);

    validateResponse(
      response,
      {
        'recently added returns 200': (r) => r.status === 200,
        'recently added has data array': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
        'recently added limits to 10 or fewer': (r) => {
          const body = parseBody(r);
          return body && body.data.length <= 10;
        },
      },
      'Recently Added Filter'
    );

    randomSleep(1, 2);
  });

  // Test 8: Special Filter - Popular Games
  group('GET /games?filter=popular - Popular Games', () => {
    const response = http.get(`${baseUrl}/games?filter=popular`);

    validateResponse(
      response,
      {
        'popular games returns 200': (r) => r.status === 200,
        'popular games has data array': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
      },
      'Popular Games Filter'
    );

    randomSleep(1, 2);
  });

  // Test 9: Special Filter - Recommended Games (requires auth)
  if (token) {
    group('GET /games?filter=recommended - Recommended Games', () => {
      const response = authenticatedGet(
        `${baseUrl}/games?filter=recommended&limit=20`,
        token
      );

      validateResponse(
        response,
        {
          'recommended games returns 200': (r) => r.status === 200,
          'recommended games has data array': (r) => {
            const body = parseBody(r);
            return body && Array.isArray(body.data);
          },
        },
        'Recommended Games Filter'
      );

      randomSleep(1, 2);
    });
  }

  // Test 10: Status Filter - Active Games
  group('GET /games?status=active - Filter Active Games', () => {
    const response = http.get(`${baseUrl}/games?status=active&limit=20`);

    validateResponse(
      response,
      {
        'active games returns 200': (r) => r.status === 200,
        'active games has data': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
      },
      'Status Filter (Active)'
    );

    randomSleep(1, 2);
  });

  // Test 11: Combined Filters
  group('GET /games - Combined Filters Test', () => {
    const combinations = [
      '?status=active&limit=10',
      '?status=active&search=game&limit=15',
      '?page=1&limit=20&sortBy=createdAt&sortOrder=desc',
      '?status=active&page=1&limit=10',
    ];

    const params = randomItem(combinations);
    const response = http.get(`${baseUrl}/games${params}`);

    validateResponse(
      response,
      {
        'combined filters returns 200': (r) => r.status === 200,
        'combined filters has data': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
      },
      'Combined Filters'
    );

    randomSleep(0.5, 1.5);
  });

  // Test 12: Sort Orders
  group('GET /games - Sort Order Test', () => {
    const sortOptions = [
      '?sortBy=createdAt&sortOrder=asc&limit=20',
      '?sortBy=createdAt&sortOrder=desc&limit=20',
      '?sortBy=position&sortOrder=asc&limit=20',
    ];

    const params = randomItem(sortOptions);
    const response = http.get(`${baseUrl}/games${params}`);

    validateResponse(
      response,
      {
        'sort order returns 200': (r) => r.status === 200,
        'sort order has data': (r) => {
          const body = parseBody(r);
          return body && Array.isArray(body.data);
        },
      },
      'Sort Order'
    );

    randomSleep(0.5, 1);
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
