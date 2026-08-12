import { prisma } from "../config/prisma.js"

export const getBotMode = async (contactId) => {
    const groups = await prisma.groupContact.findMany({
        where: {
            contactId,
        },
        include: {
            group: true,
        }
    });

    if (groups.length > 0) {
        const isAiEnabled = groups.some((gc) => gc.group.aiEnabled === true);

        return isAiEnabled;
    }
    
    const settings = await prisma.settings.findUnique({
        where: {
            id: 1,
        }
    })

    return settings?.aiEnabled;
} 