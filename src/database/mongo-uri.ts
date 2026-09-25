import { Logger } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const logger = new Logger('MongoBootstrap');

let memoryServer: MongoMemoryServer | null = null;

/**
 * Prefer Atlas / configured URI. In non-production, fall back to an
 * in-memory Mongo when Atlas is unreachable (DNS, IP allowlist, offline).
 */
export async function resolveMongoUri(
  preferredUri: string,
  nodeEnv: string,
): Promise<string> {
  const allowMemory =
    process.env.MONGODB_ALLOW_MEMORY_FALLBACK !== 'false' &&
    nodeEnv !== 'production';

  try {
    await mongoose.connect(preferredUri, {
      serverSelectionTimeoutMS: 8_000,
    });
    await mongoose.disconnect();
    logger.log('Connected configuration points at a reachable MongoDB.');
    return preferredUri;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!allowMemory) {
      throw err;
    }
    logger.warn(
      `Primary MongoDB unreachable (${message}). Starting in-memory Mongo for local development.`,
    );
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri('aegis3d');
    logger.warn(`In-memory Mongo ready at ${uri}`);
    return uri;
  }
}

export async function stopMemoryMongo() {
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
