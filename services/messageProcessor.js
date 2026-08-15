import { openai } from "../config/openai.js";
import { prisma } from "../config/prisma.js";
import { findProductbyKeyword } from "./findProductByKeywordService.js";
import { getSystemPrompt } from "./systemPromptService.js";

export const generateReply = async (text, dbContact) => {

    const message = text.toLowerCase();
    try {
        const product = await findProductbyKeyword(text);

        if (product) {
            const enhancedText = await enhanceProductDescription(text, product);
            return {
                type: "PRODUCT",
                text: enhancedText,
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

        const systemPrompt = await getSystemPrompt();
        const response = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
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
const enhanceProductDescription = async (customerMessage, product) => {
    try {
        const response = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You represent this product and are replying to a customer on WhatsApp. Rewrite the product description below into a short, natural, conversational reply that directly addresses the customer's message. Do not invent details not present in the description. Keep it concise (2-4 sentences), friendly, and sales-appropriate.`
                },
                {
                    role: "user",
                    content: `Customer message: "${customerMessage}" Product Name: ${product.name} Product Description: ${product.description}`
                }
            ],
            temperature: 0.7,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Product description enhancement failed:", error.message);
        return product.description;
    }
}