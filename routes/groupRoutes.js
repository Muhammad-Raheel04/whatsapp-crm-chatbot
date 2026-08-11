import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { addContactToGroup, createGroup, deleteGroup, getAllGroups, getGroupById, removeContactFromGroup } from '../controllers/groupController.js';
const router = express.Router();

router.get("/get-all-groups", isAuthenticated, getAllGroups);
router.get("/get-group-by-Id/:groupId", isAuthenticated, getGroupById);
router.post("/create-group", isAuthenticated, createGroup);
router.delete("/delete-group/:groupId", isAuthenticated, deleteGroup);
router.patch("/add-contact-to-group", isAuthenticated, addContactToGroup);
router.patch("/remove-contact-from-group", isAuthenticated, removeContactFromGroup);

export default router;