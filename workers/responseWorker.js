import { Worker } from "bullmq";
import { sendWhatsAppMedia, sendWhatsAppMessage } from "../services/whatsAppService.js";
import redisConnection from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { toPublicMediaUrl } from "../utils/mediaUrl.js";

const responseWorker = new Worker(
    "whatsapp-response",
    async (job) => {
        const { to, response, contactId, messageId } = job.data;

        let result;
        if (response.type === 'TEXT') {
            result = await sendWhatsAppMessage({ to, message: response.text });
        }
        else if (response.type === 'PRODUCT') {
            for (const media of response.media) {
                await sendWhatsAppMedia({
                    to,
                    media: {
                        type: media.type.toLowerCase(),
                        filePath: toPublicMediaUrl(media.filePath)
                    }
                });
            }

            result = await sendWhatsAppMessage({
                to,
                message: response.text
            });
        }

        try {
            if (result?.messages?.[0]?.id) {
                console.log(`Message sent successfully to ${to}.`);

                const targetMessage = await prisma.message.findUnique({
                    where: { id: messageId }
                });

                if (!targetMessage) {
                    console.warn(`Skipping response status update: outgoing message not found for id ${messageId}`);
                } else {
                    await prisma.message.update({
                        where: { id: messageId },
                        data: {
                            waMessageId: result.messages[0].id,
                            status: "SENT"
                        }
                    });
                }
            }
        } catch (err) {
            console.error(`Failed to send message to ${to}:`,err.response?.data || err.message);

            throw err;
        }

    },
    {
        connection: redisConnection,
        concurrency: 5
    }
)

responseWorker.on("failed", (job, err) => {
    console.error(`Response job ${job?.id} failed:`, err.message);
});