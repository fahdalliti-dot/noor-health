import { PrismaClient } from '../src/generated/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
const adapter = new PrismaLibSql({ url: 'file:../../../dev.db' });
const db = new PrismaClient({ adapter });
async function main() {
  try {
    const c = await db.clinic.count();
    console.log('Clinics:', c);
  } catch (e) {
    console.error(e.message);
  }
  await db.$disconnect();
}
main().catch(e => console.error(e));
