import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { addKeywords, addMedia, addProduct, deleteProduct } from '../controllers/productController.js';
import { upload } from '../middlewares/uploadMiddleware.js';
const router = express.Router();

router.post("/add-product", isAuthenticated, addProduct);
router.delete("/delete-product/:productId", isAuthenticated, deleteProduct);


router.post("/add-keywords/:productId", isAuthenticated, addKeywords);

router.post("/:productId/media", isAuthenticated, upload.array("media", 10), addMedia);

export default router;