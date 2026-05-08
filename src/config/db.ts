import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(): Promise<void> {
  console.log('[DB] Connecting to MongoDB...');
  console.log('[DB] URI (masked):', env.MONGODB_URI.replace(/:([^@]+)@/, ':****@'));

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log('[DB] MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('[DB] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected');
    });
  } catch (error) {
    console.error('[DB] MongoDB connection FAILED:', error);
    console.error('[DB] Check: 1) Atlas IP whitelist (0.0.0.0/0)  2) MONGODB_URI env var  3) Username/password');
    process.exit(1); // crash loudly so Render shows the real error
  }
}
