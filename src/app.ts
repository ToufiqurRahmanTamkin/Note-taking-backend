import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import noteRoutes from './routes/noteRoutes';
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import aggregationRoutes from './routes/aggregationRoutes';
import { notFound, errorHandler } from './middleware/error';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin === '*' ? true : env.clientOrigin }));
app.use(express.json());

// DB-free liveness probe so it works even if Mongo is unreachable.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Ensure a (cached) DB connection before any data route runs.
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/aggregations', aggregationRoutes);

app.use(notFound);
app.use(errorHandler);
