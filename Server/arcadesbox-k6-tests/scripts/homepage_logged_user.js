import http from 'k6/http';
import { check, sleep } from 'k6';
import { environments } from '../config/environments.js';


const ENV = __ENV.ENV || 'staging';
const config = environments[ENV];

export function loadHomepageLoggedUser(token = null) {

  // Get speculation
  const speculationRes = http.get(
    `${config.webUrl}/cdn-cgi/speculation`,
    {
      tags: {
        type: 'homepage_logged_user',
        endpoint: 'speculation',
      },
    }
  );

  check(speculationRes, {
    'speculation loaded successfully': (r) => r.status === 200,
  });
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  //authentication settings
  const authSettingsRes = http.get(
    `${config.baseUrl}/api/system-configs/authentication_settings`,
    {
      headers,
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
    const userStatsRes = http.get(
      `${config.baseUrl}/api/users/me/stats`,
      {
        headers,
        tags: {
          type: 'homepage_logged_user',
          endpoint: 'user_stats',
        },
      }
    );
  
    check(userStatsRes, {
      'user stats loaded successfully': (r) => r.status === 200,
    });



  //ui settings
  const uiSettingsRes = http.get(
    `${config.baseUrl}/api/system-configs/ui_settings`,
    {
      headers,
      tags: {
        type: 'homepage_logged_user',
        endpoint: 'ui_settings',
      },
    }
  );

  check(uiSettingsRes, {
    'ui settings loaded successfully': (r) => r.status === 200,
  });

  // Get game categories
  const categoriesRes = http.get(
    `${config.baseUrl}/api/categories`,
    {
      headers,
      tags: {
        type: 'homepage_logged_user',
        endpoint: 'categories',
      },
    }
  );

  check(categoriesRes, {
    'categories loaded successfully': (r) => r.status === 200,
  });



  // Get popular / active games
  const gamesRes = http.get(
    `${config.baseUrl}/api/games?status=active`,
    {
      headers,
      tags: {
        type: 'homepage_logged_user',
        endpoint: 'games',
      },
    }
  );

  check(gamesRes, {
    'games loaded successfully': (r) => r.status === 200,
  });

  // Think time – simulates real user reading the page
  sleep(5);
}
