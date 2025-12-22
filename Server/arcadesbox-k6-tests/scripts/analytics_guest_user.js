import http from 'k6/http';
import { check, sleep } from 'k6';
import { environments } from '../config/environments.js';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const ENV = __ENV.ENV || 'staging';
const config = environments[ENV];

// Generate a unique session ID per VU (simulates browser sessionStorage)
const SESSION_ID = uuidv4();

/**
 * Sends analytics data for a game session
 * @param {string} gameId - UUID of the game
 * @param {string|null} token - Bearer token for logged-in user (optional)
 */
export function sendAnalyticsGuestUser(gameId) {
  const payload = JSON.stringify({
    gameId: gameId,
    activityType: 'game_session',
    startTime: new Date().toISOString(),
    sessionId: SESSION_ID, // Use unique session ID per VU
  });

  console.log('payload: ' + payload);

  const headers = {
    'Content-Type': 'application/json',
  };

  const res = http.post(`${config.baseUrl}/api/analytics`, payload, {
    headers,
    tags: {
      type: 'analytics',
      endpoint: 'game_session',
    },
  });

  check(res, {
    'analytics status < 400': (r) => r.status === 202,
  });

  // Think time simulating gameplay duration
  sleep(5);
}
