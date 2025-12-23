import http from 'k6/http';
import { sleep } from 'k6';
import { environments } from './config/environments.js';
import {loadHomepageGuestUser} from './scripts/homepage_guest_user.js';
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
  // Load categories
  loadHomepageGuestUser();

  sleep(1);
}
