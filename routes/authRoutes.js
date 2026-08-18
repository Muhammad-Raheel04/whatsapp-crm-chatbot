import express from "express";
import { forgotPasword, login, logout, refresh, register, updatePassword } from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', isAuthenticated, logout);
router.post('/refresh', refresh);

router.patch("/update-password/:email", updatePassword);
router.post("/forgot-password", forgotPasword);
export default router;