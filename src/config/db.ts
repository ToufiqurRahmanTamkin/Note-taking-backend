import mongoose from 'mongoose';
import { env } from './env';

/**
 * Cache the connection promise across invocations. On a serverless platform
 * (e.g. Vercel) the container is reused between requests, so without this we
 * would open a new connection every call and exhaust the pool.
 */
let connection: Promise<typeof mongoose> | null = null;

export const connectDB = (): Promise<typeof mongoose> => {
  if (!connection) {
    mongoose.set('strictQuery', true);
    connection = mongoose
      .connect(env.mongoUri, { autoIndex: true, serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        connection = null; // allow a retry on the next request instead of caching the failure
        throw err;
      });
  }
  return connection;
};
