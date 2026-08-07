import { prisma } from "../config/prisma.js";
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
        console.log(reply);
        const response = await sendWhatsAppMessage({
            to: message.from,
            message: reply

        });
        console.log(response);
        await prisma.message.create({

            data: {
                waMessageId: response.messages[0].id,
                type: "text",
                body: reply,
                direction: "OUTGOING",
                status: "SENT",
                contactId: dbContact.id
            }

        });
    } catch (error) {
        console.error("Incoming message processing failed", error.message)
    }
};