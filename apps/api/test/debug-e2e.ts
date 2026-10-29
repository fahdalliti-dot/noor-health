import { createPrismaClient } from '@doctors-morocco/db';
import { hashPassword } from '@shared/utils/password';

async function main() {
  const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
  const TEST_APP_DATABASE_URL = process.env.TEST_APP_DATABASE_URL;
  console.log('TEST_DATABASE_URL:', TEST_DATABASE_URL);
  console.log('TEST_APP_DATABASE_URL:', TEST_APP_DATABASE_URL);

  const prismaOwner = createPrismaClient(TEST_DATABASE_URL!);
  const prismaApp = createPrismaClient(TEST_APP_DATABASE_URL!);

  await prismaOwner.$connect();
  await prismaApp.$connect();

  console.log('Owner connected. Clinic count:', await prismaOwner.clinic.count());
  console.log('App connected. Clinic count:', await prismaApp.clinic.count());

  // Create a test user
  const passwordHash = await hashPassword('TestPass123!');
  console.log('Password hash:', passwordHash.substring(0, 50));

  const user = await prismaOwner.user.create({
    data: {
      email: `debug-test-${Date.now()}@test.com`,
      password_hash: passwordHash,
      full_name: 'Debug User',
      role: 'secretary',
      clinic_id: (await prismaOwner.clinic.findFirst())!.id,
      is_clinic_admin: false,
      is_active: true,
    },
  });
  console.log('Created user:', user.id, user.email);

  // Verify with owner
  const foundOwner = await prismaOwner.user.findUnique({ where: { email: user.email } });
  console.log('Found via owner:', foundOwner?.email, 'hash matches:', foundOwner?.password_hash === passwordHash);

  // Verify with app
  const foundApp = await prismaApp.user.findUnique({ where: { email: user.email } });
  console.log('Found via app:', foundApp?.email);

  // Try password verification
  const { comparePasswords } = await import('@shared/utils/password');
  const valid = await comparePasswords('TestPass123!', user.password_hash);
  console.log('Password verify (same hash):', valid);

  // Cleanup
  await prismaOwner.user.delete({ where: { id: user.id } });
  await prismaOwner.$disconnect();
  await prismaApp.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });