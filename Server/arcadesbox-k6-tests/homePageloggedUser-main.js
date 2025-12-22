import http from 'k6/http';
import { sleep } from 'k6';
import { environments } from './config/environments.js';
import {loadHomepageLoggedUser} from './scripts/homepage_logged_user.js';
import { thresholds } from './config/thresholds.js';

const ENV = __ENV.ENV || 'staging';
const config = environments[ENV];

// --- Load Test Settings ---
export const options = {
    scenarios: {
        homePageLoad: {
        executor: 'constant-vus',
        vus: Number(__ENV.USER_VU) || 1,
        duration: __ENV.DURATION || '1m',
        exec: 'loadHomePageScenario',
        },
    },
    thresholds: thresholds,
};

export function loadHomePageScenario() {

  const user = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZTQ4M2Y0OS00Njc1LTRjYmYtOGJiMS01OTA3ZWQ2ZWZkZDIiLCJlbWFpbCI6ImFhYmJleWpyNDU2QGdtYWlsLmNvbSIsInJvbGUiOiJwbGF5ZXIiLCJpYXQiOjE3NjYwMjE0NTh9.PBD2KkXP-Jz_9KyMZB6v3aF7SkBVPE6EYzUgYeaKUwI'

  // Load categories
  loadHomepageLoggedUser(user.token);

  sleep(1);
}
