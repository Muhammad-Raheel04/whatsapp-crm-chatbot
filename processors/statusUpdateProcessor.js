import { prisma } from "../config/prisma.js";


export const processStatusUpdate = async (job) => {

    const { statuses } = job.data;

    try {
        for (const status of statuses) {
            await prisma.message.update({
                where: {
                    waMessageId: status.id
                },

                data: {
                    status: status.status.toUpperCase()
                }
            });
        }
    } catch (err) {
        console.error("status update failed", err.message);
    }

};