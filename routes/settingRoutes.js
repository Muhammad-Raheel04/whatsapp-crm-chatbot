import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getDelay, getGlobalAiMode, getgroqApiKey, getgroqOpenAiKey, getMetaWhatsAppToken, getSystemPrompt, setDelay, setgroqApiKey, setgroqOpenAiKey, setMetaWhatsAppToken, setSystemPrompt, togggleGlobalAIMode } from '../controllers/settingController.js';
const router = express.Router();

router.patch("/set-meta-wa-token", isAuthenticated, setMetaWhatsAppToken);
router.get("/get-meta-wa-token", isAuthenticated, getMetaWhatsAppToken);

router.patch("/set-groq-open-ai-key", isAuthenticated, setgroqOpenAiKey);
router.get("/get-groq-open-ai-key", isAuthenticated, getgroqOpenAiKey);

router.patch("/set-groq-api-key", isAuthenticated, setgroqApiKey);
router.get("/get-groq-api-key", isAuthenticated, getgroqApiKey);

router.patch("/delay/:delay", isAuthenticated, setDelay);
router.get("/get-delay", isAuthenticated, getDelay);

router.patch("/set-system-prompt", isAuthenticated, setSystemPrompt);
router.get("/get-system-prompt", isAuthenticated, getSystemPrompt);

router.patch("/toggle-global-ai-mode", isAuthenticated, togggleGlobalAIMode);
router.get("/get-global-ai-mode", isAuthenticated, getGlobalAiMode);

export default router;