import mongoose from 'mongoose';
import { BookCache } from '../models';
import { logger } from '../utils/logger';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const TTL = {
  search: DAY,
  details: 7 * DAY,
  content: 30 * DAY,
  /** Google Books data is only kept briefly, and only in memory. */
  memory: 10 * 60 * 1000,
} as const;

// MongoDB documents are limited to 16 MB, so a book bigger than this is served but not stored.
const MAX_STORED_BYTES = 12 * 1024 * 1024;
const MAX_MEMORY_ENTRIES = 200;

/**
 * Requests for the same key that overlap share one upstream call. The call also keeps running
 * (and fills the cache) when the caller that started it has stopped waiting.
 */
const inflight = new Map<string, Promise<unknown>>();
const memory = new Map<string, { value: unknown; expiresAt: number }>();

const dbReady = () => mongoose.connection.readyState === 1;

async function readStored<T>(key: string): Promise<T | undefined> {
  if (!dbReady()) return undefined;
  try {
    // expiresAt is compared here because MongoDB's TTL sweep only runs about once a minute.
    const hit = await BookCache.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
    return hit ? (hit.data as T) : undefined;
  } catch (error) {
    logger.warn(`Cache read failed for ${key}: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

async function writeStored(key: string, data: unknown, ttlMs: number): Promise<void> {
  if (!dbReady()) return;
  try {
    const bytes = Buffer.byteLength(JSON.stringify(data));
    if (bytes > MAX_STORED_BYTES) {
      logger.warn(`Not caching ${key}: ${(bytes / 1024 / 1024).toFixed(1)} MB is over the ${MAX_STORED_BYTES / 1024 / 1024} MB limit`);
      return;
    }
    await BookCache.updateOne({ key }, { $set: { data, expiresAt: new Date(Date.now() + ttlMs) } }, { upsert: true });
  } catch (error) {
    logger.warn(`Cache write failed for ${key}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function share<T>(key: string, work: () => Promise<T>): Promise<T> {
  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) return running;
  const promise = work().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/** MongoDB-backed cache. Failures are never cached, so a source that is down is retried next time. */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  return share(key, async () => {
    const hit = await readStored<T>(key);
    if (hit !== undefined) return hit;
    const fresh = await load();
    await writeStored(key, fresh, ttlMs);
    return fresh;
  });
}

/** In-memory cache for data that must not be stored long-term (Google Books). */
export function memoryCached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = memory.get(key);
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.value as T);

  return share(key, async () => {
    const fresh = await load();
    if (memory.size >= MAX_MEMORY_ENTRIES) memory.delete(memory.keys().next().value as string);
    memory.set(key, { value: fresh, expiresAt: Date.now() + ttlMs });
    return fresh;
  });
}
