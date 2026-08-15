import OpenAI from "openai";
import { getGrokApiKey } from "../services/grokApiKeyService.js";

let openai;

const setGrokApiKey = async () => {
    const grokApiKey = await getGrokApiKey();

    openai = new OpenAI({
        apiKey: grokApiKey,
        baseURL: "https://api.groq.com/openai/v1",
    });
};

await setGrokApiKey();

export { openai };