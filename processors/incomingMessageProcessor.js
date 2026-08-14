import { prisma } from "../config/prisma.js";
import { responseQueue } from "../queues/responseQueue.js";
import { getBotMode } from "../services/botModeService.js";
import { getDelay } from "../services/delayService.js";
import { generateReply } from "../services/messageProcessor.js";
import { sendWhatsAppMessage } from "../services/whatsAppService.js";


export const processIncomingMessage = async (job) => {
    try {
        const { message, contact } = job.data;
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
            console.log("message exist")
            return;
        }


        let body = null;

        if (message.type === "text") {
            body = message.text.body;
        }

        await prisma.message.create({
            data: {
                waMessageId: message.id,
                type: message.type,
                body,
                direction: "INCOMING",
                status: "PROCESSED",
                contactId: dbContact.id
            }

        });

        const botEnabled = await getBotMode(dbContact.id);

        if (!botEnabled) {
            console.log("Bot disabled. Reply Manually");
            return;
        }
        const reply = await generateReply(body, dbContact);

        const delay = await getDelay();

        const outgoingRecords = [];

        if (reply.type === 'PRODUCT') {
            for (const media of reply.media) {
                const row = await prisma.message.create({
                    data: {
                        type: reply.type,
                        body: reply.text,
                        direction: "OUTGOING",
                        status: "PENDING",
                        contactId: dbContact.id
                    }
                })
                outgoingRecords.push({ kind: "MEDIA", messageId: row.id, media })
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
            const row = await prisma.message.create({
                data: {
                    type: reply.type,
                    body: reply.text,
                    direction: "OUTGOING",
                    status: "PENDING",
                    contactId: dbContact.id,
                }
            })
            outgoingRecords.push({ kind: "MEDIA", messageId: row.id, media: reply.media })
        }
        else {
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
        )

    } catch (error) {
        console.error("Incoming message processing failed", error.message)
    }
};