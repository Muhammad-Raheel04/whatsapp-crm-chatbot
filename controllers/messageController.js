import { prisma } from "../config/prisma.js";
import { responseQueue } from "../queues/responseQueue.js";

export const sendTextMessage = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is empty",
            })
        }

        if (!contactId || contactId < 0) {
            return res.status(400).json({
                success: false,
                message: "Contact id is required",
            })
        }

        const contact = await prisma.contact.findUnique({
            where: {
                id: Number(contactId),
            }
        })

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found"
            });
        }

        const outgoingMessage = await prisma.message.create({
            data: {
                type: "text",
                body: text,
                direction: "OUTGOING",
                status: "PENDING",
                contactId: contact.id,
            }
        })
        console.log("Job Queued", {
            to: contact.waId,
            response: { type: "TEXT", text },
            contactId: contact.id,
            messageId: outgoingMessage.id
        })

        await responseQueue.add(
            "send-message",
            {
                to: contact.waId,
                response: { type: "TEXT", text },
                contactId: contact.id,
                messageId: outgoingMessage.id
            }
        )

        return res.status(200).json({
            success: true,
            message: "Reply queued",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        })
    }
}