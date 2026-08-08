import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { addImage, addKeywords, addProduct, deleteProduct } from '../controllers/productController.js';
import { upload } from '../middlewares/uploadMiddleware.js';
const router = express.Router();

router.post("/add-product", isAuthenticated, addProduct);
router.delete("/delete-product/:productId", isAuthenticated, deleteProduct);


router.post("/add-keywords/:productId", isAuthenticated, addKeywords);

router.post("/:productId/images", upload.array("images", 10), addImage);

export default router;