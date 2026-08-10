import { prisma } from "../config/prisma.js";
import { responseQueue } from "../queues/responseQueue.js";
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

        const reply = await generateReply(body, dbContact);

        const delay = await getDelay();

        const outgoingMessage = await prisma.message.create({
            data: {
                type: "text",
                body: reply.text,
                direction: "OUTGOING",
                status: "PENDING",
                contactId: dbContact.id
            }

        });

        await responseQueue.add(
            "send-message",
            {
                to: message.from,
                response: reply,
                contactId: dbContact.id,
                messageId:outgoingMessage.id
            },
            {
                delay: delay * 1000
            }
        )

    } catch (error) {
        console.error("Incoming message processing failed", error.message)
    }
};