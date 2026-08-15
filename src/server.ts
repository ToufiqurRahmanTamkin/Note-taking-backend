import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const start = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
