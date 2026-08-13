import { prisma } from "../config/prisma.js";
import { responseQueue } from "../queues/responseQueue.js";
import { resolveMediaType } from "../utils/resolveMediaType.js";

export const broadcastTextMessageAtSystemLevel = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is empty",
            })
        }

        const contacts = await prisma.contact.findMany();

        for (const contact of contacts) {
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
        }

        return res.status(200).json({
            success: true,
            message: "Reply queued",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const broadcastMediaMessageAtSystemLevel = async (req, res) => {
    try {
        const { caption } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "File is required",
            });
        }
        const contacts = await prisma.contact.findMany();

        for (const contact of contacts) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];

                const mediaType = resolveMediaType(file.mimetype);

                const relativePath = `uploads/broadcasts/${file.filename}`;

                const outgoingMessage = await prisma.message.create({
                    data: {
                        type: mediaType.toLowerCase(),
                        body: i === 0 ? caption : null,
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
                                caption: i === 0 ? caption : undefined,
                            },
                        },

                        contactId: contact.id,
                        messageId: outgoingMessage.id,
                    }
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Broadcast Media queued",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const broadcastTextMessageAtGroupLevel = async (req, res) => {
    try {
        const { text, groupIds } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is empty",
            });
        }

        if (!Array.isArray(groupIds) || groupIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "groupIds is required and must be a non-empty array",
            });
        }

        const parsedGroupIds = groupIds.map(Number);

        const contacts = await prisma.contact.findMany({
            where: {
                groups: {
                    some: {
                        groupId: { in: parsedGroupIds },
                    },
                },
            },
        });

        if (contacts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No contacts found in the selected group(s)",
            });
        }

        for (const contact of contacts) {
            const outgoingMessage = await prisma.message.create({
                data: {
                    type: "text",
                    body: text,
                    direction: "OUTGOING",
                    status: "PENDING",
                    contactId: contact.id,
                }
            });

            console.log("Job Queued", {
                to: contact.waId,
                response: { type: "TEXT", text },
                contactId: contact.id,
                messageId: outgoingMessage.id
            });

            await responseQueue.add(
                "send-message",
                {
                    to: contact.waId,
                    response: { type: "TEXT", text },
                    contactId: contact.id,
                    messageId: outgoingMessage.id
                }
            );
        }

        return res.status(200).json({
            success: true,
            message: `Broadcast queued for ${contacts.length} contact(s)`,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const broadcastMediaMessageAtGroupLevel = async (req, res) => {
    try {
        const { caption, groupIds } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "File is required",
            });
        }

        if (!Array.isArray(groupIds) || groupIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "groupIds is required and must be a non-empty array",
            });
        }

        const parsedGroupIds = groupIds.map(Number);

        const contacts = await prisma.contact.findMany({
            where: {
                groups: {
                    some: {
                        groupId: { in: parsedGroupIds },
                    },
                },
            },
        });

        if (contacts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No contacts found in the selected group(s)",
            });
        }

        for (const contact of contacts) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];

                const mediaType = resolveMediaType(file.mimetype);

                const relativePath = `uploads/broadcasts/${file.filename}`;

                const outgoingMessage = await prisma.message.create({
                    data: {
                        type: mediaType.toLowerCase(),
                        body: i === 0 ? caption : null,
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
                                caption: i === 0 ? caption : undefined,
                            },
                        },

                        contactId: contact.id,
                        messageId: outgoingMessage.id,
                    }
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: `Broadcast Media queued for ${contacts.length} contact(s)`,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}