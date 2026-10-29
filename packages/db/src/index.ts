// Re-export PrismaClient, types, and enums from generated client
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load root .env (no copies or symlinks). Resolve relative to the compiled file
// location (packages/db/dist/index.js) so it works from either src or dist.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

/**
 * Creates a PrismaClient for the given connection URL.
 * Used by the API (APP_DATABASE_URL / TEST_APP_DATABASE_URL) and tests
 * that need a separate connection string (e.g. TEST_DATABASE_URL).
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

// Re-export PrismaPg adapter so consumers can construct clients directly
export { PrismaPg } from '@prisma/adapter-pg';

// Create driver adapter from environment
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ = adapter; // adapter used to create prisma below

// Export a pre-configured PrismaClient (for API main process)
export const prisma = new PrismaClient({ adapter });

// Re-export types and enums
export { PrismaClient, Prisma } from './generated/client';
export * from './generated/client';
export * from './generated/models';
export * from './generated/enums';
