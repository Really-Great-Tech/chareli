/**
 * CDN Fetch Utility with API Fallback
 *
 * Attempts to fetch from CDN first, falls back to API on failure.
 * Includes timeout, error handling, and metrics tracking.
 */

interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  timeout: number;
}

interface FetchOptions {
  cdnPath: string;
  apiPath: string;
  timeout?: number;
}

interface CDNMetadata {
  generatedAt: string;
  count: number;
  version: string;
}

export interface CDNResponse<T> {
  data: T;
  metadata?: CDNMetadata;
  source: 'cdn' | 'api';
  duration: number;
}

class CDNFetchService {
  private config: CDNConfig;
  private metrics = {
    cdnHits: 0,
    apiHits: 0,
    errors: 0,
  };

  constructor() {
    this.config = {
      enabled: import.meta.env.VITE_CDN_ENABLED === 'true',
      baseUrl: import.meta.env.VITE_CDN_BASE_URL || '',
      timeout: parseInt(import.meta.env.VITE_CDN_TIMEOUT || '3000', 10),
    };

    if (this.config.enabled) {
      console.debug('[CDN] Initialized:', {
        enabled: this.config.enabled,
        baseUrl: this.config.baseUrl,
        timeout: this.config.timeout,
      });
    }
  }

  /**
   * Fetch with CDN-first strategy
   */
  async fetch<T>(options: FetchOptions): Promise<CDNResponse<T>> {
    const startTime = performance.now();

    // Try CDN first if enabled
    if (this.config.enabled && this.config.baseUrl) {
      try {
        const data = await this.fetchFromCDN<T>(options);
        const duration = performance.now() - startTime;

        this.metrics.cdnHits++;
        console.debug(
          '[CDN] Fetch successful:',
          options.cdnPath,
          `${duration.toFixed(0)}ms`
        );

        return {
          data,
          metadata: (data as { metadata?: CDNMetadata }).metadata,
          source: 'cdn',
          duration,
        };
      } catch (error) {
        console.warn('[CDN] Fetch failed, falling back to API:', error);
        // Continue to API fallback
      }
    }

    // Fallback to API
    const duration = performance.now() - startTime;
    this.metrics.apiHits++;

    // Return a response structure that indicates API source
    // The actual API call will be made by the existing service
    return {
      data: null as T, // Will be filled by the caller
      source: 'api',
      duration,
    };
  }

  /**
   * Fetch from CDN with timeout
   */
  private async fetchFromCDN<T>(options: FetchOptions): Promise<T> {
    const url = `${this.config.baseUrl}/${options.cdnPath}`;
    const timeout = options.timeout || this.config.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `CDN returned ${response.status}: ${response.statusText}`
        );
      }

      const json = await response.json();

      // Extract data from CDN response structure
      // CDN responses have { categories/games/game: [...], metadata: {...} }
      return this.extractData<T>(json);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`CDN timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Extract data from CDN response
   */
  private extractData<T>(json: Record<string, unknown>): T {
    // CDN responses wrap data in specific keys
    if (json.categories) return json.categories as T;
    if (json.games) return json.games as T;
    if (json.game) return json.game as T;

    // If no wrapper, return as-is (API response)
    return json as T;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const total = this.metrics.cdnHits + this.metrics.apiHits;
    return {
      ...this.metrics,
      total,
      hitRate: total > 0 ? this.metrics.cdnHits / total : 0,
    };
  }

  /**
   * Check if CDN is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    this.metrics = {
      cdnHits: 0,
      apiHits: 0,
      errors: 0,
    };
  }
}

export const cdnFetch = new CDNFetchService();
export type { FetchOptions };

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as typeof window & { cdnFetch: CDNFetchService }).cdnFetch = cdnFetch;
}
