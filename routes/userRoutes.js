import express from 'express';
import { deleteUser, getAllUsers } from '../controllers/userController.js';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';

const router = express.Router();

router.get("/get-all-users", isAuthenticated, getAllUsers);
router.delete("/delete-user/:userId", isAuthenticated, deleteUser);

export default router;