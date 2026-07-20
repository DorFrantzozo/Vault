import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import webpush from 'web-push';
import { connectDB } from './config/db.js';
import { corsOptions } from './config/corsConfig.js';
import { globalLimiter } from './config/rateLimiters.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { initCronJobs } from './services/cronService.js';

import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

connectDB();

// Initialize VAPID Keys for Web Push if missing
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('\n[WARNING] VAPID Keys were not found in .env. Generated new keys:');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`);
  process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
  process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
}

webpush.setVapidDetails(
  'mailto:dorfrant3@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Initialize Cron Jobs
initCronJobs();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter
app.use('/api', globalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/settings', settingsRoutes);

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
