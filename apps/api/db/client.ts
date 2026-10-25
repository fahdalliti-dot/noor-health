import path from 'path';
import { PrismaLibSql } from '@prisma/adapter-libsql';
// Re-export directly from generated client (bypassing @prisma/client shim)
import { PrismaClient } from '../../../packages/db/src/generated/client';
import { Role, Plan, SubscriptionStatus, Action, Locale, Status } from '../../../packages/db/src/generated/enums';
import type {
  User,
  Clinic,
  Session,
  Invite,
  Subscription,
  RecoveryCode,
  AuditLog,
} from '../../../packages/db/src/generated/client';

export {
  PrismaClient,
  Role,
  Plan,
  SubscriptionStatus,
  Action,
  Locale,
  Status,
};
export type {
  User,
  Clinic,
  Session,
  Invite,
  Subscription,
  RecoveryCode,
  AuditLog,
};

const dbPath = process.env.DATABASE_URL?.replace(/^file:/, '') || path.resolve(__dirname, '../../../dev.db');
const resolvedUrl = dbPath.startsWith('file:') ? dbPath : `file:${path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath)}`;
const adapter = new PrismaLibSql({ url: resolvedUrl });
export const prisma = new PrismaClient({ adapter, log: ['query'] });
