import { prisma } from "../config/prisma.js";
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const findProductbyKeyword = async (text) => {
    const normalizedText = text.toLowerCase();

    const productKeywords = await prisma.productKeyword.findMany({
        select: {
            keyword: true,
            product: {
                select: {
                    name: true,
                    description: true,
                    price: true,
                    media: true
                }
            }
        }
    });

    const sorted = [...productKeywords].sort(
        (a, b) => b.keyword.length - a.keyword.length
    );

    const match = sorted.find(pk => {
        const keyword = pk.keyword.trim().toLowerCase();
        if (!keyword) return false;
        const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
        return pattern.test(normalizedText);
    });

    return match?.product ?? null;
};