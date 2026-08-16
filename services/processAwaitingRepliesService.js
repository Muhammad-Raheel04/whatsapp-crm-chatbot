import { prisma } from "../config/prisma.js";
import { responseQueue } from "../queues/responseQueue.js";
import { getDelay } from "../services/delayService.js";
import { generateReply } from "../services/messageProcessor.js";
import { getMetaTokenStatus, isTokenUnavailableError } from "../services/metaTokenStatusService.js";
import { handleTokenFailure } from "../services/tokenRecoveryWatcher.js";
import { TokenUnavailableError } from "../errors/TokenUnavailableError.js";

export const processAwaitingRepliesAfterAiEnabled = async () => {
    const tokenStatus = await getMetaTokenStatus();
    if (!tokenStatus.valid) {
        await handleTokenFailure();
        throw new TokenUnavailableError(tokenStatus.message);
    }

    const awaitingContacts = await prisma.message.findMany({
        where: {
            direction: "INCOMING",
            status: "RECEIVED",
        },
        distinct: ["contactId"],
        select: { contactId: true },
    });

    if (awaitingContacts.length === 0) {
        return { processed: 0, queued: 0 };
    }

    const contactIds = awaitingContacts.map(c => c.contactId);
    const contacts = await prisma.contact.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, waId: true },
    });

    const byId = new Map(contacts.map(c => [c.id, c]));

    let queued = 0;
    let processed = 0;

    for (const { contactId } of awaitingContacts) {
        const contact = byId.get(contactId);
        if (!contact) continue;

        const awaiting = await prisma.message.findMany({
            where: {
                contactId,
                direction: "INCOMING",
                status: "RECEIVED",
            },
            orderBy: { createdAt: "asc" },
            select: { id: true, waMessageId: true, body: true, createdAt: true },
        });

        if (awaiting.length === 0) continue;

        const trigger = awaiting[awaiting.length - 1];
        const triggerBody = trigger.body ?? "";

        try {
            const reply = await generateReply(triggerBody, contact);
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
                            contactId,
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
                        contactId,
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
                            contactId,
                        },
                    });
                    outgoingRecords.push({ kind: "MEDIA", messageId: row.id, media });
                }
                const textRow = await prisma.message.create({
                    data: {
                        type: "text",
                        body: reply.text,
                        direction: "OUTGOING",
                        status: "PENDING",
                        contactId,
                    },
                });
                outgoingRecords.push({ kind: "TEXT", messageId: textRow.id });
            } else {
                const row = await prisma.message.create({
                    data: {
                        type: "text",
                        body: reply.text,
                        direction: "OUTGOING",
                        status: "PENDING",
                        contactId,
                    }
                });
                outgoingRecords.push({ kind: "TEXT", messageId: row.id });
            }

            await prisma.message.updateMany({
                where: {
                    id: { in: awaiting.map(m => m.id) },
                    direction: "INCOMING",
                    status: "RECEIVED",
                },
                data: { status: "PROCESSED" },
            });
            processed += awaiting.length;

            await responseQueue.add(
                "send-message",
                {
                    to: contact.waId,
                    response: reply,
                    contactId,
                    outgoingRecords,
                },
                {
                    delay: delay * 1000,
                }
            );
            queued += 1;
        } catch (error) {
            if (isTokenUnavailableError(error)) {
                await handleTokenFailure();
                throw new TokenUnavailableError(error.message);
            }
            console.error(`processAwaitingReplies: failed for contact ${contactId}, skipping:`, error.message);
        }
    }

    return { processed, queued };
};
