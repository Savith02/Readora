import dns from 'node:dns';
import mongoose from 'mongoose';
import '../models';
import { logger } from '../utils/logger';
import { env } from './env';

const CONNECT_OPTIONS = { serverSelectionTimeoutMS: 5000 };
const PUBLIC_DNS_SERVERS = ['1.1.1.1', '8.8.8.8'];

/**
 * A MongoDB Atlas address (`mongodb+srv://`) is looked up through DNS first. On some PCs Node
 * is pointed at a DNS server that does not answer (for example 127.0.0.1) even though Windows
 * itself resolves the name fine, which shows up as "querySrv ECONNREFUSED". ENOTFOUND is not
 * included: that means the cluster name really does not exist, and other DNS servers would
 * say the same.
 */
const isResolverFailure = (error: unknown): boolean =>
  error instanceof Error && /query(Srv|Txt)/.test(error.message) && /ECONNREFUSED|ETIMEOUT|ESERVFAIL|ECONNRESET/.test(error.message);

async function connectWithDnsFallback(): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI, CONNECT_OPTIONS);
  } catch (error) {
    if (!env.MONGO_URI.startsWith('mongodb+srv://') || !isResolverFailure(error)) throw error;

    logger.warn(`This PC's DNS server did not answer for the MongoDB address; retrying with ${PUBLIC_DNS_SERVERS.join(' and ')}`);
    dns.setServers(PUBLIC_DNS_SERVERS);
    await mongoose.connect(env.MONGO_URI, CONNECT_OPTIONS);
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  mongoose.connection.on('error', (err: Error) => logger.error(`MongoDB error: ${err.message}`));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

  await connectWithDnsFallback();
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
