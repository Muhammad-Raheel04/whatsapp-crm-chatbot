import express from 'express';
import { deleteUser, getAllUsers, updateUserRole } from '../controllers/userController.js';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { isAdmin } from '../middlewares/isAdmin.js';
const router = express.Router();

router.get("/get-all-users", isAuthenticated, isAdmin, getAllUsers);
router.delete("/delete-user/:userId", isAuthenticated, isAdmin, deleteUser);
router.patch("/update-user-role/:userId", isAuthenticated, isAdmin, updateUserRole);

export default router;