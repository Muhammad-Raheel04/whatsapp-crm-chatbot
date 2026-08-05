import { prisma } from "../config/prisma.js";

export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.users.findMany();

        return res.status(200).json({
            success: true,
            message: "Successfully fetched all users",
            users,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}