import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getDelay, getMetaWhatsAppToken, setDelay, setMetaWhatsAppToken, setSystemPrompt } from '../controllers/settingController.js';
const router = express.Router();

router.patch("/set-meta-wa-token", isAuthenticated, setMetaWhatsAppToken);
router.get("/get-meta-wa-token", isAuthenticated, getMetaWhatsAppToken);

router.patch("/delay/:delay", isAuthenticated, setDelay);
router.get("/get-delay", isAuthenticated, getDelay);

router.patch("/set-system-prompt", isAuthenticated, setSystemPrompt);

export default router;