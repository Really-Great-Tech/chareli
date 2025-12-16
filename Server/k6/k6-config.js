// k6 Central Configuration
// This file contains shared configuration settings for all k6 load tests

import { group } from 'k6';

// Load environment variables (you'll need to source .env.k6 before running tests)
export const config = {
  // Base URL for API requests
  baseUrl: __ENV.BASE_URL || 'http://localhost:5000/api',

  // Test credentials
  adminCredentials: {
    email: __ENV.ADMIN_EMAIL || 'admin@example.com',
    password: __ENV.ADMIN_PASSWORD || 'Admin123!',
  },

  testUserCredentials: {
    email: __ENV.TEST_USER_EMAIL || 'loadtest@example.com',
    password: __ENV.TEST_USER_PASSWORD || 'TestPassword123!',
  },

  // Load test configuration
  testMode: __ENV.TEST_MODE || 'load',

  // Virtual users configuration
  vus: {
    min: parseInt(__ENV.MIN_VUS) || 5000,
    max: parseInt(__ENV.MAX_VUS) || 20000,
    rampUp: __ENV.RAMP_UP_DURATION || '5m',
    sustained: __ENV.SUSTAINED_DURATION || '10m',
    rampDown: __ENV.RAMP_DOWN_DURATION || '2m',
  },

  // Performance thresholds (in milliseconds)
  thresholds: {
    p95: parseInt(__ENV.P95_THRESHOLD) || 1000,
    p99: parseInt(__ENV.P99_THRESHOLD) || 2000,
    maxErrorRate: parseFloat(__ENV.MAX_ERROR_RATE) || 1,
  },

  // Test data configuration
  mockUploads: __ENV.MOCK_UPLOADS === 'true' || true,
  gameFilesPath: __ENV.GAME_FILES_PATH || './test-data/games',

  // Rate limiting
  maxRpsPerVu: parseInt(__ENV.MAX_RPS_PER_VU) || 10,

  // Reporting
  reporting: {
    enableHtml: __ENV.ENABLE_HTML_REPORT === 'true' || true,
    enableCsv: __ENV.ENABLE_CSV_EXPORT === 'true' || true,
    enableJson: __ENV.ENABLE_JSON_OUTPUT === 'true' || true,
  },
};

// Common test scenarios for different load profiles
export const scenarios = {
  // Smoke test: minimal load to verify functionality
  smoke: {
    executor: 'constant-vus',
    vus: 10,
    duration: '1m',
  },

  // Load test: realistic load ramping from min to max VUs
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: config.vus.rampUp, target: config.vus.min }, // Ramp up to min VUs
      { duration: '2m', target: config.vus.min }, // Stay at min
      { duration: '3m', target: config.vus.max / 2 }, // Ramp to half max
      { duration: '2m', target: config.vus.max / 2 }, // Stay at half max
      { duration: '3m', target: config.vus.max }, // Ramp to max
      { duration: config.vus.sustained, target: config.vus.max }, // Sustained max load
      { duration: config.vus.rampDown, target: 0 }, // Ramp down
    ],
    gracefulRampDown: '30s',
  },

  // Stress test: push beyond max to find breaking points
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: config.vus.min },
      { duration: '3m', target: config.vus.max },
      { duration: '5m', target: config.vus.max * 1.5 }, // 150% of max
      { duration: '3m', target: config.vus.max * 2 }, // 200% of max
      { duration: '5m', target: config.vus.max * 2 }, // Sustain at 200%
      { duration: '3m', target: 0 },
    ],
    gracefulRampDown: '1m',
  },

  // Spike test: sudden traffic spikes
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: config.vus.min },
      { duration: '1m', target: config.vus.min },
      { duration: '10s', target: config.vus.max }, // Sudden spike
      { duration: '3m', target: config.vus.max },
      { duration: '10s', target: config.vus.min }, // Sudden drop
      { duration: '1m', target: config.vus.min },
      { duration: '30s', target: 0 },
    ],
  },
};

// Get scenario based on test mode
export function getScenario() {
  return scenarios[config.testMode] || scenarios.load;
}

// Common HTTP options
export const httpOptions = {
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: '60s',
};

// Sleep durations for think time (in seconds)
export const thinkTime = {
  short: 1,
  medium: 3,
  long: 5,
};

export default config;
