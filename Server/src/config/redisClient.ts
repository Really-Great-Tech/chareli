import Redis from 'ioredis';
import logger from '../utils/logger';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const redis = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
});


redis.on('connect', () => {
  logger.info(`Redis client connected to ${redisHost}:${redisPort}`);
});

redis.on('error', (err) => {
  logger.error(`Redis connection error: ${err.message}`, {
    error: err.stack,
    host: redisHost,
    port: redisPort,
  });
});

redis.on('ready', () => {
  logger.info(`Redis client is ready and connected to ${redisHost}:${redisPort}`);
});

redis.on('reconnecting', (delay: number) => {
  logger.warn(`Redis client reconnecting in ${delay}ms to ${redisHost}:${redisPort}`);
});

redis.on('close', () => {
  logger.warn(`Redis connection closed for ${redisHost}:${redisPort}`);
});

// Log initial connection attempt
logger.info(`Initializing Redis client connection to ${redisHost}:${redisPort}`);

export default redis;
