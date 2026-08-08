import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { addKeywords, addProduct, deleteProduct } from '../controllers/productController.js';
const router = express.Router();

router.post("/add-product", isAuthenticated, addProduct);
router.delete("/delete-product/:productId", isAuthenticated, deleteProduct);


router.post("/add-keywords/:productId", isAuthenticated, addKeywords);

export default router;