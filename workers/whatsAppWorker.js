import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { processIncomingMessage } from "../processors/incomingMessageProcessor.js";
import { processStatusUpdate } from "../processors/statusUpdateProcessor.js";


const whatsAppWorker = new Worker(
    "whatsapp-messages",
    async (job) => {
        switch (job.name) {
            case "incoming-message":
                await processIncomingMessage(job);
                break;
            case "message-status-update":
                await processStatusUpdate(job);
                break;
            default:
                console.log(`Unknown job ${job.name}`);
        }
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
)

whatsAppWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
});

whatsAppWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

console.log("WhatsApp worker started, waiting for jobs...");

export default whatsAppWorker;