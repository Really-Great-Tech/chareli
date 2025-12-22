
import { sleep } from 'k6';
import { check } from 'k6';
import { guestUserFlow } from './scenarios/guestUser.js';
import { loggedInUserFlow } from './scenarios/loggedInUser.js';
import { environments } from './config/environments.js';
import { thresholds } from './config/thresholds.js';

// --- Environment ---
const ENV = __ENV.ENV || 'production';
const config = environments[ENV];

// --- CLI-provided test data ---
const GAME_ID = __ENV.GAME_ID || 'b47b7048-edfd-4dc1-828f-951c69f50dc3';
const USER_EMAIL = __ENV.USER_EMAIL;
const USER_PASSWORD = __ENV.USER_PASSWORD;
const GAME_NAME = __ENV.GAME_NAME || 'sand-worm';

// --- Load Test Settings ---
export const options = {
    scenarios: {
        guest_users: {
        executor: 'constant-vus',
        vus: Number(__ENV.GUEST_VUS) || 3000,
        duration: __ENV.DURATION || '1m',
        exec: 'guestScenario',
        },
        logged_in_users: {
        executor: 'constant-vus',
        vus: Number(__ENV.LOGGED_VUS) || 1,
        duration: __ENV.DURATION || '1m',
        exec: 'loggedInScenario',
        },
    },
    thresholds: thresholds,
};

// --- Guest Scenario ---
export function guestScenario() {
  guestUserFlow(GAME_ID, GAME_NAME);
  sleep(5);
}

// --- Logged-in Scenario ---
export function loggedInScenario() {
  if (!USER_EMAIL || !USER_PASSWORD) {
    console.error('USER_EMAIL and USER_PASSWORD must be provided for logged-in scenario');
    return;
  }
  loggedInUserFlow(USER_EMAIL, USER_PASSWORD, GAME_ID, GAME_NAME);
  sleep(5);
}

