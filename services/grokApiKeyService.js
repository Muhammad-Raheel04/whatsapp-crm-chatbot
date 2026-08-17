import { prisma } from "../config/prisma.js"

export const getGrokApiKey = async () => {
    console.log("[grokApiKeyService] fetching Groq/OpenAI key from DB");

    try {
        const settings = await prisma.settings.findUnique({
            where: {
                id: 1,
            }
        })

        const hasGroqApiKey = !!settings?.groqApiKey;
        const hasGroqOpenAiKey = !!settings?.groqOpenAiKey;

        console.log("[grokApiKeyService] DB settings lookup result", {
            hasSettings: !!settings,
            hasGroqApiKey,
            hasGroqOpenAiKey,
        });

        return settings?.groqApiKey;
    } catch (error) {
        console.error("[grokApiKeyService] failed reading Groq/OpenAI key from DB", {
            message: error?.message,
            stack: error?.stack,
        });
        return null;
    }
} 