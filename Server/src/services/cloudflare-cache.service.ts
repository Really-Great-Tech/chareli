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
 * Handles cache purging for:
 * 1. CDN domain (arcadesbox.org) - used for JSON files
 * 2. App domain (arcadesbox.com) - used for frontend assets
 */
class CloudflareCacheService {
  private apiToken: string;
  private cdnZoneId: string;
  private appZoneId: string;
  private baseUrl = 'https://api.cloudflare.com/client/v4';

  constructor() {
    this.apiToken = config.cloudflare?.apiToken || '';
    this.cdnZoneId = config.cloudflare?.cdnZoneId || '';
    this.appZoneId = config.cloudflare?.appZoneId || '';

    if (this.isEnabled()) {
      logger.info('[CloudflareCache] Service initialized', {
        cdnZoneId: this.cdnZoneId ? `${this.cdnZoneId.slice(0, 8)}...` : 'not set',
        appZoneId: this.appZoneId ? `${this.appZoneId.slice(0, 8)}...` : 'not set',
      });
    } else {
      logger.warn(
        '[CloudflareCache] Service partially disabled - check CLOUDFLARE config'
      );
    }
  }

  /**
   * Check if service is properly configured (needs at least API token and one zone)
   */
  isEnabled(): boolean {
    return Boolean(this.apiToken && (this.cdnZoneId || this.appZoneId));
  }

  /**
   * Purge specific URLs from Cloudflare cache (defaults to CDN zone)
   * @param urls - Array of full URLs to purge (max 30 per request)
   * @param zoneId - Optional zone ID (defaults to CDN zone)
   */
  async purgeUrls(urls: string[], zoneId?: string): Promise<boolean> {
    const targetZoneId = zoneId || this.cdnZoneId;

    if (!this.apiToken || !targetZoneId) {
      logger.debug('[CloudflareCache] Skipping purge - service/zone not enabled');
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
          `${this.baseUrl}/zones/${targetZoneId}/purge_cache`,
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
            zone: targetZoneId === this.cdnZoneId ? 'CDN' : 'APP'
          });
          allSuccess = false;
        } else {
          logger.info('[CloudflareCache] Successfully purged URLs', {
            count: batch.length,
            zone: targetZoneId === this.cdnZoneId ? 'CDN' : 'APP'
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
    if (!this.apiToken || !this.cdnZoneId) {
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

    return this.purgeUrls(urls, this.cdnZoneId);
  }

  /**
   * Purge all cached content for a specific zone
   */
  async purgeZone(zoneId: string): Promise<boolean> {
    if (!this.apiToken || !zoneId) {
      logger.debug('[CloudflareCache] Skipping purge zone - missing token or zoneId');
      return false;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/zones/${zoneId}/purge_cache`,
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
        logger.error('[CloudflareCache] Failed to purge zone', {
          status: response.status,
          errors: result.errors,
          zoneId
        });
        return false;
      }

      logger.warn(`[CloudflareCache] Purged ALL content for zone ${zoneId}`);
      return true;
    } catch (error) {
      logger.error('[CloudflareCache] Error purging zone', {
        error: error instanceof Error ? error.message : error,
        zoneId
      });
      return false;
    }
  }

  /**
   * Purge ALL content for CDN Zone (arcadesbox.org)
   */
  async purgeAll(): Promise<boolean> {
    return this.purgeZone(this.cdnZoneId);
  }

  /**
   * Purge ALL content for App Zone (arcadesbox.com)
   */
  async purgeApp(): Promise<boolean> {
    return this.purgeZone(this.appZoneId);
  }
}

export const cloudflareCacheService = new CloudflareCacheService();
