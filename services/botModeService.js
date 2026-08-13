import { prisma } from "../config/prisma.js"

export const getBotMode = async (contactId) => {

    const settings = await prisma.settings.findUnique({
        where: {
            id: 1,
        }
    })

    if (settings.aiEnabled) {
        return settings?.aiEnabled;
    }

} 