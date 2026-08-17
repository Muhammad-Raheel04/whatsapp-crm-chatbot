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

    console.log("[incomingMessageProcessor] starting message processing", {
        messageId: message?.id,
        contactWaId: contact?.wa_id,
        messageType: message?.type,
    });

    const tokenStatus = await getMetaTokenStatus();
    if (!tokenStatus.valid) {
        console.error("[incomingMessageProcessor] Meta token invalid before reply generation", {
            messageId: message?.id,
            contactWaId: contact?.wa_id,
            tokenStatus: tokenStatus?.message,
        });
        await handleTokenFailure();
        throw new TokenUnavailableError(tokenStatus.message);
    }

    let dbContact;
    try {
        dbContact = await prisma.contact.upsert({
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
        console.log("[incomingMessageProcessor] contact resolved/upserted", {
            contactId: dbContact?.id,
            waId: contact?.wa_id,
        });
    } catch (error) {
        console.error("[incomingMessageProcessor] failed upserting contact before AI processing", {
            messageId: message?.id,
            contactWaId: contact?.wa_id,
            message: error?.message,
            stack: error?.stack,
        });
        throw error;
    }

    try {
        const existingMessage = await prisma.message.findUnique({
            where: {
                waMessageId: message.id
            }
        });

        if (existingMessage) {
            console.log("[incomingMessageProcessor] duplicate message already exists; skipping", {
                messageId: message?.id,
                contactId: dbContact?.id,
            });
            return;
        }
    } catch (error) {
        console.error("[incomingMessageProcessor] failed checking duplicate message record", {
            messageId: message?.id,
            contactId: dbContact?.id,
            message: error?.message,
            stack: error?.stack,
        });
        throw error;
    }

    let body = null;
    if (message.type === "text") {
        body = message.text.body;
    }

    let botEnabled;
    try {
        botEnabled = await getBotMode(dbContact.id);
        console.log("[incomingMessageProcessor] botEnabled check complete", {
            contactId: dbContact?.id,
            botEnabled,
        });
    } catch (error) {
        console.error("[incomingMessageProcessor] failed reading bot mode", {
            contactId: dbContact?.id,
            messageId: message?.id,
            message: error?.message,
            stack: error?.stack,
        });
        throw error;
    }

    const incomingStatus = botEnabled ? "PROCESSED" : "RECEIVED";

    try {
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
        console.log("[incomingMessageProcessor] incoming message row created", {
            contactId: dbContact?.id,
            messageId: message?.id,
            status: incomingStatus,
        });
    } catch (error) {
        console.error("[incomingMessageProcessor] failed creating inbound message record", {
            contactId: dbContact?.id,
            messageId: message?.id,
            message: error?.message,
            stack: error?.stack,
        });
        throw error;
    }

    if (!botEnabled) {
        console.log("[incomingMessageProcessor] Bot disabled, skipping AI reply generation", {
            contactId: dbContact?.id,
            messageId: message?.id,
        });
        return;
    }

    try {
        console.log("[incomingMessageProcessor] invoking generateReply", {
            contactId: dbContact?.id,
            messageId: message?.id,
            textLength: body?.length ?? 0,
        });
        const reply = await generateReply(body, dbContact);
        console.log("[incomingMessageProcessor] generateReply returned", {
            contactId: dbContact?.id,
            messageId: message?.id,
            replyType: reply?.type,
            replyTextLength: reply?.text?.length ?? 0,
        });
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