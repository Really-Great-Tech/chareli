import http from 'k6/http';
import { check, sleep } from 'k6';
import { environments } from '../config/environments.js';

const ENV = __ENV.ENV || 'staging';
const config = environments[ENV];

export function loadHomepageGuestUser() {
  // Get speculation
  const speculationRes = http.get(`${config.webUrl}/cdn-cgi/speculation`, {
    tags: {
      type: 'homepage_guest_user',
      endpoint: 'speculation',
    },
  });

  check(speculationRes, {
    'speculation loaded successfully': (r) => r.status === 200,
  });

  // Phase 0 optimization: The following 3 API calls are no longer made for guest users
  // - authentication_settings (lazy loaded only when signup modal opens)
  // - user_stats (conditional - only fetched for authenticated users)
  // - ui_settings (using environment defaults instead of API)

  /* COMMENTED OUT FOR PHASE 0 - These calls eliminated
  //authentication settings
  const authSettingsRes = http.get(
    `${config.baseUrl}/api/system-configs/authentication_settings`,
    {
      tags: {
        type: 'homepage_guest_user',
        endpoint: 'auth_settings',
      },
    }
  );

  check(authSettingsRes, {
    'authentication settings loaded successfully': (r) => r.status === 200,
  });

  //user stat
  const userStatsRes = http.get(`${config.baseUrl}/api/users/me/stats`, {
    tags: {
      type: 'homepage_guest_user',
        endpoint: 'user_stats',
      },
    }
  });

  check(userStatsRes, {
    'user stats loaded successfully': (r) => r.status === 200,
  });

  //ui settings
  const uiSettingsRes = http.get(
    `${config.baseUrl}/api/system-configs/ui_settings`,
    {
      tags: {
        type: 'homepage_guest_user',
        endpoint: 'ui_settings',
      },
    }
  );

  check(uiSettingsRes, {
    'ui settings loaded successfully': (r) => r.status === 200,
  });
  */

  // Get game categories
  const categoriesRes = http.get(`${config.baseUrl}/api/categories`, {
    tags: {
      type: 'homepage_guest_user',
      endpoint: 'categories',
    },
  });

  check(categoriesRes, {
    'categories loaded successfully': (r) => r.status === 200,
  });

  // Get popular / active games
  const gamesRes = http.get(`${config.baseUrl}/api/games?status=active`, {
    tags: {
      type: 'homepage_guest_user',
      endpoint: 'games',
    },
  });

  check(gamesRes, {
    'games loaded successfully': (r) => r.status === 200,
  });

  // Think time – simulates real user reading the page
  sleep(5);
}
