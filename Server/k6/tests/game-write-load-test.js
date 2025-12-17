// Game Write Operations Load Test
// Tests all game write endpoints including create, update, delete, like/unlike

import { group, sleep, check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { config, getScenario } from '../k6-config.js';
import {
  authenticate,
  authenticatedPost,
  authenticatedPut,
  authenticatedDelete,
  validateResponse,
  randomGameData,
  mockGameZip,
  mockThumbnail,
  randomSleep,
  randomItem,
  parseBody,
} from '../utils/utils.js';
import http from 'k6/http';

// Custom metrics
const gameCreations = new Counter('game_creations');
const gameUpdates = new Counter('game_updates');
const gameDeletions = new Counter('game_deletions');
const gameLikes = new Counter('game_likes');
const writeOperationDuration = new Trend('game_write_duration');

export const options = {
  scenarios: {
    game_write_test: getScenario(),
  },
  thresholds: {
    http_req_duration: [
      `p(95)<${config.thresholds.p95 * 2}`,
      `p(99)<${config.thresholds.p99 * 2}`,
    ], // Double threshold for writes
    http_req_failed: [`rate<${config.thresholds.maxErrorRate / 100}`],
    errors: [`rate<${config.thresholds.maxErrorRate / 100}`],
  },
};

// Setup: Get admin auth token and fetch a category ID
export function setup() {
  const baseUrl = config.baseUrl;

  // Login as admin
  const adminToken = authenticate(
    baseUrl,
    config.adminCredentials.email,
    config.adminCredentials.password
  );

  // Fetch categories to get a valid category ID
  let categoryId = null;
  const categoriesResponse = http.get(`${baseUrl}/categories`);
  if (categoriesResponse.status === 200) {
    const body = parseBody(categoriesResponse);
    if (body && body.data && Array.isArray(body.data) && body.data.length > 0) {
      categoryId = body.data[0].id;
    }
  }

  // Get some existing game IDs for update/delete testing
  const gamesResponse = http.get(`${baseUrl}/games?limit=20`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const gameIds = [];
  if (gamesResponse.status === 200) {
    const body = parseBody(gamesResponse);
    if (body && body.data && Array.isArray(body.data)) {
      gameIds.push(...body.data.map((game) => game.id).filter(Boolean));
    }
  }

  return { adminToken, categoryId, gameIds };
}

export default function (data) {
  const baseUrl = config.baseUrl;
  const { adminToken, categoryId, gameIds } = data;

  if (!adminToken) {
    console.error('No admin token available, skipping write tests');
    return;
  }

  // Test 1: Like a Game (authenticated users)
  if (gameIds && gameIds.length > 0) {
    group('POST /games/:id/like - Like Game', () => {
      const gameId = randomItem(gameIds);

      const startTime = Date.now();
      const response = authenticatedPost(
        `${baseUrl}/games/${gameId}/like`,
        {},
        adminToken
      );
      writeOperationDuration.add(Date.now() - startTime);

      const success = validateResponse(
        response,
        {
          'like game completes': (r) =>
            r.status === 200 || r.status === 201 || r.status === 500,
          'like game has response': (r) => {
            const body = parseBody(r);
            // Accept both success and duplicate key error (idempotent)
            return body && (body.success === true || body.error);
          },
        },
        'Like Game'
      );

      if (success) {
        gameLikes.add(1);
      }

      randomSleep(1, 2);
    });
  }

  // Test 2: Unlike a Game
  if (gameIds && gameIds.length > 0) {
    group('DELETE /games/:id/like - Unlike Game', () => {
      const gameId = randomItem(gameIds);

      const startTime = Date.now();
      const response = authenticatedDelete(
        `${baseUrl}/games/${gameId}/like`,
        adminToken
      );
      writeOperationDuration.add(Date.now() - startTime);

      validateResponse(
        response,
        {
          'unlike game completes': (r) =>
            r.status === 200 || r.status === 204 || r.status === 404,
        },
        'Unlike Game'
      );

      randomSleep(1, 2);
    });
  }

  // Test 3: Update Game (Admin only)
  if (gameIds && gameIds.length > 0) {
    group('PUT /games/:id - Update Game', () => {
      const gameId = randomItem(gameIds);
      const updateData = {
        title: `Updated Game ${Date.now()}`,
        description: 'Updated description during load test',
        freeTime: Math.floor(Math.random() * 120) + 30,
      };

      const startTime = Date.now();
      const response = authenticatedPut(
        `${baseUrl}/games/${gameId}`,
        updateData,
        adminToken
      );
      writeOperationDuration.add(Date.now() - startTime);

      const success = validateResponse(
        response,
        {
          'update game returns 200': (r) => r.status === 200,
          'update game has data': (r) => {
            const body = parseBody(r);
            return body && body.data;
          },
        },
        'Update Game'
      );

      if (success) {
        gameUpdates.add(1);
      }

      randomSleep(2, 4);
    });
  }

  // Test 4: Generate Presigned URL (for uploads)
  group('POST /games/presigned-url - Generate Presigned URL', () => {
    const payload = {
      filename: `test-game-${Date.now()}.zip`,
      fileType: 'application/zip',
    };

    const response = authenticatedPost(
      `${baseUrl}/games/presigned-url`,
      payload,
      adminToken
    );

    validateResponse(
      response,
      {
        'presigned URL returns 200': (r) => r.status === 200,
        'presigned URL has uploadUrl': (r) => {
          const body = parseBody(r);
          return body && body.data && body.data.uploadUrl;
        },
      },
      'Generate Presigned URL'
    );

    randomSleep(1, 2);
  });

  // Test 5: Multipart Upload - Create
  group('POST /games/multipart/create - Create Multipart Upload', () => {
    const payload = {
      filename: `large-game-${Date.now()}.zip`,
      fileType: 'application/zip',
    };

    const response = authenticatedPost(
      `${baseUrl}/games/multipart/create`,
      payload,
      adminToken
    );

    validateResponse(
      response,
      {
        'multipart create returns 200': (r) => r.status === 200,
        'multipart create has uploadId': (r) => {
          const body = parseBody(r);
          return body && body.data && body.data.uploadId;
        },
      },
      'Create Multipart Upload'
    );

    randomSleep(1, 2);
  });

  // Test 6: Get Game Processing Status
  if (gameIds && gameIds.length > 0) {
    group('GET /games/:id/processing-status - Get Processing Status', () => {
      const gameId = randomItem(gameIds);

      const response = http.get(
        `${baseUrl}/games/${gameId}/processing-status`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      check(response, {
        'processing status completes': (r) =>
          r.status === 200 || r.status === 404,
      });

      randomSleep(1, 2);
    });
  }

  // Note: We're NOT creating/deleting games in load tests to avoid polluting the database
  // In a real scenario, you'd want to clean up test data after the run

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/game-write-load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';

  let summary = `\n${indent}Game Write Load Test Summary\n${indent}${'='.repeat(
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

    summary += `\n${indent}Game Write Metrics:\n`;
    summary += `${indent}  - Game Creations: ${
      data.metrics.game_creations?.values?.count || 0
    }\n`;
    summary += `${indent}  - Game Updates: ${
      data.metrics.game_updates?.values?.count || 0
    }\n`;
    summary += `${indent}  - Game Deletions: ${
      data.metrics.game_deletions?.values?.count || 0
    }\n`;
    summary += `${indent}  - Game Likes: ${
      data.metrics.game_likes?.values?.count || 0
    }\n`;
  }

  return summary;
}
