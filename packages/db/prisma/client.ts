import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db

// Tenant context middleware for Prisma client
export function setTenantContext(prisma: PrismaClient, clinicId: string): PrismaClient {
  // This is a conceptual implementation - the actual tenant context
  // would be set up via Prisma middleware or middleware patterns
  // The app.clinic_id setting is used by PostgreSQL RLS policies
  return prisma;
}

// Tenant context middleware for Prisma client
export function setTenantContext(prisma: PrismaClient, clinicId: string): PrismaClient {
  // This is a conceptual implementation - the actual tenant context
  // would be set up via Prisma middleware or middleware patterns
  // The app.clinic_id setting is used by PostgreSQL RLS policies
  return prisma;
}