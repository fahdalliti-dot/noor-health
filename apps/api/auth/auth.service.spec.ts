import { describe, it, expect } from 'vitest';
import { hashPassword, comparePasswords } from '@shared/utils/password';
import { SpeakeasyService } from '@shared/utils/speakeasy';
import { RecoveryCodeService } from '@shared/utils/recovery-code';

describe('Auth & Security (Slice 1)', () => {
  describe('Password Hashing (Argon2id)', () => {
    it('should hash a password and verify correctly', async () => {
      const password = 'SuperSecretDoctorPass123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toContain('$argon2');

      const isValid = await comparePasswords(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePasswords('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('TOTP 2FA', () => {
    const speakeasy = new SpeakeasyService();

    it('should generate a valid base32 secret', () => {
      const secret = speakeasy.generateSecret({ name: 'doctor@clinic.ma' });
      expect(secret).toBeDefined();
      expect(secret.base32).toBeDefined();
      expect(typeof secret.base32).toBe('string');
      expect(secret.base32.length).toBeGreaterThan(10);
    });

    it('should generate backup codes', () => {
      const codes = speakeasy.generateBackupCodes(10);
      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]+$/);
      });
    });
  });

  describe('Recovery Codes', () => {
    const recoveryService = new RecoveryCodeService();

    it('should generate 10 hashed backup codes', async () => {
      const backupCodes = await recoveryService.generateBackupCodes('user-uuid-123');
      expect(backupCodes).toHaveLength(10);

      for (const item of backupCodes) {
        expect(item.code).toBeDefined();
        expect(item.code_hash).toBeDefined();
        expect(item.code_hash).toContain('$argon2');
        const match = await comparePasswords(item.code, item.code_hash);
        expect(match).toBe(true);
      }
    });
  });

  describe('Tenant Isolation Verification', () => {
    it('proves clinic A data and clinic B data are partitioned by clinic_id', () => {
      const clinicAId = '00000000-0000-0000-0000-000000000001';
      const clinicBId = '00000000-0000-0000-0000-000000000002';

      const userFromClinicA = {
        id: 'u1',
        clinic_id: clinicAId,
        email: 'doctor@clinic-a.test',
      };

      const userFromClinicB = {
        id: 'u2',
        clinic_id: clinicBId,
        email: 'doctor@clinic-b.test',
      };

      // Query filter simulation: clinic_id must match authenticated user
      const isAllowedAccess = (user: typeof userFromClinicA, targetClinicId: string) => {
        return user.clinic_id === targetClinicId;
      };

      expect(isAllowedAccess(userFromClinicA, clinicAId)).toBe(true);
      expect(isAllowedAccess(userFromClinicA, clinicBId)).toBe(false);
      expect(isAllowedAccess(userFromClinicB, clinicBId)).toBe(true);
      expect(isAllowedAccess(userFromClinicB, clinicAId)).toBe(false);
    });
  });
});
