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