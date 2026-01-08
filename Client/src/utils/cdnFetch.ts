/**
 * CDN Fetch Utility with API Fallback
 *
 * Attempts to fetch from CDN first, falls back to API on failure.
 * Includes timeout, error handling, metrics tracking, and cache-busting via version parameter.
 */

interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  timeout: number;
  version: number | null;
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

interface CDNVersionResponse {
  success: boolean;
  data: {
    version: number;
    updatedAt: string;
    enabled: boolean;
  };
}

class CDNFetchService {
  private config: CDNConfig;
  private versionFetchPromise: Promise<void> | null = null;
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
      version: null,
    };

    if (this.config.enabled) {
      console.log('[CDN] Initialized:', {
        enabled: this.config.enabled,
        baseUrl: this.config.baseUrl,
        timeout: this.config.timeout,
      });

      // Fetch initial version (deferred, non-blocking)
      this.versionFetchPromise = this.fetchVersion();
    }
  }

  /**
   * Fetch the current CDN version from the backend
   * Used for cache-busting via ?v=<version> query parameter
   */
  private async fetchVersion(): Promise<void> {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/cdn/version`, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        console.warn('[CDN] Failed to fetch version:', response.status);
        return;
      }

      const data: CDNVersionResponse = await response.json();
      if (data.success && data.data.version) {
        this.config.version = data.data.version;
        console.log('[CDN] Version fetched:', this.config.version);
      }
    } catch (error) {
      console.warn('[CDN] Failed to fetch version:', error);
      // Continue without version - URLs will work but may serve cached content
    }
  }

  /**
   * Refresh the CDN version (useful after content updates)
   */
  async refreshVersion(): Promise<void> {
    await this.fetchVersion();
  }

  /**
   * Fetch with CDN-first strategy
   */
  async fetch<T>(options: FetchOptions): Promise<CDNResponse<T>> {
    const startTime = performance.now();

    // Try CDN first if enabled
    if (this.config.enabled && this.config.baseUrl) {
      // Wait for initial version fetch if still in progress
      if (this.versionFetchPromise) {
        await this.versionFetchPromise;
        this.versionFetchPromise = null;
      }

      try {
        const data = await this.fetchFromCDN<T>(options);
        const duration = performance.now() - startTime;

        this.metrics.cdnHits++;
        console.log(
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
   * Fetch from CDN with timeout and cache-busting version parameter
   */
  private async fetchFromCDN<T>(options: FetchOptions): Promise<T> {
    // Build URL with version parameter for cache-busting
    const versionParam = this.config.version ? `?v=${this.config.version}` : '';
    const url = `${this.config.baseUrl}/${options.cdnPath}${versionParam}`;
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
