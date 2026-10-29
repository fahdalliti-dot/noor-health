import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, PrismaPg } from '@doctors-morocco/db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.APP_DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    await this.verifyRoleSafety();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async verifyRoleSafety() {
    const role = await this.$queryRawUnsafe<{ rolsuper: boolean; rolbypassrls: boolean }[]>(`
      SELECT rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
    `);
    if (role.length > 0 && (role[0].rolsuper || role[0].rolbypassrls)) {
      throw new Error('API connected as superuser or BYPASSRLS role — aborting');
    }

    const ownerTables = await this.$queryRawUnsafe<{ tablename: string }[]>(`
      SELECT tablename FROM pg_tables
      WHERE tableowner = current_user
        AND schemaname = 'public'
        AND tablename IN ('Clinic','User','Appointment','DoctorWorkingHours','DoctorTimeOff',
                          'Patient','PasswordResetToken','AuditLog','Invite','Session',
                          'RecoveryCode','Subscription')
    `);
    if (ownerTables.length > 0) {
      const names = ownerTables.map((t) => t.tablename).join(', ');
      throw new Error(`API role owns tenant tables: ${names} — RLS not FORCED`);
    }

    // Canary query: must return 0 rows without a valid clinic context
    // Use a non-existent UUID to verify RLS blocks all rows
    // Must run in a transaction so SET and query use the same pooled connection
    await this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.clinic_id', '00000000-0000-0000-0000-000000000000', true)`);
      const canary = await tx.$queryRawUnsafe<{ '?column?': number }[]>(`SELECT 1 FROM "Appointment" LIMIT 1`);
      if (canary.length > 0) {
        throw new Error('Canary query returned rows without valid app.clinic_id — RLS not working');
      }
    });
  }
}
