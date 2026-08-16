import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from "path";
import { fileURLToPath } from "url";

const PORT = process.env.PORT;

import webhookRoutes from './routes/webhookRoutes.js';
import './workers/whatsAppWorker.js'
import './workers/responseWorker.js';
import './services/tokenRecoveryWatcher.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import replyRoutes from './routes/messageRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';
import metaRoutes from './routes/metaRoutes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v1/", webhookRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/settings", settingRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/messages", replyRoutes);
app.use("/api/v1/broadcasts", broadcastRoutes);
app.use("/api/v1/meta", metaRoutes);

app.listen(PORT, () => {
  console.log(`visit http://localhost:${PORT}`);
})