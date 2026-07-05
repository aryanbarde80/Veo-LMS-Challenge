import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import coursesRoutes from './routes/courses';
import sectionsRoutes from './routes/sections';
import paymentsRoutes from './routes/payments';
import enrollmentsRoutes from './routes/enrollments';
import adminRoutes from './routes/admin';
import videosRoutes from './routes/videos';

const app = express();

app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://veo-lms-challenge.vercel.app',
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/videos', videosRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
