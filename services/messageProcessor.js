import { openai } from "../config/openai.js";
import { prisma } from "../config/prisma.js";
import { findProductbyKeyword } from "./findProductByKeywordService.js";
import { getSystemPrompt } from "./systemPromptService.js";

export const generateReply = async (text, dbContact) => {

    console.log("[messageProcessor] generateReply started", {
        contactId: dbContact?.id,
        textLength: text?.length ?? 0,
    });

    const message = text.toLowerCase();
    try {
        console.log("[messageProcessor] checking product match before AI call", {
            contactId: dbContact?.id,
        });
        const product = await findProductbyKeyword(text);

        if (product) {
            console.log("[messageProcessor] product match found; enhancing product reply", {
                contactId: dbContact?.id,
                productId: product?.id,
            });
            const enhancedText = await enhanceProductDescription(text, product);
            return {
                type: "PRODUCT",
                text: enhancedText,
                media: product.media,
            }
        }

        console.log("[messageProcessor] no product match; fetching previous messages", {
            contactId: dbContact?.id,
        });
        const previousMessages = await prisma.message.findMany({
            where: {
                contactId: dbContact.id
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 10
        })

        console.log("[messageProcessor] previous messages loaded", {
            contactId: dbContact?.id,
            previousMessageCount: previousMessages?.length ?? 0,
        });

        const systemPrompt = await getSystemPrompt();
        console.log("[messageProcessor] system prompt loaded", {
            contactId: dbContact?.id,
            hasSystemPrompt: !!systemPrompt,
        });

        if (!openai) {
            console.error("[messageProcessor] openai client is null before Groq request", {
                contactId: dbContact?.id,
            });
            throw new Error("OpenAI client is not initialized");
        }

        console.log("[messageProcessor] sending Groq/OpenAI completion request", {
            contactId: dbContact?.id,
            messageCount: previousMessages?.length ?? 0,
            model:process.env.OPEN_AI_MODEL,
        });

        const response = await openai.chat.completions.create({
            model: process.env.OPEN_AI_MODEL,
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

        console.log("[messageProcessor] Groq/OpenAI completion response received", {
            contactId: dbContact?.id,
            responseChoiceCount: response?.choices?.length ?? 0,
        });

        return {
            type: "TEXT",
            text: response.choices[0].message.content,
        }
    } catch (error) {
        console.error("[messageProcessor] AI reply generation failed", {
            contactId: dbContact?.id,
            step: "generateReply",
            message: error?.message,
            stack: error?.stack,
        });
        return {
            type: "TEXT",
            text: "Sorry, I'm having trouble replying right now. Please try again shortly."
        };
    }
}
const enhanceProductDescription = async (customerMessage, product) => {
    try {
        console.log("[messageProcessor] enhancing product description reply", {
            productId: product?.id,
        });
        const response = await openai.chat.completions.create({
            model: process.env.OPEN_AI_MODEL,
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

        console.log("[messageProcessor] product enhancement response received", {
            productId: product?.id,
            responseChoiceCount: response?.choices?.length ?? 0,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("[messageProcessor] Product description enhancement failed", {
            productId: product?.id,
            message: error?.message,
            stack: error?.stack,
        });
        return product.description;
    }
}