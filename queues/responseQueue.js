import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

export const responseQueue = new Queue(
    "whatsapp-response",
    {
        connection: redisConnection,
        defaultJobOptions: {
            attempts: 100,
            backoff: { type: "exponential", delay: 60000 },
            removeOnComplete: 1000,
            removeOnFail: false,
        }
    }
)