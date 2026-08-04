import 'dotenv/config';
import express from 'express';

const PORT = process.env.PORT;

import webhookRoutes from './routes/webhookRoutes.js';
import './workers/whatsAppWorker.js'
const app = express();
app.use(express.json());

app.use("/api/v1/", webhookRoutes);

app.listen(PORT, () => {
  console.log(`visit http://localhost:${PORT}`);
})