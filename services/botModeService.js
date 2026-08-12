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

    const groups = await prisma.groupContact.findMany({
        where: {
            contactId,
        },
        include: {
            group: true,
        }
    });
    if (groups.length === 0) {
        return true;
    }

    return groups.some((gc) => gc.group.aiEnabled === true);

} 