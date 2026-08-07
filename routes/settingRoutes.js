import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getDelay, setDelay } from '../controllers/settingController.js';
const router = express.Router();

router.post("/:delay", isAuthenticated, setDelay);
router.get("/get-delay", isAuthenticated, getDelay);

export default router;