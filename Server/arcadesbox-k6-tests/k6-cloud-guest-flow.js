/**
 * k6 Cloud - Guest User Flow Load Test
 *
 * This script simulates guest users browsing and playing games.
 * Optimized for Phase 0 (no unnecessary API calls) and includes proper sessionId handling.
 *
 * To run in k6 Cloud:
 * 1. Upload this file to k6 Cloud
 * 2. Configure environment variables in k6 Cloud UI:
 *    - ENV: staging (or production, dev)
 *    - GAME_ID: b47b7048-edfd-4dc1-828f-951c69f50dc3
 *    - GAME_NAME: sand-worm
 * 3. Run with desired VUs and duration
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ========================================
// CONFIGURATION
// ========================================

const ENV = __ENV.ENV || 'staging';
const GAME_ID = __ENV.GAME_ID || 'b47b7048-edfd-4dc1-828f-951c69f50dc3';
const GAME_NAME = __ENV.GAME_NAME || 'sand-worm';

// Environment configurations
const environments = {
  production: {
    baseUrl: 'https://api.arcadesbox.com',
    webUrl: 'https://arcadesbox.com',
  },
  staging: {
    baseUrl: 'https://api-staging.arcadesbox.com',
    webUrl: 'https://staging.arcadesbox.com',
  },
  dev: {
    baseUrl: 'https://api-dev.arcadesbox.com',
    webUrl: 'https://dev.arcadesbox.com',
  },
};

const config = environments[ENV];

// Generate unique session ID per VU (simulates browser sessionStorage)
const SESSION_ID = uuidv4();

// ========================================
// K6 CLOUD OPTIONS
// ========================================

export const options = {
  // k6 Cloud project settings
  ext: {
    loadimpact: {
      projectID: 3712977, // Replace with your k6 Cloud project ID
      name: `Guest Flow - ${ENV} - Phase 0+2`,
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 },
      },
    },
  },

  // Test execution configuration
  scenarios: {
    guest_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 }, // Ramp up to 500
        { duration: '2m', target: 1000 }, // Ramp up to 1000
        { duration: '3m', target: 2000 }, // Ramp up to 2000
        { duration: '3m', target: 2000 }, // Stay at 2000
        { duration: '1m', target: 0 }, // Ramp down
      ],
      gracefulRampDown: '30s',
    },
  },

  // Performance thresholds
  thresholds: {
    'http_req_duration{type:homepage}': ['p(95)<4000'],
    'http_req_duration{type:game_launch}': ['p(95)<4000'],
    'http_req_duration{type:analytics}': ['p(95)<4000'],
    http_req_failed: ['rate<0.01'], // Less than 1% errors
    http_req_duration: ['p(95)<5000'],
  },
};

// ========================================
// GUEST USER FLOW
// ========================================

export default function () {
  // Step 1: Load Homepage
  loadHomepage();

  // Step 2: Launch Game
  const gameLaunched = launchGame();
  if (!gameLaunched) return;

  // Step 3: Send Analytics
  sendAnalytics();

  // Think time between iterations
  sleep(1);
}

// ========================================
// HOMEPAGE LOAD
// ========================================

function loadHomepage() {
  // Cloudflare speculation
  const speculationRes = http.get(`${config.webUrl}/cdn-cgi/speculation`, {
    tags: { type: 'homepage', endpoint: 'speculation' },
  });

  check(speculationRes, {
    'speculation loaded successfully': (r) => r.status === 200,
  });

  // Phase 0 optimization: The following 3 API calls are NO LONGER made for guests
  // - authentication_settings (lazy loaded only when signup modal opens)
  // - user_stats (conditional - only fetched for authenticated users)
  // - ui_settings (using environment defaults instead of API)

  // Get game categories (cached 99.8%)
  const categoriesRes = http.get(`${config.baseUrl}/api/categories`, {
    tags: { type: 'homepage', endpoint: 'categories' },
  });

  check(categoriesRes, {
    'categories loaded successfully': (r) => r.status === 200,
  });

  // Get active games (cached 99.8%)
  const gamesRes = http.get(`${config.baseUrl}/api/games?status=active`, {
    tags: { type: 'homepage', endpoint: 'games' },
  });

  check(gamesRes, {
    'games loaded successfully': (r) => r.status === 200,
  });

  // Think time - user reading the page
  sleep(5);
}

// ========================================
// GAME LAUNCH
// ========================================

function launchGame() {
  // Load gameplay page
  const gameplayRes = http.get(`${config.webUrl}/gameplay/${GAME_NAME}`, {
    tags: { type: 'game_launch', endpoint: 'gameplay_page' },
  });

  const success = check(gameplayRes, {
    'gameplay page loaded': (r) => r.status === 200,
  });

  // Register game click
  const gameClickRes = http.post(
    `${config.baseUrl}/api/game-position-history/${GAME_ID}/click`,
    null,
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { type: 'game_launch', endpoint: 'game_click' },
    }
  );

  check(gameClickRes, {
    'game click registered successfully': (r) => r.status === 200,
  });

  // Fetch game details
  const gameRes = http.get(`${config.baseUrl}/api/games/${GAME_NAME}`, {
    tags: { type: 'game_launch', endpoint: 'get_game' },
  });

  check(gameRes, {
    'game loaded successfully': (r) => r.status === 200,
  });

  // Simulate user waiting before actual play starts
  sleep(5);

  return success;
}

// ========================================
// ANALYTICS
// ========================================

function sendAnalytics() {
  const payload = JSON.stringify({
    gameId: GAME_ID,
    activityType: 'game_session',
    startTime: new Date().toISOString(),
    sessionId: SESSION_ID, // Unique session ID per VU
  });

  const res = http.post(`${config.baseUrl}/api/analytics`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { type: 'analytics', endpoint: 'game_session' },
  });

  check(res, {
    'analytics status < 400': (r) => r.status === 202,
  });

  // Think time simulating gameplay duration
  sleep(5);
}

// ========================================
// SETUP & TEARDOWN
// ========================================

export function setup() {
  console.log(`Starting load test against ${ENV} environment`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Web URL: ${config.webUrl}`);
  console.log(`Game: ${GAME_NAME} (${GAME_ID})`);
  console.log('Phase 0 optimizations: ENABLED (3 API calls eliminated)');
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log(`Test completed. Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
}
