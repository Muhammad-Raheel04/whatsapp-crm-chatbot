import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { addCategory, deleteCategory, getCatogries } from '../controllers/categoryController.js';
const router = express.Router();

router.get("/get-all-categories", isAuthenticated, getCatogries);
router.post("/add-category", isAuthenticated, addCategory);
router.delete("/delete-category", isAuthenticated, deleteCategory);

export default router;