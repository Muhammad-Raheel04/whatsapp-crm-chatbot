import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const PORT = process.env.PORT;

import webhookRoutes from './routes/webhookRoutes.js';
import './workers/whatsAppWorker.js'
import './workers/responseWorker.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import settingRoutes from './routes/settingRoutes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))

app.use("/api/v1/", webhookRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/settings", settingRoutes);

app.listen(PORT, () => {
  console.log(`visit http://localhost:${PORT}`);
})