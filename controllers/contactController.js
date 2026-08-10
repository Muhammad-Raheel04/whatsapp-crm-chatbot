import { prisma } from "../config/prisma.js"

export const getAllContacts = async (req, res) => {
    try {
        const contacts = await prisma.contact.findMany();

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
