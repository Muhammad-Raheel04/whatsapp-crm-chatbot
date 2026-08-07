import { prisma } from "../config/prisma.js";

export const setDelay = async (req, res) => {
    try {
        const { delay } = req.params;
        const delayValue = Number(delay);

        if (!delay || isNaN(delayValue) || delayValue < 0) {
            return res.status(400).json({
                success: false,
                message: "Delay must be a valid positive number",
            })
        }
        await prisma.settings.upsert({
            where: {
                id: 1
            },
            create: {
                id: 1,
                responseDelay: delayValue
            },
            update: {
                responseDelay: delayValue
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
        const settings = await prisma.settings.findFirst();

        if (!settings.responseDelay) {
            return res.status(404).json({
                success: false,
                message: "Delay not configured"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Delay fetched successfully",
            delay: settings.responseDelay,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const setMetaWhatsAppToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "WA token is required"
            })
        }

        await prisma.settings.upsert({
            where: {
                id: 1,
            },
            create: {
                id: 1,
                metaWhatsAppToken: (token).trim(),
            },
            update: {
                metaWhatsAppToken: (token).trim()
            }
        })

        return res.status(200).json({
            success: true,
            message: "Whatsapp Token Updated Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const getMetaWhatsAppToken = async (req, res) => {
    try {
        const settings = await prisma.settings.findFirst();

        if (!settings.metaWhatsAppToken) {
            return res.status(404).json({
                success: false,
                message: "WhatsApp Token not configured"
            });
        }
        return res.status(200).json({
            success: true,
            message: "WhatsApp Access Token fetched Successfully",
            whatsAppAccessToken: settings.metaWhatsAppToken,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}