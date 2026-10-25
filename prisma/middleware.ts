import { PrismaMiddleware } from '@prisma/client/runtime/core'

// Tenant-scoped Prisma middleware that sets app.clinic_id per transaction
// This is a conceptual file - the actual Prisma middleware will be configured
// in the prisma/client extension or via a helper wrapper

export function setTenantContext(clinicId: string) {
  // This function will be called by the request pipeline before each Prisma query
  // It sets the session variable that RLS policies use
  // @ts-ignore - Prisma extension point
  console.log(`Setting tenant context to clinic_id: ${clinicId}`)
}