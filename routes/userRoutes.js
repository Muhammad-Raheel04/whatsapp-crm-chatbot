import express from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { isAdmin } from '../middlewares/isAdmin.js';
const router = express.Router();

router.get("/get-all-users", isAuthenticated, isAdmin, getAllUsers);

export default router;