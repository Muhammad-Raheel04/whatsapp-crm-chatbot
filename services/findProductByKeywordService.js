import { prisma } from "../config/prisma.js";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const NEGATION_WORDS = [
    "not", "don't", "dont", "no", "never", "stop", "cancel", "cancelled",
    "return", "returning", "refund", "broke", "broken", "defective",
    "damaged", "wrong", "mistake", "complaint", "complain", "issue",
    "problem", "faulty", "doesn't work", "not working", "stopped working",
];

const INTENT_WORDS = [
    "price", "cost", "how much", "buy", "order", "purchase", "want",
    "need", "interested", "available", "availability", "stock",
    "in stock", "details", "info", "information", "send me", "link",
    "delivery", "shipping", "discount", "offer", "sale", "deal",
];

const SUPPORT_WORDS = [
    "warranty", "receipt", "invoice", "order number", "tracking",
    "where is my", "when will i get", "delayed", "late", "missing",
];

const NEGATION_WINDOW = 6;
const MATCH_THRESHOLD = 1; 

const wordsAround = (tokens, matchIndex, matchLen, window) => {
    const start = Math.max(0, matchIndex - window);
    const end = Math.min(tokens.length, matchIndex + matchLen + window);
    return tokens.slice(start, end).join(" ");
};

const countOccurrences = (haystack, phrases) =>
    phrases.reduce((count, phrase) => {
        const pattern = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi");
        const found = haystack.match(pattern);
        return count + (found ? found.length : 0);
    }, 0);

const scoreCandidate = (normalizedText, keyword) => {
    const tokens = normalizedText.split(/\s+/);
    const keywordTokens = keyword.split(/\s+/);
    const keywordLen = keywordTokens.length;

    let matchIndex = -1;
    for (let i = 0; i <= tokens.length - keywordLen; i++) {
        if (tokens.slice(i, i + keywordLen).join(" ") === keyword) {
            matchIndex = i;
            break;
        }
    }
    if (matchIndex === -1) return null;

    const localContext = wordsAround(tokens, matchIndex, keywordLen, NEGATION_WINDOW);

    let score = 1; 

    const negationHits = countOccurrences(localContext, NEGATION_WORDS);
    const intentHits = countOccurrences(normalizedText, INTENT_WORDS);
    const supportHits = countOccurrences(normalizedText, SUPPORT_WORDS);

    score -= negationHits * 2;  
    score -= supportHits * 1.5;  
    score += intentHits * 1;    
    score += Math.min(keywordLen - 1, 2) * 0.25;

    const isBareMinimalMessage = tokens.length <= 3 && intentHits === 0;
    if (isBareMinimalMessage) score -= 0.5;

    return score;
};

export const findProductbyKeyword = async (text) => {
    const normalizedText = text.toLowerCase().trim();

    const productKeywords = await prisma.productKeyword.findMany({
        select: {
            keyword: true,
            product: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    media: true,
                },
            },
        },
    });

    const sorted = [...productKeywords].sort(
        (a, b) => b.keyword.length - a.keyword.length
    );

    let best = null; 
    const seenProductIds = new Set();

    for (const pk of sorted) {
        const keyword = pk.keyword.trim().toLowerCase();
        if (!keyword || seenProductIds.has(pk.product.id)) continue;

        const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
        if (!pattern.test(normalizedText)) continue;

        seenProductIds.add(pk.product.id);
        const score = scoreCandidate(normalizedText, keyword);
        if (score === null) continue;

        if (!best || score > best.score) {
            best = { product: pk.product, score };
        }
    }

    if (!best || best.score < MATCH_THRESHOLD) return null;
    return best.product;
};