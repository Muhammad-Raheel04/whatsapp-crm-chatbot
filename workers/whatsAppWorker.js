import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { prisma } from "../config/prisma.js";


const whatsAppWorker = new Worker(
    "whatsapp-messages",
    async (job) => {
        const { message, contact } = job.data;

        let dbContact = null;
        if (contact?.wa_id) {
            dbContact = await prisma.contact.upsert({
                where: { waId: contact.wa_id },
                update: { name: contact.profile?.name },
                create: { waId: contact.wa_id, name: contact.profile?.name },
            })
        }

        const type = message.type;
        let body = null;
        let mimeType = null;

        if (type === "text") {
            body = message.text?.body;
        }

        await prisma.message.create({
            data: {
                waMessageId: message.id,
                type,
                body,
                mimeType,
                direction: "INCOMING",
                status: "PROCESSED",

                contact: {
                    connect: {
                        id: dbContact.id
                    }
                }
            }
        })

        console.log(`Processed message ${message.id} from ${message.from}`)
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
)

whatsAppWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
});

whatsAppWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

console.log("WhatsApp worker started, waiting for jobs...");

export default whatsAppWorker;