import { prisma } from "../config/prisma.js";

export const processStatusUpdate = async (job) => {
    const { statuses } = job.data;

    for (const status of statuses) {
        try {
            await prisma.message.updateMany({
                where: {
                    waMessageId: status.id
                },
                data: {
                    status: status.status.toUpperCase()
                }
            });
        } catch (err) {
            console.error(`status update failed for waMessageId ${status.id}:`, err.message);
        }
    }
};