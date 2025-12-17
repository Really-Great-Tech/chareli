// Shared utility functions for k6 load tests

import { check, fail, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const customTrend = new Trend('custom_duration');
export const requestCounter = new Counter('total_requests');

// Track authentication tokens
let authTokens = {};

/**
 * Authenticate a user and return the auth token
 * @param {string} baseUrl - The API base URL
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {string} - JWT token
 */
export function authenticate(baseUrl, email, password) {
  // Check if we already have a token for this user
  const cacheKey = `${email}:${password}`;
  if (authTokens[cacheKey]) {
    return authTokens[cacheKey];
  }

  const loginPayload = JSON.stringify({
    identifier: email, // API expects 'identifier' field
    password: password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${baseUrl}/auth/login`, loginPayload, params);

  requestCounter.add(1);

  const success = check(response, {
    'login successful': (r) => r.status === 200 || r.status === 201,
    'login has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        // Support both old (data.accessToken) and new (data.tokens.accessToken) structures
        return (
          (body.data && body.data.accessToken) ||
          (body.data && body.data.tokens && body.data.tokens.accessToken)
        );
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
    console.error(
      `Authentication failed for ${email}: ${response.status} - ${response.body}`
    );
    return null;
  }

  errorRate.add(0);

  try {
    const body = JSON.parse(response.body);
    // Try new structure first, fall back to old structure
    const token = body.data.tokens?.accessToken || body.data.accessToken;
    authTokens[cacheKey] = token;
    return token;
  } catch (e) {
    console.error(`Failed to parse login response: ${e.message}`);
    return null;
  }
}

/**
 * Make an authenticated GET request
 * @param {string} url - The full URL
 * @param {string} token - JWT token
 * @param {object} additionalParams - Additional HTTP params
 * @returns {object} - HTTP response
 */
export function authenticatedGet(url, token, additionalParams = {}) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(additionalParams.headers || {}),
    },
    ...additionalParams,
  };

  const response = http.get(url, params);
  requestCounter.add(1);

  return response;
}

/**
 * Make an authenticated POST request
 * @param {string} url - The full URL
 * @param {object} payload - Request payload
 * @param {string} token - JWT token
 * @param {object} additionalParams - Additional HTTP params
 * @returns {object} - HTTP response
 */
export function authenticatedPost(url, payload, token, additionalParams = {}) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(additionalParams.headers || {}),
    },
    ...additionalParams,
  };

  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const response = http.post(url, body, params);
  requestCounter.add(1);

  return response;
}

/**
 * Make an authenticated PUT request
 * @param {string} url - The full URL
 * @param {object} payload - Request payload
 * @param {string} token - JWT token
 * @param {object} additionalParams - Additional HTTP params
 * @returns {object} - HTTP response
 */
export function authenticatedPut(url, payload, token, additionalParams = {}) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(additionalParams.headers || {}),
    },
    ...additionalParams,
  };

  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const response = http.put(url, body, params);
  requestCounter.add(1);

  return response;
}

/**
 * Make an authenticated DELETE request
 * @param {string} url - The full URL
 * @param {string} token - JWT token
 * @param {object} additionalParams - Additional HTTP params
 * @returns {object} - HTTP response
 */
export function authenticatedDelete(url, token, additionalParams = {}) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(additionalParams.headers || {}),
    },
    ...additionalParams,
  };

  const response = http.del(url, null, params);
  requestCounter.add(1);

  return response;
}

/**
 * Validate response and track errors
 * @param {object} response - HTTP response
 * @param {object} checks - Check conditions
 * @param {string} operationName - Name of the operation for logging
 * @returns {boolean} - Whether all checks passed
 */
export function validateResponse(
  response,
  checks,
  operationName = 'operation'
) {
  const success = check(response, checks);

  if (!success) {
    errorRate.add(1);
    const bodyPreview = response.body
      ? response.body.substring(0, 200)
      : 'No response body';
    console.error(
      `${operationName} failed: ${response.status} - ${bodyPreview}`
    );
  } else {
    errorRate.add(0);
  }

  return success;
}

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
export function randomString(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random email
 * @returns {string} - Random email
 */
export function randomEmail() {
  return `loadtest_${randomString(10)}@example.com`;
}

/**
 * Generate a random phone number
 * @returns {string} - Random phone number
 */
export function randomPhone() {
  return `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
}

/**
 * Generate random game data
 * @returns {object} - Game data
 */
export function randomGameData() {
  const gameNames = [
    'Space Adventure',
    'Dragon Quest',
    'City Builder',
    'Racing Mania',
    'Puzzle Master',
    'Tower Defense',
    'RPG Epic',
    'Strategy War',
  ];
  const descriptions = [
    'An exciting adventure game',
    'Battle epic monsters',
    'Build your empire',
    'Race to victory',
    'Solve challenging puzzles',
    'Defend your base',
    'Epic role-playing game',
    'Conquer the world',
  ];

  return {
    title: `${
      gameNames[Math.floor(Math.random() * gameNames.length)]
    } ${randomString(5)}`,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    categoryId: null, // Will be set dynamically
    freeTime: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
  };
}

/**
 * Generate mock file upload data
 * @param {string} filename - File name
 * @param {string} contentType - Content type
 * @param {number} size - File size in bytes (for mock)
 * @returns {object} - Mock file data
 */
export function mockFileData(filename, contentType, size = 1024) {
  // Generate mock binary data
  const mockData = randomString(size);

  return {
    data: mockData,
    filename: filename,
    content_type: contentType,
  };
}

/**
 * Generate mock game ZIP file
 * @returns {object} - Mock ZIP file data
 */
export function mockGameZip() {
  return mockFileData(
    `game_${randomString(8)}.zip`,
    'application/zip',
    1024 * 100
  ); // 100KB mock
}

/**
 * Generate mock thumbnail image
 * @returns {object} - Mock image file data
 */
export function mockThumbnail() {
  return mockFileData(`thumb_${randomString(8)}.png`, 'image/png', 1024 * 50); // 50KB mock
}

/**
 * Random sleep with variation (simulates realistic user behavior)
 * @param {number} min - Minimum sleep time in seconds
 * @param {number} max - Maximum sleep time in seconds
 */
export function randomSleep(min = 1, max = 5) {
  const duration = min + Math.random() * (max - min);
  sleep(duration);
}

/**
 * Get a random item from an array
 * @param {Array} array - The array
 * @returns {*} - Random item
 */
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Track operation duration
 * @param {function} operation - Function to execute
 * @param {string} metricName - Name for the metric
 * @returns {*} - Result of the operation
 */
export function trackDuration(operation, metricName) {
  const start = Date.now();
  const result = operation();
  const duration = Date.now() - start;
  customTrend.add(duration, { operation: metricName });
  return result;
}

/**
 * Parse response body safely
 * @param {object} response - HTTP response
 * @returns {object|null} - Parsed body or null
 */
export function parseBody(response) {
  try {
    return JSON.parse(response.body);
  } catch (e) {
    console.error(`Failed to parse response body: ${e.message}`);
    return null;
  }
}

export default {
  authenticate,
  authenticatedGet,
  authenticatedPost,
  authenticatedPut,
  authenticatedDelete,
  validateResponse,
  randomString,
  randomEmail,
  randomPhone,
  randomGameData,
  mockFileData,
  mockGameZip,
  mockThumbnail,
  randomSleep,
  randomItem,
  trackDuration,
  parseBody,
  errorRate,
  customTrend,
  requestCounter,
};
