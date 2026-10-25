// Re-export PrismaClient, types, and enums from generated client
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load root .env (no copies or symlinks). Resolve relative to the compiled file
// location (packages/db/dist/index.js) so it works from either src or dist.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from './generated/client';

// Create driver adapter from environment
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Export a pre-configured PrismaClient
export const prisma = new PrismaClient({ adapter });

// Re-export types and enums
export { PrismaClient, Prisma } from './generated/client';
export * from './generated/client';

// Re-export types
export type {
  User,
  Clinic,
  Session,
  Invite,
  Subscription,
  RecoveryCode,
  AuditLog,
} from './generated/client';

// Re-export enums
export {
  Role,
  Plan,
  SubscriptionStatus,
  Action,
  Locale,
  Status,
} from './generated/enums';