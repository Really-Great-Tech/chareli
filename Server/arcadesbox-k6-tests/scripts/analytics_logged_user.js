import http from 'k6/http';
import { check, sleep } from 'k6';
import { environments } from '../config/environments.js';

const ENV = __ENV.ENV || 'staging';
const config = environments[ENV];

/**
 * Sends analytics data for a game session
 * @param {string} gameId - UUID of the game
 * @param {string|null} token - Bearer token for logged-in user (optional)
 */
export function sendAnalyticsloggedUser(gameId, token = null) {
  const payload = JSON.stringify({
    gameId: gameId,
    activityType: 'game_session',
    startTime: new Date().toISOString()
  });

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = http.post(
    `${config.baseUrl}/api/analytics`,
    payload,
    {
      headers,
      tags: {
        type: 'analytics',
        endpoint: 'game_session',
      },
    }
  );


  const ok = check(res, {
    'analytics status < 400': (r) => r && r.status < 400,
  });

  
  // Think time simulating gameplay duration
  sleep(5);

}
