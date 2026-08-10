import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getAllContacts, getAllContactsWithLastMessage } from '../controllers/contactController.js';
const router = express.Router();

router.get("/get-all-contacts", isAuthenticated, getAllContacts);
router.get("/get-all-contacts-with-last-message", isAuthenticated, getAllContactsWithLastMessage);

export default router;