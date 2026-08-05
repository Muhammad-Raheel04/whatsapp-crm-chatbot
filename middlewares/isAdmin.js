import { prisma } from "../config/prisma.js"

export const isAdmin = async(req, res, next) => {
    try {
        const user = await prisma.users.findUnique({
            where: {
                id: req.user.id,
            },
            select: {
                role: true,
            }
        })

        if (user.role === 'ADMIN') {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "Admins Only",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        })
    }
}