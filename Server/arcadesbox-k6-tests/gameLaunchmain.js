import http from 'k6/http';
import { sleep } from 'k6';
import { environments } from './config/environments.js';
import { launchGameGuestUser } from './scripts/game_launch_guest_user.js';
import { thresholds } from './config/thresholds.js';

const ENV = __ENV.ENV || 'production';
const config = environments[ENV];
const GAME_ID = __ENV.GAME_ID;
const GAME_NAME = __ENV.GAME_NAME || 'sand-worm';


// --- Load Test Settings ---
export const options = {
    scenarios: {
        game_launch: {
        executor: 'constant-vus',
        vus: Number(__ENV.USER_VU) || 1,
        duration: __ENV.DURATION || '1m',
        exec: 'gameLaunchScenario',
        },
    },
    thresholds: thresholds,
};

export function gameLaunchScenario() {
  // Load categories
  launchGameGuestUser(GAME_ID, GAME_NAME);

  sleep(5);
}
