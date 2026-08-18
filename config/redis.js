import Redis from 'ioredis';

export const redisConnection = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null
});

export default redisConnection;