import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { addContactToGroup, createGroup, deleteGroup } from '../controllers/groupController.js';
const router = express.Router();

router.post("/create-group", isAuthenticated, createGroup);
router.delete("/delete-group/:groupId", isAuthenticated, deleteGroup);
router.patch("/add-contact-to-group", isAuthenticated, addContactToGroup);
export default router;