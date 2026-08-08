import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { addProduct } from '../controllers/productController.js';
const router = express.Router();

router.post("/add-product", isAuthenticated, addProduct);

export default router;