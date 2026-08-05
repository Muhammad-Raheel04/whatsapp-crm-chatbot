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

export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        await prisma.users.delete({
            where: {
                id: Number(userId),
            }
        })

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        const normalizedRole = role.trim().toUpperCase();

        if (!["USER", "ADMIN"].includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role",
            })
        }
        await prisma.users.update({
            where: {
                id: Number(userId),
            },
            data: {
                role: normalizedRole
            }
        })

        return res.status(200).json({
            success: true,
            message: "User role updated successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}