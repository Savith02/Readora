import mongoose from 'mongoose';
import '../models';
import { logger } from '../utils/logger';
import { env } from './env';

export async function connectDB(): Promise<typeof mongoose> {
  mongoose.connection.on('error', (err: Error) => logger.error(`MongoDB error: ${err.message}`));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const { host, port, name } = mongoose.connection;
  logger.info(`MongoDB connected: ${host}:${port}/${name}`);

  // Create every collection and its indexes now, so a bad index shows up at startup.
  const models = Object.values(mongoose.models);
  await Promise.all(models.map((model) => model.init()));
  logger.info(`Collections and indexes ready (${models.length} models)`);

  return mongoose;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
