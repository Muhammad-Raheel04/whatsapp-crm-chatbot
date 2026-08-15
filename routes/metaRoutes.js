import express from "express";
import { getMetaStatus } from "../controllers/metaController.js";

const router = express.Router();

router.get("/meta-status", getMetaStatus);

export default router;