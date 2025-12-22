import { sleep } from 'k6';
import { loadHomepageGuestUser } from '../scripts/homepage_guest_user.js';
import { launchGameGuestUser } from '../scripts/game_launch_guest_user.js';
import { sendAnalyticsGuestUser } from '../scripts/analytics_guest_user.js';

/**
 * Simulates a guest user playing a game
 * @param {string} gameId - The game UUID
 */
export function guestUserFlow(gameId, gameName) {
  // Step 1: Load homepage
  loadHomepageGuestUser();

  // Step 2: Launch game
  const game = launchGameGuestUser(gameId, gameName);
  if (!game) return;

  //Step 3: Send analytics without Bearer token
  sendAnalyticsGuestUser(game.gameId);
  
  // Optional: think time between iterations
  sleep(5);
}
