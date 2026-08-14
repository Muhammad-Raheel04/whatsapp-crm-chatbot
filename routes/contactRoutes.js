import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getAllContacts, getAllContactsWithLastMessage, getContactChatHistoryByContactId } from '../controllers/contactController.js';
const router = express.Router();

router.get("/get-all-contacts", isAuthenticated, getAllContacts);
router.get("/get-all-contacts-with-last-message", isAuthenticated, getAllContactsWithLastMessage);
router.get("/get-contact-chat-history/:contactId", isAuthenticated, getContactChatHistoryByContactId);

export default router;