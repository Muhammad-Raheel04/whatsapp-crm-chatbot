import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { sendTextMessage } from '../controllers/messageController.js';
const router = express.Router();

router.post("/send-text-message/:contactId", isAuthenticated, sendTextMessage);

export default router;