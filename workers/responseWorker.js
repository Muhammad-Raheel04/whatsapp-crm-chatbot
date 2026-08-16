import { Worker } from "bullmq";
import { sendWhatsAppMedia, sendWhatsAppMessage } from "../services/whatsAppService.js";
import redisConnection from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { toPublicMediaUrl } from "../utils/mediaUrl.js";
import { getMetaTokenStatus, isTokenUnavailableError } from "../services/metaTokenStatusService.js";
import { handleTokenFailure } from "../services/tokenRecoveryWatcher.js";
import { TokenUnavailableError } from "../errors/TokenUnavailableError.js";

const isTokenFailure = (err) => isTokenUnavailableError(err);

const responseWorker = new Worker(
    "whatsapp-response",
    async (job) => {
        const { to, response, outgoingRecords: rawOutgoingRecords, messageId } = job.data;

        const tokenStatus = await getMetaTokenStatus();
        if (!tokenStatus.valid) {
            await handleTokenFailure();
            throw new TokenUnavailableError(tokenStatus.message);
        }

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

        const maxAttempts = job.opts?.attempts ?? job.queue?.defaultJobOptions?.attempts ?? 100;
        const isLastAttempt = (job.attemptsMade + 1) >= maxAttempts;

        const isAlreadySent = async (recordMessageId) => {
            if (!recordMessageId) return false;
            const row = await prisma.message.findUnique({
                where: { id: recordMessageId },
                select: { status: true, waMessageId: true }
            }).catch(() => null);
            if (!row) return false;
            return ["SENT", "DELIVERED", "READ"].includes(row.status) && !!row.waMessageId;
        };

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
            if (!isLastAttempt) return;
            await prisma.message.update({
                where: { id: recordMessageId },
                data: { status: "FAILED" }
            }).catch(() => {});
        };

        const wrapSend = async (recordMessageId, sendFn) => {
            if (recordMessageId && await isAlreadySent(recordMessageId)) {
                console.log(`Skipping resend for message ${recordMessageId} — already SENT/DELIVERED/READ.`);
                return null;
            }
            try {
                return await sendFn();
            } catch (err) {
                if (isTokenFailure(err)) {
                    await handleTokenFailure();
                    const wrapped = new TokenUnavailableError(err.message || "Meta token unavailable mid-send.");
                    wrapped.cause = err;
                    throw wrapped;
                }
                throw err;
            }
        };

        if (response.type === "TEXT") {
            const record = outgoingRecords[0];
            if (!record) {
                console.error(`No outgoing record found for TEXT message to ${to}.`);
                return;
            }
            try {
                const result = await wrapSend(record.messageId, () =>
                    sendWhatsAppMessage({ to, message: response.text })
                );
                if (result) await updateRecord(record.messageId, result);
            } catch (err) {
                if (!isTokenFailure(err)) {
                    await markFailed(record.messageId);
                }
                throw err;
            }

        } else if (response.type === "MEDIA") {
            const record = outgoingRecords[0];
            if (!record) {
                console.error(`No outgoing record found for MEDIA message to ${to}.`);
                return;
            }
            const media = record.media || response.media;
            try {
                const result = await wrapSend(record.messageId, () =>
                    sendWhatsAppMedia({
                        to,
                        media: {
                            type: media.type.toLowerCase(),
                            filePath: toPublicMediaUrl(media.filePath),
                            caption: media.caption || undefined,
                        }
                    })
                );
                if (result) await updateRecord(record.messageId, result);
            } catch (err) {
                if (!isTokenFailure(err)) {
                    await markFailed(record.messageId);
                }
                throw err;
            }

        } else if (response.type === "PRODUCT") {
            const mediaRecords = outgoingRecords.filter(r => r.kind === "MEDIA");
            const textRecord = outgoingRecords.find(r => r.kind === "TEXT");

            for (const record of mediaRecords) {
                try {
                    const result = await wrapSend(record.messageId, () =>
                        sendWhatsAppMedia({
                            to,
                            media: {
                                type: record.media.type.toLowerCase(),
                                filePath: toPublicMediaUrl(record.media.filePath)
                            }
                        })
                    );
                    if (result) await updateRecord(record.messageId, result);
                } catch (err) {
                    console.error(`Media send failed for message ${record.messageId}:`, err.response?.data || err.message);
                    if (!isTokenFailure(err)) {
                        await markFailed(record.messageId);
                    } else {
                        throw err;
                    }
                }
            }

            if (textRecord) {
                try {
                    const textResult = await wrapSend(textRecord.messageId, () =>
                        sendWhatsAppMessage({ to, message: response.text })
                    );
                    if (textResult) await updateRecord(textRecord.messageId, textResult);
                } catch (err) {
                    if (!isTokenFailure(err)) {
                        await markFailed(textRecord.messageId);
                    }
                    throw err;
                }
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