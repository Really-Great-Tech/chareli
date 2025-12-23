import http from 'k6/http';
import { sleep } from 'k6';
import { environments } from './config/environments.js';
import { loginUser } from './scripts/login.js';
import { thresholds } from './config/thresholds.js';

const ENV = __ENV.ENV || 'production';
const config = environments[ENV];

const USER_EMAIL = __ENV.USER_EMAIL;
const USER_PASSWORD = __ENV.USER_PASSWORD;
// --- Load Test Settings ---
export const options = {
    scenarios: {
        login: {
        executor: 'constant-vus',
        vus: Number(__ENV.USER_VU) || 1,
        duration: __ENV.DURATION || '1m',
        exec: 'loginScenario',
        },
    },
    thresholds: thresholds,
};

export function loginScenario() {
  // Load categories
  loginUser(USER_EMAIL, USER_PASSWORD);

  sleep(1);
}
