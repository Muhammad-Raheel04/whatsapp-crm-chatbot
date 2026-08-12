import { prisma } from "../config/prisma.js"

export const getBotMode = async () => {
    const settings = await prisma.settings.findUnique({
        where: {
            id: 1,
        }
    })

    return settings?.aiEnabled;
} 