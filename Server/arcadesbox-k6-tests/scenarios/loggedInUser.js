import { loginUser } from '../scripts/login.js';
import { sendAnalyticsloggedUser } from '../scripts/analytics_logged_user.js';
import { sleep } from 'k6';
import { loadHomepageLoggedUser } from '../scripts/homepage_logged_user.js';
import { launchGameloggedUser } from '../scripts/game_launch_logged_user.js';
/**
 * Simulates a logged-in user playing a game
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} gameId - Game UUID
 */
export function loggedInUserFlow(email, password, gameId) {
  

  // Step 1: Login
  const user = loginUser(email, password);

  if (!user) return;

  // Step 2: Load homepage
  loadHomepageLoggedUser(user.token);

  // Step 3: Launch game
  const game = launchGameloggedUser(gameId, user.token);
  if (!game) return;

  // Step 4: Send analytics with Bearer token
  sendAnalyticsloggedUser(game.gameId, user.token);

  // Optional: think time between iterations
  sleep(1);
}
