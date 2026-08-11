import { prisma } from "../config/prisma.js"

export const getSystemPrompt = async () => {
    const settings = await prisma.settings.findUnique({
        where: {
            id: 1,
        }
    })

    return settings?.systemPrompt || "You are a WhatsApp assistant";
} 