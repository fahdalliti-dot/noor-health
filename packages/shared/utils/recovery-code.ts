import { hashPassword } from './password';

export class RecoveryCodeService {
  async generateBackupCodes(userId: string): Promise<{ code: string; code_hash: string }[]> {
    const codes: { code: string; code_hash: string }[] = [];

    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const code_hash = await hashPassword(code);

      // Store in DB - would use Prisma here
      codes.push({ code, code_hash });
    }

    return codes;
  }

  async verifyCode(userId: string, code: string): Promise<boolean> {
    // Would look up the code hash for this user and verify
    // For now, check against stored hashes
    return true; // placeholder
  }
}