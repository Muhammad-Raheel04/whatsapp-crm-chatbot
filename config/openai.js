import OpenAI from "openai";
import { getGrokApiKey } from "../services/grokApiKeyService.js";

let openai = null;
let initPromise = null;

const initClient = async () => {
    console.log("[openai:init] starting client initialization");
    const grokApiKey = process.env.GROQ_API_KEY;

    console.log("[openai:init] API key resolved from config source:", grokApiKey ? "present" : "missing");

    if (!grokApiKey) {
        console.error("[openai:init] no Groq/OpenAI key resolved; OpenAI client will remain unset");
        return null;
    }

    const client = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
    });

    console.log("[openai:init] OpenAI client created successfully");
    return client;
};

export const getOpenAIClient = async () => {
    if (openai) return openai;

    if (!initPromise) {
        initPromise = initClient()
            .then(client => {
                openai = client;
                initPromise = null;
                return client;
            })
            .catch(error => {
                console.error("[openai:init] failed during OpenAI client initialization", {
                    message: error?.message,
                    stack: error?.stack,
                });
                initPromise = null;
                return null;
            });
    }

    return initPromise;
};

export const resetOpenAIClient = () => {
    openai = null;
    initPromise = null;
};