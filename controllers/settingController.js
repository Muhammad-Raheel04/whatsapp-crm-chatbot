import { prisma } from "../config/prisma.js";

export const setDelay = async (req, res) => {
    try {
        const { delay } = req.params;

        await prisma.settings.upsert({
            where: {
                id: 1
            },
            create: {
                id: 1,
                responseDelay: Number(delay)
            },
            update: {
                responseDelay: Number(delay)
            }
        })

        return res.status(200).json({
            success: true,
            message: "Response Delay Updated Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const getDelay = async (req, res) => {
    try {
        const delay=await prisma.settings.findFirst();

        return res.status(200).json({
            success:true,
            message:"Delay fetched successfully",
            delay
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}