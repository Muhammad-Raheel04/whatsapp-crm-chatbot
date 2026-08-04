import { Queue } from 'bullmq';
import redisConnection from '../config/redis.js';

export const whatsappQueue = new Queue("whatsapp-messages", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
    }
})