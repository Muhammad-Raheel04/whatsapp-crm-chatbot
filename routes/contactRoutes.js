import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getAllContacts } from '../controllers/contactController.js';
const router = express.Router();

router.get("/get-all-contacts", isAuthenticated, getAllContacts);

export default router;