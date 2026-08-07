import { prisma } from "../config/prisma.js"

export const getDelay = async () => {
    const settings = await prisma.settings.findUnique({
        where: {
            id: 1,
        }
    })

    return settings?.responseDelay ?? 5;
} 