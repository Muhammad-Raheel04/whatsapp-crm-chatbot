import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { addContactToGroup, createGroup, deleteDescription, deleteGroup, deleteGroupPrompt, getAllGroups, getGroupById, getGroupMembers, removeContactFromGroup, setDescription, setGroupPrompt, updateGroupName } from '../controllers/groupController.js';
const router = express.Router();

router.get("/get-all-groups", isAuthenticated, getAllGroups);
router.get("/get-group-by-Id/:groupId", isAuthenticated, getGroupById);
router.get("/get-group-members/:groupId", isAuthenticated, getGroupMembers);
router.post("/create-group", isAuthenticated, createGroup);
router.delete("/delete-group/:groupId", isAuthenticated, deleteGroup);
router.patch("/update-group-name/:groupId", isAuthenticated, updateGroupName);
router.patch("/add-contact-to-group", isAuthenticated, addContactToGroup);
router.patch("/remove-contact-from-group", isAuthenticated, removeContactFromGroup);

router.patch("/set-description/:groupId", isAuthenticated, setDescription);
router.patch("/delete-description/:groupId", isAuthenticated, deleteDescription);

router.patch("/set-group-prompt/:groupId", isAuthenticated, setGroupPrompt);
router.patch("/delete-group-prompt/:groupId", isAuthenticated, deleteGroupPrompt);

export default router;