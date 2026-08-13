import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { broadcastMediaMessageAtSystemLevel, broadcastTextMessageAtSystemLevel } from '../controllers/broadcastController.js';
import { broadcastUpload } from '../middlewares/broadcastMediaUploader.js';

const router = express.Router();

router.post("/send-system-level-text-broadcast", isAuthenticated, broadcastTextMessageAtSystemLevel);
router.post("/send-system-level-media-broadcast", broadcastUpload.array("files"), isAuthenticated, broadcastMediaMessageAtSystemLevel);

export default router;