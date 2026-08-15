import { Worker } from "bullmq";
import { sendWhatsAppMedia, sendWhatsAppMessage } from "../services/whatsAppService.js";
import redisConnection from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { toPublicMediaUrl } from "../utils/mediaUrl.js";

const responseWorker = new Worker(
    "whatsapp-response",
    async (job) => {
        const { to, response, outgoingRecords: rawOutgoingRecords, messageId } = job.data;

        let outgoingRecords = rawOutgoingRecords;

        if (!outgoingRecords && messageId) {
            if (response.type === "TEXT") {
                outgoingRecords = [{ kind: "TEXT", messageId }];
            } else if (response.type === "MEDIA") {
                outgoingRecords = [{ kind: "MEDIA", messageId, media: response.media }];
            } else if (response.type === "PRODUCT") {
                outgoingRecords = [];
            }
        }

        const updateRecord = async (recordMessageId, result) => {
            if (!result?.messages?.[0]?.id) return;
            try {
                await prisma.message.update({
                    where: { id: recordMessageId },
                    data: { waMessageId: result.messages[0].id, status: "SENT" }
                });
                console.log(`Message sent successfully to ${to}.`);
            } catch (err) {
                console.error(`Failed to persist status for message ${recordMessageId}:`, err.message);
            }
        };

        const markFailed = async (recordMessageId) => {
            await prisma.message.update({
                where: { id: recordMessageId },
                data: { status: "FAILED" }
            }).catch(() => {});
        };

        if (response.type === "TEXT") {
            const record = outgoingRecords[0];
            if (!record) {
                console.error(`No outgoing record found for TEXT message to ${to}.`);
                return;
            }
            const result = await sendWhatsAppMessage({ to, message: response.text });
            await updateRecord(record.messageId, result);

        } else if (response.type === "MEDIA") {
            const record = outgoingRecords[0];
            if (!record) {
                console.error(`No outgoing record found for MEDIA message to ${to}.`);
                return;
            }
            const media = record.media || response.media;
            try {
                const result = await sendWhatsAppMedia({
                    to,
                    media: {
                        type: media.type.toLowerCase(),
                        filePath: toPublicMediaUrl(media.filePath),
                        caption: media.caption || undefined,
                    }
                });
                await updateRecord(record.messageId, result);
            } catch (err) {
                await markFailed(record.messageId);
                throw err;
            }

        } else if (response.type === "PRODUCT") {
            const mediaRecords = outgoingRecords.filter(r => r.kind === "MEDIA");
            const textRecord = outgoingRecords.find(r => r.kind === "TEXT");

            for (const record of mediaRecords) {
                try {
                    const result = await sendWhatsAppMedia({
                        to,
                        media: {
                            type: record.media.type.toLowerCase(),
                            filePath: toPublicMediaUrl(record.media.filePath)
                        }
                    });
                    await updateRecord(record.messageId, result);
                } catch (err) {
                    console.error(`Media send failed for message ${record.messageId}:`, err.response?.data || err.message);
                    await markFailed(record.messageId);
                    throw err;
                }
            }

            if (textRecord) {
                const textResult = await sendWhatsAppMessage({ to, message: response.text });
                await updateRecord(textRecord.messageId, textResult);
            }
        }
    },
    {
        connection: redisConnection,
        concurrency: 5
    }
);

responseWorker.on("failed", (job, err) => {
    console.error(`Response job ${job?.id} failed:`, err.message);
});