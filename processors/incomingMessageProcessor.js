import { prisma } from "../config/prisma.js";
import { responseQueue } from "../queues/responseQueue.js";
import { getBotMode } from "../services/botModeService.js";
import { getDelay } from "../services/delayService.js";
import { generateReply } from "../services/messageProcessor.js";
import { sendWhatsAppMessage } from "../services/whatsAppService.js";
import { getMetaTokenStatus, isTokenUnavailableError } from "../services/metaTokenStatusService.js";
import { handleTokenFailure } from "../services/tokenRecoveryWatcher.js";
import { TokenUnavailableError } from "../errors/TokenUnavailableError.js";

export const processIncomingMessage = async (job) => {
    const { message, contact } = job.data;

    const tokenStatus = await getMetaTokenStatus();
    if (!tokenStatus.valid) {
        await handleTokenFailure();
        throw new TokenUnavailableError(tokenStatus.message);
    }

    const dbContact = await prisma.contact.upsert({
        where: {
            waId: contact.wa_id
        },
        update: {
            name: contact.profile?.name
        },
        create: {
            waId: contact.wa_id,
            name: contact.profile?.name
        }
    });

    const existingMessage = await prisma.message.findUnique({
        where: {
            waMessageId: message.id
        }
    });

    if (existingMessage) {
        console.log("message exist");
        return;
    }

    let body = null;
    if (message.type === "text") {
        body = message.text.body;
    }

    const botEnabled = await getBotMode(dbContact.id);

    const incomingStatus = botEnabled ? "PROCESSED" : "RECEIVED";

    await prisma.message.create({
        data: {
            waMessageId: message.id,
            type: message.type,
            body,
            direction: "INCOMING",
            status: incomingStatus,
            contactId: dbContact.id
        }
    });

    if (!botEnabled) {
        console.log("Bot disabled. Reply Manually (incoming saved as RECEIVED).");
        return;
    }

    try {
        const reply = await generateReply(body, dbContact);
        const delay = await getDelay();
        const outgoingRecords = [];

        if (reply.type === 'PRODUCT') {
            for (const media of reply.media) {
                const row = await prisma.message.create({
                    data: {
                        type: media.type,
                        mediaUrl: media.filePath,
                        direction: "OUTGOING",
                        status: "PENDING",
                        contactId: dbContact.id
                    }
                });
                outgoingRecords.push({ kind: "MEDIA", messageId: row.id, media });
            }
            const textRow = await prisma.message.create({
                data: {
                    type: "text",
                    body: reply.text,
                    direction: "OUTGOING",
                    status: "PENDING",
                    contactId: dbContact.id
                }
            });
            outgoingRecords.push({ kind: "TEXT", messageId: textRow.id });
        } else if (reply.type === "MEDIA") {
            for (const media of reply.media) {
                const row = await prisma.message.create({
                    data: {
                        type: media.type,
                        mediaUrl: media.filePath,
                        direction: "OUTGOING",
                        status: "PENDING",
                        contactId: dbContact.id,
                    },
                });
                outgoingRecords.push({
                    kind: "MEDIA",
                    messageId: row.id,
                    media,
                });
            }
            const textRow = await prisma.message.create({
                data: {
                    type: "text",
                    body: reply.text,
                    direction: "OUTGOING",
                    status: "PENDING",
                    contactId: dbContact.id,
                },
            });
            outgoingRecords.push({
                kind: "TEXT",
                messageId: textRow.id,
            });
        } else {
            const row = await prisma.message.create({
                data: {
                    type: "text",
                    body: reply.text,
                    direction: "OUTGOING",
                    status: "PENDING",
                    contactId: dbContact.id
                }
            });
            outgoingRecords.push({ kind: "TEXT", messageId: row.id });
        }

        await responseQueue.add(
            "send-message",
            {
                to: message.from,
                response: reply,
                contactId: dbContact.id,
                outgoingRecords
            },
            {
                delay: delay * 1000
            }
        );
    } catch (error) {
        if (isTokenUnavailableError(error)) {
            await handleTokenFailure();
            throw new TokenUnavailableError(error.message);
        }
        throw error;
    }
};