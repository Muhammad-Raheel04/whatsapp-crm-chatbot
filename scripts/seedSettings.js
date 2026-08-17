import "dotenv/config";
import { prisma } from "../config/prisma.js";

const maskKey = (key) => {
    if (!key) return "<empty>";
    if (key.length <= 8) return "*".repeat(key.length);
    return `${key.slice(0, 4)}***${key.slice(-4)}`;
};

const main = async () => {
    const groqApiKey = process.env.GROQ_API_KEY;

    console.log("[seedSettings] Starting settings seed script");
    console.log("[seedSettings] GROQ_API_KEY env var present:", !!groqApiKey, groqApiKey ? `(${maskKey(groqApiKey)})` : "");

    if (!groqApiKey) {
        console.error("[seedSettings] FATAL: process.env.GROQ_API_KEY is empty or undefined.");
        console.error("[seedSettings] Set the GROQ_API_KEY environment variable in Railway before running this script.");
        process.exit(1);
    }

    if (!prisma) {
        console.error("[seedSettings] FATAL: Prisma client failed to initialize. Check DATABASE_URL.");
        process.exit(1);
    }

    try {
        const existing = await prisma.settings.findUnique({ where: { id: 1 } });
        console.log("[seedSettings] Existing Settings row id=1 present:", !!existing);
        if (existing) {
            console.log("[seedSettings] Existing groqApiKey was:", existing.groqApiKey ? maskKey(existing.groqApiKey) : "<null/empty>");
        }

        const result = await prisma.settings.upsert({
            where: { id: 1 },
            create: {
                id: 1,
                groqApiKey,
            },
            update: {
                groqApiKey,
            },
        });

        console.log("[seedSettings] Upsert SUCCESS — Settings id=1 written with groqApiKey:", maskKey(result.groqApiKey));
        console.log("[seedSettings] Settings createdAt:", result.createdAt, "updatedAt:", result.updatedAt);

        process.exit(0);
    } catch (error) {
        console.error("[seedSettings] FATAL: Upsert failed:", {
            message: error?.message,
            stack: error?.stack,
        });
        process.exit(1);
    }
};

main();
