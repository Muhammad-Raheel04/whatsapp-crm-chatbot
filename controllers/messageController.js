import { prisma } from "../config/prisma.js";
import { responseQueue } from "../queues/responseQueue.js";
import { resolveMediaType } from "../utils/resolveMediaType.js";

const resolvePendingIncomingForContact = async (contactId) => {
    try {
        const { count } = await prisma.message.updateMany({
            where: {
                contactId: Number(contactId),
                direction: "INCOMING",
                status: "RECEIVED",
            },
            data: {
                status: "PROCESSED",
            },
        });
        if (count > 0) {
            console.log(`Marked ${count} incoming RECEIVED message(s) as PROCESSED for contact ${contactId}.`);
        }
        return count;
    } catch (err) {
        console.error(`Failed to resolve pending incoming messages for contact ${contactId}:`, err.message);
        return 0;
    }
};

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

        await resolvePendingIncomingForContact(contact.id);

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

export const sendAttachment = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { caption } = req.body;

        if (!contactId || contactId < 0) {
            return res.status(400).json({
                success: false,
                message: "Contact id is required",
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "File is required",
            });
        }

        const contact = await prisma.contact.findUnique({
            where: {
                id: Number(contactId)
            }
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found"
            });
        }

        await resolvePendingIncomingForContact(contact.id);

        const messageIds = [];

        for (const file of req.files) {
            const mediaType = resolveMediaType(file.mimetype);

            const relativePath = `uploads/chat/${contactId}/${file.filename}`;

            const outgoingMessage = await prisma.message.create({
                data: {
                    type: mediaType.toLowerCase(),
                    body: caption,
                    mediaUrl: relativePath,
                    direction: "OUTGOING",
                    status: "PENDING",
                    contactId: contact.id,
                    mimeType: file.mimetype,
                },
            });

            await responseQueue.add(
                "send-message",
                {
                    to: contact.waId,

                    response: {
                        type: "MEDIA",

                        media: {
                            type: mediaType.toLowerCase(),
                            filePath: relativePath,
                            caption,
                        },
                    },

                    contactId: contact.id,
                    messageId: outgoingMessage.id,
                }
            );

            messageIds.push(outgoingMessage.id);
        }

        return res.status(200).json({
            success: true,
            message: `${messageIds.length > 0 ? "Attachments" : "Attachment"} queued successfully`,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}