import http from 'k6/http';
import { sleep } from 'k6';
import { environments } from './config/environments.js';
import { sendAnalytics } from './scripts/analytics.js';
import { thresholds } from './config/thresholds.js';

const ENV = __ENV.ENV || 'staging';
const config = environments[ENV];
const GAME_ID = __ENV.GAME_ID;

// --- Load Test Settings ---
export const options = {
    scenarios: {
        analytics: {
        executor: 'constant-vus',
        vus: Number(__ENV.USER_VU) || 1,
        duration: __ENV.DURATION || '1m',
        exec: 'analyticsScenario',
        },
    },
    thresholds: thresholds,
};

export function analyticsScenario() {
  // Load categories
  sendAnalytics(GAME_ID, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZTQ4M2Y0OS00Njc1LTRjYmYtOGJiMS01OTA3ZWQ2ZWZkZDIiLCJlbWFpbCI6ImFhYmJleWpyNDU2QGdtYWlsLmNvbSIsInJvbGUiOiJwbGF5ZXIiLCJpYXQiOjE3NjU4NDY4NDF9.pz7jGyuCj6SyzctoJYr4cHyCavfZyt43dzHQn8x8srw');

  sleep(1);
}
