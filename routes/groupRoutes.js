import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { createGroup } from '../controllers/groupController.js';
const router = express.Router();

router.post("/create-group", isAuthenticated, createGroup);


export default router;