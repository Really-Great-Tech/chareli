import http from 'k6/http';
import { check, sleep } from 'k6';
import { environments } from '../config/environments.js';

const ENV = __ENV.ENV || 'staging';
const config = environments[ENV];

export function loginUser(email, password) {
  const payload = JSON.stringify({
    identifier: email,
    password: password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      type: 'login',
    },
  };

  const res = http.post(
    `${config.baseUrl}/api/auth/login`,
    payload,
    params
  );

  const loginSuccess = check(res, {
    'login successful (200)': (r) => r.status === 200,
    'login success flag true': (r) =>
      r.json('success') === true,
  });

  // Optional: small think time after login
  sleep(5);

  if (!loginSuccess) {
    return null;
  }

  // Return useful data for downstream steps
  return {
    userId: res.json('data.userId'),
    token: res.json('data.tokens.accessToken'),
    email: res.json('data.email'),
    role: res.json('data.role'),
  };
}
