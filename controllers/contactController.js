import { prisma } from "../config/prisma.js"
import { toPublicMediaUrl } from "../utils/mediaUrl.js";

export const getAllContacts = async (req, res) => {
    try {
        const contacts = await prisma.contact.findMany({
            include: {
                groups: {
                    include: {
                        group: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Successfully fetched all contacts",
            contacts,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

export const getAllContactsWithLastMessage = async (req, res) => {
    try {
        const contactList = await prisma.contact.findMany({
            include: {
                message: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 1,
                },

            }
        });

        return res.status(200).json({
            success: true,
            message: "Successfully fetched contact list",
            contactList,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

export const getContactChatHistoryByContactId = async (req, res) => {
    try {
        const { contactId } = req.params;

        if (!contactId) {
            return res.status(400).json({
                success: false,
                message: "Contact id is required",
            })
        }

        const chatHistory = await prisma.message.findMany({
            where: {
                contactId: Number(contactId),
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20
        })

        return res.status(200).json({
            success: true,
            message: "Successfully fetched chat history",
            chatHistory: chatHistory.reverse().map((msg) => ({
                ...msg,
                mediaUrl: msg.mediaUrl ? toPublicMediaUrl(msg.mediaUrl) : null,
            }))
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        })
    }
}
