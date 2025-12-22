import http from 'k6/http';
import { check, sleep } from 'k6';
import { environments } from '../config/environments.js';

const ENV = __ENV.ENV || 'staging';
const config = environments[ENV];

/**
 * Simulates user launching a game
 * (Reaching the gameplay screen)
 */
export function launchGameGuestUser(gameId, gameName) {
  const res = http.get(
    `${config.webUrl}/gameplay/${gameName}`,
    {
      tags: {
        type: 'game_launch',
        endpoint: 'gameplay_page',
      },
    }
  );

  const success = check(res, {
    'gameplay page loaded': (r) => r.status === 200,
  });

  const headers = {
    'Content-Type': 'application/json',
  };
  //click on game
  const gameclickRes = http.post(
    `${config.baseUrl}/api/game-position-history/${gameId}/click`,
    {
      headers,
      tags: {
        type: 'game_launch_guest_user',
        endpoint: 'game_click',
      },
    }
  );

  check(gameclickRes, {
    'game click registered successfully': (r) => r.status === 200,
  });


  //Get game
  const gameRes = http.get(
    `${config.baseUrl}/api/games/${gameName}`,
    {
      tags: {
        type: 'game_launch_guest_user',
        endpoint: 'get_game',
      },
    }
  );

  check(gameRes, {
    'game loaded successfully': (r) => r.status === 200,
  });



  // Simulate user waiting before actual play starts
  sleep(5);

  if (!success) {
    return null;
  }

  return {
    gameId,
    launchedAt: new Date().toISOString(),
  };
}
