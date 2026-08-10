import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { addKeywords, addMedia, addProduct, deleteProduct, getAllProducts, getProductById, getProductKeywords, getProductMedia } from '../controllers/productController.js';
import { upload } from '../middlewares/uploadMiddleware.js';
const router = express.Router();

router.get("/product/:productId", isAuthenticated, getProductById);
router.get("/get-all-products", isAuthenticated, getAllProducts);
router.post("/add-product", isAuthenticated, addProduct);
router.delete("/delete-product/:productId", isAuthenticated, deleteProduct);

router.get("/get-product-keywords/:productId", isAuthenticated, getProductKeywords);
router.post("/add-keywords/:productId", isAuthenticated, addKeywords);

router.get("/get-product-media/:productId", isAuthenticated, getProductMedia);
router.post("/:productId/media", isAuthenticated, upload.array("media", 10), addMedia);

export default router;