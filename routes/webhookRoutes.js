import express from 'express';
import { handleWhatsAppWebhook, verifyWhatsAppWebhook } from '../controllers/webhookController.js';
const router = express.Router();

router.get('/webhook', verifyWhatsAppWebhook);
router.post('/webhook', handleWhatsAppWebhook);

export default router;