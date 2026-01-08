import logger from '../utils/logger';
import config from '../config/config';

/**
 * Cloudflare API response structure
 */
interface CloudflareApiResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: unknown;
}

/**
 * Cloudflare Cache Purge Service
 *
 * Handles cache purging for the CDN domain (arcadesbox.org) via Cloudflare API.
 * Used to invalidate cached JSON files after regeneration.
 */
class CloudflareCacheService {
  private apiToken: string;
  private zoneId: string;
  private baseUrl = 'https://api.cloudflare.com/client/v4';

  constructor() {
    this.apiToken = config.cloudflare?.apiToken || '';
    this.zoneId = config.cloudflare?.cdnZoneId || '';

    if (this.isEnabled()) {
      logger.info('[CloudflareCache] Service initialized', {
        zoneId: this.zoneId ? `${this.zoneId.slice(0, 8)}...` : 'not set',
      });
    } else {
      logger.warn(
        '[CloudflareCache] Service disabled - missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_CDN_ZONE_ID'
      );
    }
  }

  /**
   * Check if service is properly configured
   */
  isEnabled(): boolean {
    return Boolean(this.apiToken && this.zoneId);
  }

  /**
   * Purge specific URLs from Cloudflare cache
   * @param urls - Array of full URLs to purge (max 30 per request)
   */
  async purgeUrls(urls: string[]): Promise<boolean> {
    if (!this.isEnabled()) {
      logger.debug('[CloudflareCache] Skipping purge - service not enabled');
      return false;
    }

    if (urls.length === 0) {
      logger.debug('[CloudflareCache] No URLs to purge');
      return true;
    }

    // Cloudflare limits to 30 URLs per request
    const batchSize = 30;
    const batches = [];
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }

    let allSuccess = true;

    for (const batch of batches) {
      try {
        const response = await fetch(
          `${this.baseUrl}/zones/${this.zoneId}/purge_cache`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files: batch }),
          }
        );

        const result = (await response.json()) as CloudflareApiResponse;

        if (!response.ok || !result.success) {
          logger.error('[CloudflareCache] Failed to purge URLs', {
            status: response.status,
            errors: result.errors,
            urls: batch,
          });
          allSuccess = false;
        } else {
          logger.info('[CloudflareCache] Successfully purged URLs', {
            count: batch.length,
            urls: batch,
          });
        }
      } catch (error) {
        logger.error('[CloudflareCache] Error purging URLs', {
          error: error instanceof Error ? error.message : error,
          urls: batch,
        });
        allSuccess = false;
      }
    }

    return allSuccess;
  }

  /**
   * Purge CDN JSON files by their paths
   * Converts relative paths to full CDN URLs and purges them
   * @param paths - Relative paths like ['games_active.json', 'categories.json']
   */
  async purgeCdnJsonFiles(paths: string[]): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    const cdnBaseUrl = config.jsonCdn.baseUrl;
    if (!cdnBaseUrl) {
      logger.warn('[CloudflareCache] Cannot purge - JSON_CDN_BASE_URL not set');
      return false;
    }

    // Convert paths to full URLs
    const urls = paths.map((path) => {
      // Ensure path starts with cdn/ if not already
      const normalizedPath = path.startsWith('cdn/') ? path : `cdn/${path}`;
      return `${cdnBaseUrl.replace('/cdn', '')}/${normalizedPath}`;
    });

    logger.info('[CloudflareCache] Purging CDN JSON files', {
      paths,
      urls,
    });

    return this.purgeUrls(urls);
  }

  /**
   * Purge all cached content for the zone
   * WARNING: Use sparingly - affects all cached content
   */
  async purgeAll(): Promise<boolean> {
    if (!this.isEnabled()) {
      logger.debug('[CloudflareCache] Skipping purge all - service not enabled');
      return false;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/zones/${this.zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ purge_everything: true }),
        }
      );

      const result = (await response.json()) as CloudflareApiResponse;

      if (!response.ok || !result.success) {
        logger.error('[CloudflareCache] Failed to purge all', {
          status: response.status,
          errors: result.errors,
        });
        return false;
      }

      logger.warn('[CloudflareCache] Purged ALL cached content for zone');
      return true;
    } catch (error) {
      logger.error('[CloudflareCache] Error purging all', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }
}

export const cloudflareCacheService = new CloudflareCacheService();
