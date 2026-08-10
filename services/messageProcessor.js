import { openai } from "../config/openai.js";
import { prisma } from "../config/prisma.js";
import { findProductbyKeyword } from "./findProductByKeywordService.js";

export const generateReply = async (text, dbContact) => {

    const message = text.toLowerCase();
    try {
        const product = await findProductbyKeyword(text);

        if (product) {
            return {
                type: "PRODUCT",
                text: product?.description,
                media: product.media,
            }
        }

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
                    role: msg.direction === "INCOMING"
                        ? "user"
                        : "assistant",
                    content: msg.body
                })),
                {
                    role: "user",
                    content: text,
                },
            ],
            temperature: 0.7,
        })

        return {
            type: "TEXT",
            text: response.choices[0].message.content,
        }
    } catch (error) {
        console.error("AI reply generation failed:", error.message);
        return {
            type: "TEXT",
            text: "Sorry, I'm having trouble replying right now. Please try again shortly."
        };
    }
}