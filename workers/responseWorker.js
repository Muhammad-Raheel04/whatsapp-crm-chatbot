import { Worker } from "bullmq";
import { sendWhatsAppMessage } from "../services/whatsAppService.js";
import redisConnection from "../config/redis.js";
import { prisma } from "../config/prisma.js";

const responseWorker = new Worker(
    "whatsapp-response",
    async (job) => {
        const { to, message, contactId, messageId } = job.data;

        const response = await sendWhatsAppMessage({ to, message });
        await prisma.message.update({
            where: {
                id: messageId
            },
            data: {
                waMessageId: response.messages[0].id,
                status: "SENT"
            }
        });

        console.log("Message sent");
    },
    {
        connection: redisConnection,
        concurrency: 5
    }
)