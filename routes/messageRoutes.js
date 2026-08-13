import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { sendAttachment, sendTextMessage } from '../controllers/messageController.js';
import { chatUpload } from '../middlewares/chatMediaUploader.js';
const router = express.Router();

router.post("/send-text-message/:contactId", isAuthenticated, sendTextMessage);
router.post("/send-attachment/:contactId", chatUpload.array("files"), isAuthenticated, sendAttachment);

export default router;