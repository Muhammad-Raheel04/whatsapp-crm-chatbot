import { prisma } from "../config/prisma.js";

export const createGroup = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Group name is required",
            })
        }

        const exisitingGroup = await prisma.contactGroup.findUnique({
            where: {
                name: name.trim()
            }
        })

        if (exisitingGroup) {
            return res.status(409).json({
                success: false,
                message: "Group already exists",
            })
        }

        const group = await prisma.contactGroup.create({
            data: {
                name
            }
        })

        return res.status(200).json({
            success: true,
            message: "Group created successfully",
            group,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        })
    }
}