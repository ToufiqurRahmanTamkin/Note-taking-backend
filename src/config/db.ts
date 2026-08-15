import mongoose from 'mongoose';
import { env } from './env';

/**
 * Establish the MongoDB connection. `autoIndex` is enabled so the indexes
 * declared with `schema.index(...)` are built and therefore visible/usable.
 */
export const connectDB = async (): Promise<void> => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { autoIndex: true });
  console.log('MongoDB connected');
};
