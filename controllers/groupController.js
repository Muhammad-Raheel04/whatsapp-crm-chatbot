import { prisma } from '../config/prisma.js';

export const createGroup = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Group name is missing",
            })
        }

        const exisitingGroup = await prisma.contactGroup.findUnique({
            where: {
                name,
            }
        })

        if (exisitingGroup) {
            return res.status(409).json({
                success: false,
                message: `${name} group already exists`,
            })
        }

        const group = await prisma.contactGroup.create({
            data: {
                name,
            }
        })

        return res.status(201).json({
            success: true,
            message: `${name} group created successfully`,
            group,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}