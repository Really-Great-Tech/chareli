import Redis from 'ioredis';
import config from '../config/config';
import logger from '../utils/logger';

class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      maxRetriesPerRequest: null, // BullMQ requires this to be null
      lazyConnect: true,
      // Remove timeout settings that can interfere with BullMQ
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      logger.info('Redis connection established');
    });

    this.redis.on('ready', () => {
      logger.info('Redis ready to receive commands');
    });

    this.redis.on('error', (error: any) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  async connect(): Promise<void> {
    try {
      // Check if already connected or connecting
      if (this.redis.status === 'ready' || this.redis.status === 'connecting') {
        logger.info('Redis already connected or connecting');
        return;
      }
      
      await this.redis.connect();
      logger.info('Successfully connected to Redis');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      logger.info('Disconnected from Redis');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  getClient(): Redis {
    return this.redis;
  }

  async ping(): Promise<string> {
    return await this.redis.ping();
  }

  async isConnected(): Promise<boolean> {
    try {
      const result = await this.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}

export const redisService = new RedisService();
