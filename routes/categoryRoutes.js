import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { addCategory, deleteCategory } from '../controllers/categoryController.js';
const router = express.Router();

router.post("/add-category", isAuthenticated, addCategory);
router.delete("/delete-category", isAuthenticated, deleteCategory);

export default router;