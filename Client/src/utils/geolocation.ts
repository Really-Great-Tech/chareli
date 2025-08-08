/**
 * Geolocation utilities for detecting user's country based on IP address
 */

export interface GeolocationResponse {
  country_code: string;
  country: string;
  success: boolean;
}

const GEOLOCATION_CACHE_KEY = 'user_country_code';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get cached country code from localStorage
 */
function getCachedCountryCode(): string | null {
  try {
    const cached = localStorage.getItem(GEOLOCATION_CACHE_KEY);
    if (!cached) return null;

    const { countryCode, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (within 24 hours)
    if (now - timestamp < CACHE_DURATION) {
      return countryCode;
    }

    // Cache expired, remove it
    localStorage.removeItem(GEOLOCATION_CACHE_KEY);
    return null;
  } catch (error) {
    console.warn('Error reading cached country code:', error);
    return null;
  }
}

/**
 * Cache country code in localStorage
 */
function setCachedCountryCode(countryCode: string): void {
  try {
    const cacheData = {
      countryCode,
      timestamp: Date.now(),
    };
    localStorage.setItem(GEOLOCATION_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Error caching country code:', error);
  }
}

/**
 * Fetch user's country code from IP geolocation API
 * Uses ipapi.co as primary service with fallback to ip-api.com
 */
export async function fetchUserCountryCode(): Promise<string> {
  // Check cache first
  const cachedCountryCode = getCachedCountryCode();
  if (cachedCountryCode) {
    console.log('Using cached country code:', cachedCountryCode);
    return cachedCountryCode;
  }

  try {
    // Primary API: ipapi.co (no API key required, 1000 requests/day)
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.country_code) {
        const countryCode = data.country_code.toLowerCase();
        console.log('Detected country from ipapi.co:', countryCode);
        setCachedCountryCode(countryCode);
        return countryCode;
      }
    }
  } catch (error) {
    console.warn('Primary geolocation API failed:', error);
  }

  try {
    // Fallback API: ipinfo.io (50,000 requests/month free, no API key required for basic usage)
    const response = await fetch('https://ipinfo.io/json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.country) {
        const countryCode = data.country.toLowerCase();
        console.log('Detected country from ipinfo.io:', countryCode);
        setCachedCountryCode(countryCode);
        return countryCode;
      }
    }
  } catch (error) {
    console.warn('Fallback geolocation API failed:', error);
  }

  // If both APIs fail, return default country (US)
  console.log('Geolocation detection failed, using default country: us');
  return 'us';
}

/**
 * Clear cached country code (useful for testing or manual refresh)
 */
export function clearCountryCache(): void {
  try {
    localStorage.removeItem(GEOLOCATION_CACHE_KEY);
    console.log('Country cache cleared');
  } catch (error) {
    console.warn('Error clearing country cache:', error);
  }
}
