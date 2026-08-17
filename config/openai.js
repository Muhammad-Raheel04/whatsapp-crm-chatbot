import OpenAI from "openai";
import { getGrokApiKey } from "../services/grokApiKeyService.js";

let openai = null;

const setGrokApiKey = async () => {
    try {
        console.log("[openai:init] starting client initialization");
        const grokApiKey = await getGrokApiKey();

        console.log("[openai:init] API key resolved from config source:", grokApiKey ? "present" : "missing");

        if (!grokApiKey) {
            console.error("[openai:init] no Groq/OpenAI key resolved; OpenAI client will remain unset");
            return;
        }

        openai = new OpenAI({
            apiKey: grokApiKey,
            baseURL: "https://api.groq.com/openai/v1",
        });

        console.log("[openai:init] OpenAI client created successfully");
    } catch (error) {
        console.error("[openai:init] failed during OpenAI client initialization", {
            message: error?.message,
            stack: error?.stack,
        });
        openai = null;
    }
};

try {
    await setGrokApiKey();
} catch (error) {
    console.error("[openai:init] top-level initialization failure", {
        message: error?.message,
        stack: error?.stack,
    });
}

export { openai };