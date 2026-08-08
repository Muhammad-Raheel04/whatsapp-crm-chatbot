import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getDelay, getMetaWhatsAppToken, setDelay, setMetaWhatsAppToken } from '../controllers/settingController.js';
const router = express.Router();

router.post("/set-meta-wa-token", isAuthenticated, setMetaWhatsAppToken);
router.get("/get-meta-wa-token", isAuthenticated, getMetaWhatsAppToken);

router.post("/delay/:delay", isAuthenticated, setDelay);
router.get("/get-delay", isAuthenticated, getDelay);

export default router;