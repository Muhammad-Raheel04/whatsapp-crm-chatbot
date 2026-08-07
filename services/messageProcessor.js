import { openai } from "../config/openai.js";
import { prisma } from "../config/prisma.js";

export const generateReply = async (text, dbContact) => {

    const message = text.toLowerCase();
    try {
        const previousMessages = await prisma.message.findMany({
            where: {
                contactId: dbContact.id
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 10
        })

        const response = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a WhatsApp assistant`
                },
                ...previousMessages.reverse().map(msg => ({
                    role: msg.direction === 'INCOMING' ? "user" : "assistant",
                    content: msg.body
                })),
                {
                    role: "user",
                    content: text,
                },
            ],
            temperature: 0.7,
        })

        return response.choices[0].message.content;
    } catch (error) {
        console.error("AI reply generation failed:", error.message);
    }
}