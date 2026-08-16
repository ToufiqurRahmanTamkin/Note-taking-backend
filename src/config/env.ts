import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

/**
 * Read an env var. In production a missing value is fatal (we never fall back
 * to an insecure default such as a shared JWT secret); in dev we allow a
 * convenience fallback.
 */
const required = (key: string, devFallback: string): string => {
  const value = process.env[key];
  if (value) return value;
  if (isProd) throw new Error(`Missing required environment variable: ${key}`);
  return devFallback;
};

export const env = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/note_taking_app'),
  jwtSecret: required('JWT_SECRET', 'insecure_dev_secret_change_me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // "*" (default) reflects any origin — safe here because auth is a Bearer
  // token, not cookies, so there is no CSRF surface.
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
};
