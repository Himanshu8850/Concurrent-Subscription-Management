import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redisClient = null;

const createRedisClient = () => {
  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL not configured, Redis features disabled');
    return null;
  }

  try {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: times => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    client.on('error', err => {
      logger.error({ err }, 'Redis connection error');
    });

    redisClient = client;
    return client;
  } catch (error) {
    logger.error({ err: error }, 'Failed to create Redis client');
    return null;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};

export { getRedisClient, createRedisClient };
