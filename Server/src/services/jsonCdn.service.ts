import { AppDataSource } from '../config/database';
import { Game, GameStatus } from '../entities/Games';
import { Category } from '../entities/Category';
import { R2StorageAdapter } from './r2.storage.adapter';
import logger from '../utils/logger';
import config from '../config/config';

interface JsonCdnConfig {
  enabled: boolean;
  refreshIntervalMinutes: number;
  baseUrl: string;
}

interface JsonMetadata {
  generatedAt: string;
  count: number;
  version: string;
}

/**
 * Service to generate static JSON files for CDN caching
 * Reduces database load by serving pre-generated JSON from R2/CDN
 */
class JsonCdnService {
  private config: JsonCdnConfig;
  private isGenerating = false;
  private r2Adapter: R2StorageAdapter;
  private metrics = {
    generationCount: 0,
    lastGenerationDuration: 0,
    failureCount: 0,
  };

  constructor() {
    this.config = {
      enabled: config.jsonCdn.enabled,
      refreshIntervalMinutes: config.jsonCdn.refreshIntervalMinutes,
      baseUrl: config.jsonCdn.baseUrl,
    };
    this.r2Adapter = new R2StorageAdapter();
  }

  /**
   * Generate all static JSON files
   */
  async generateAllJsonFiles(): Promise<void> {
    if (this.isGenerating) {
      logger.warn('JSON generation already in progress, skipping');
      return;
    }

    this.isGenerating = true;
    const startTime = Date.now();

    try {
      logger.info('Starting JSON CDN generation...');

      // Generate in parallel for speed
      await Promise.all([
        this.generateCategoriesJson(),
        this.generateActiveGamesJson(),
        this.generateAllGamesJson(),
        this.generateAllGameDetailsJson(),
      ]);

      const duration = Date.now() - startTime;
      this.metrics.generationCount++;
      this.metrics.lastGenerationDuration = duration;

      logger.info(`JSON CDN generation completed in ${duration}ms`);
    } catch (error) {
      this.metrics.failureCount++;
      logger.error('Error generating JSON files:', error);
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Generate categories.json
   */
  private async generateCategoriesJson(): Promise<void> {
    try {
      const categoryRepository = AppDataSource.getRepository(Category);

      const categories = await categoryRepository.find({
        order: { name: 'ASC' },
        select: ['id', 'name', 'description', 'isDefault', 'createdAt'],
      });

      const json = {
        categories,
        metadata: this.createMetadata(categories.length),
      };

      await this.uploadJson('categories.json', json);
      logger.info(
        `Generated categories.json (${categories.length} categories)`
      );
    } catch (error) {
      logger.error('Error generating categories JSON:', error);
      throw error;
    }
  }

  /**
   * Generate games_active.json (all active games)
   */
  private async generateActiveGamesJson(): Promise<void> {
    try {
      const gameRepository = AppDataSource.getRepository(Game);

      const games = await gameRepository.find({
        where: { status: GameStatus.ACTIVE },
        relations: ['category', 'createdBy', 'thumbnailFile', 'gameFile'],
        order: { createdAt: 'DESC' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          status: true,
          config: true,
          baseLikeCount: true,
          position: true,
          processingStatus: true,
          createdAt: true,
          updatedAt: true,
          category: {
            id: true,
            name: true,
            description: true,
          },
          createdBy: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          thumbnailFile: {
            id: true,
            s3Key: true,
            type: true,
          },
          gameFile: {
            id: true,
            s3Key: true,
            type: true,
          },
        },
      });

      // Transform file s3Key to public URLs (match API response structure)
      const gamesWithUrls = games.map((game) => ({
        ...game,
        thumbnailFile: game.thumbnailFile
          ? {
              ...game.thumbnailFile,
              s3Key: this.r2Adapter.getPublicUrl(game.thumbnailFile.s3Key),
            }
          : null,
        gameFile: game.gameFile
          ? {
              ...game.gameFile,
              s3Key: this.r2Adapter.getPublicUrl(game.gameFile.s3Key),
            }
          : null,
      }));

      const json = {
        games: gamesWithUrls,
        metadata: this.createMetadata(games.length),
      };

      await this.uploadJson('games_active.json', json);
      logger.info(`Generated games_active.json (${games.length} games)`);
    } catch (error) {
      logger.error('Error generating active games JSON:', error);
      throw error;
    }
  }

  /**
   * Generate games_all.json (all games regardless of status)
   */
  private async generateAllGamesJson(): Promise<void> {
    try {
      const gameRepository = AppDataSource.getRepository(Game);

      const games = await gameRepository.find({
        relations: ['category', 'createdBy', 'thumbnailFile', 'gameFile'],
        order: { createdAt: 'DESC' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          status: true,
          config: true,
          baseLikeCount: true,
          position: true,
          processingStatus: true,
          createdAt: true,
          updatedAt: true,
          category: {
            id: true,
            name: true,
            description: true,
          },
          createdBy: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          thumbnailFile: {
            id: true,
            s3Key: true,
            type: true,
          },
          gameFile: {
            id: true,
            s3Key: true,
            type: true,
          },
        },
      });

      // Transform file s3Key to public URLs (match API response structure)
      const gamesWithUrls = games.map((game) => ({
        ...game,
        thumbnailFile: game.thumbnailFile
          ? {
              ...game.thumbnailFile,
              s3Key: this.r2Adapter.getPublicUrl(game.thumbnailFile.s3Key),
            }
          : null,
        gameFile: game.gameFile
          ? {
              ...game.gameFile,
              s3Key: this.r2Adapter.getPublicUrl(game.gameFile.s3Key),
            }
          : null,
      }));

      const json = {
        games: gamesWithUrls,
        metadata: this.createMetadata(games.length),
      };

      await this.uploadJson('games_all.json', json);
      logger.info(`Generated games_all.json (${games.length} games)`);
    } catch (error) {
      logger.error('Error generating all games JSON:', error);
      throw error;
    }
  }

  /**
   * Generate individual game detail JSON files
   */
  private async generateAllGameDetailsJson(): Promise<void> {
    try {
      const gameRepository = AppDataSource.getRepository(Game);

      const games = await gameRepository.find({
        where: { status: GameStatus.ACTIVE },
        select: {
          id: true,
          slug: true,
        },
      });

      // Generate files in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < games.length; i += batchSize) {
        const batch = games.slice(i, i + batchSize);
        await Promise.all(
          batch.map((game) => this.generateGameDetailJson(game.id, game.slug))
        );
      }

      logger.info(`Generated ${games.length} individual game JSON files`);
    } catch (error) {
      logger.error('Error generating game details JSON:', error);
      throw error;
    }
  }

  /**
   * Generate single game detail JSON
   */
  async generateGameDetailJson(gameId: string, slug: string): Promise<void> {
    try {
      const gameRepository = AppDataSource.getRepository(Game);

      const game = await gameRepository.findOne({
        where: { id: gameId },
        relations: ['category', 'createdBy', 'thumbnailFile', 'gameFile'],
      });

      if (!game) {
        logger.warn(`Game ${gameId} not found, skipping JSON generation`);
        return;
      }

      // Transform file s3Key to public URLs (match API response structure)
      const gameWithUrls = {
        ...game,
        thumbnailFile: game.thumbnailFile
          ? {
              ...game.thumbnailFile,
              s3Key: this.r2Adapter.getPublicUrl(game.thumbnailFile.s3Key),
            }
          : null,
        gameFile: game.gameFile
          ? {
              ...game.gameFile,
              s3Key: this.r2Adapter.getPublicUrl(game.gameFile.s3Key),
            }
          : null,
      };

      const json = {
        game: gameWithUrls,
        metadata: this.createMetadata(1),
      };

      // Use slug for better SEO/readability
      await this.uploadJson(`games/${slug}.json`, json);
    } catch (error) {
      logger.error(`Error generating game detail JSON for ${gameId}:`, error);
      // Don't throw - allow other games to continue processing
    }
  }

  /**
   * Upload JSON to R2 with CDN cache headers
   */
  private async uploadJson(key: string, data: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(data);
      const buffer = Buffer.from(jsonString, 'utf-8');

      // Use exact key path for CDN files (e.g., cdn/categories.json)
      const fullKey = `cdn/${key}`;

      await this.r2Adapter.uploadWithExactKey(
        fullKey,
        buffer,
        'application/json',
        {
          generatedAt: new Date().toISOString(),
          size: buffer.length.toString(),
        }
      );

      logger.debug(`Uploaded JSON to R2: ${fullKey} (${buffer.length} bytes)`);
    } catch (error) {
      logger.error(`Error uploading JSON ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate specific cache entries by regenerating them
   */
  async invalidateCache(paths: string[]): Promise<void> {
    if (!this.config.enabled) {
      logger.debug('JSON CDN is disabled, skipping cache invalidation');
      return;
    }

    logger.info(`Invalidating CDN cache for: ${paths.join(', ')}`);

    try {
      for (const path of paths) {
        if (path.includes('categories')) {
          await this.generateCategoriesJson();
        } else if (
          path.includes('games_active') ||
          path.includes('games_all')
        ) {
          // Regenerate both active and all games lists
          await this.generateActiveGamesJson();
          await this.generateAllGamesJson();
        } else if (path.includes('games/')) {
          const slug = path.replace('games/', '').replace('.json', '');
          const gameRepository = AppDataSource.getRepository(Game);
          const game = await gameRepository.findOne({
            where: { slug },
            select: ['id', 'slug'],
          });
          if (game) {
            await this.generateGameDetailJson(game.id, slug);
          }
        }
      }
      logger.info('Cache invalidation completed');
    } catch (error) {
      logger.error('Error during cache invalidation:', error);
      // Don't throw - invalidation failure shouldn't block the main operation
    }
  }

  /**
   * Get CDN URL for a JSON file
   */
  getCdnUrl(path: string): string {
    if (!this.config.enabled || !this.config.baseUrl) {
      return '';
    }
    return `${this.config.baseUrl}/cdn/${path}`;
  }

  /**
   * Check if CDN is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isGenerating: this.isGenerating,
      config: {
        enabled: this.config.enabled,
        refreshIntervalMinutes: this.config.refreshIntervalMinutes,
      },
    };
  }

  /**
   * Create metadata object for JSON files
   */
  private createMetadata(count: number): JsonMetadata {
    return {
      generatedAt: new Date().toISOString(),
      count,
      version: '1.0',
    };
  }
}

export const jsonCdnService = new JsonCdnService();
