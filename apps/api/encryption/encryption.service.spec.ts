import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from './encryption.service';

// Helper to create a service instance with test keys
function createTestService(): EncryptionService {
  const service = new EncryptionService();
  // Use test keys (32 bytes = 64 hex chars)
  const testKey = Buffer.from('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', 'hex');
  const testPepper = Buffer.from('1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100', 'hex');

  // Use reflection to set private fields for testing
  Object.defineProperty(service, 'encryptionKey', { value: testKey, writable: true });
  Object.defineProperty(service, 'blindIndexPepper', { value: testPepper, writable: true });
  Object.defineProperty(service, 'algorithm', { value: 'aes-256-gcm', writable: true });
  Object.defineProperty(service, 'keyLength', { value: 32, writable: true });
  Object.defineProperty(service, 'ivLength', { value: 12, writable: true });
  Object.defineProperty(service, 'tagLength', { value: 16, writable: true });
  Object.defineProperty(service, 'encoding', { value: 'hex', writable: true });

  return service;
}

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = createTestService();
  });

  describe('encrypt / decrypt roundtrip', () => {
    it('should encrypt and decrypt a simple string', () => {
      const plaintext = '12345678'; // 8-digit CIN
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt a string with special characters', () => {
      const plaintext = 'Patient medical note: allergy to penicillin, dosage 500mg';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt empty string', () => {
      const plaintext = '';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should return null for null input', () => {
      expect(service.encrypt(null)).toBeNull();
      expect(service.decrypt(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(service.encrypt(undefined)).toBeNull();
      expect(service.decrypt(undefined)).toBeNull();
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = '12345678';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);
      expect(encrypted1).not.toBe(encrypted2); // Different IVs
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });
  });

  describe('hashBlindIndex', () => {
    it('should produce deterministic hash for same input', () => {
      const value = '12345678';
      const hash1 = service.hashBlindIndex(value);
      const hash2 = service.hashBlindIndex(value);
      expect(hash1).toBe(hash2);
    });

    it('should normalize input (trim and uppercase)', () => {
      const hash1 = service.hashBlindIndex('  12345678  ');
      const hash2 = service.hashBlindIndex('12345678');
      expect(hash1).toBe(hash2);

      const hash3 = service.hashBlindIndex('AbCd');
      const hash4 = service.hashBlindIndex('ABCD');
      expect(hash3).toBe(hash4);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = service.hashBlindIndex('12345678');
      const hash2 = service.hashBlindIndex('87654321');
      expect(hash1).not.toBe(hash2);
    });

    it('should return empty string for empty input', () => {
      expect(service.hashBlindIndex('')).toBe('');
      expect(service.hashBlindIndex(' ')).toBe('');
    });
  });

  describe('verifyBlindIndex', () => {
    it('should return true for matching value and hash', () => {
      const value = '12345678';
      const hash = service.hashBlindIndex(value);
      expect(service.verifyBlindIndex(value, hash)).toBe(true);
    });

    it('should return false for non-matching value', () => {
      const hash = service.hashBlindIndex('12345678');
      expect(service.verifyBlindIndex('87654321', hash)).toBe(false);
    });

    it('should return false for null/undefined inputs', () => {
      expect(service.verifyBlindIndex(null as any, 'hash')).toBe(false);
      expect(service.verifyBlindIndex('value', null as any)).toBe(false);
      expect(service.verifyBlindIndex('', '')).toBe(false);
    });
  });

  describe('authentication tag verification (tampering detection)', () => {
    it('should throw when ciphertext is modified', () => {
      const plaintext = '12345678';
      const encrypted = service.encrypt(plaintext)!; // non-null assertion: plaintext is non-null

      // Tamper with ciphertext (flip a bit in the ciphertext portion)
      const parts = encrypted.split(':');
      const tamperedCiphertext = Buffer.from(parts[2], 'hex');
      tamperedCiphertext[0] ^= 0xff; // Flip bits in first byte
      const tampered = `${parts[0]}:${parts[1]}:${tamperedCiphertext.toString('hex')}`;

      expect(() => service.decrypt(tampered)).toThrow(
        /authentication tag verification failed|Decryption failed/,
      );
    });

    it('should throw when auth tag is modified', () => {
      const plaintext = '12345678';
      const encrypted = service.encrypt(plaintext)!;

      // Tamper with auth tag
      const parts = encrypted.split(':');
      const tamperedAuthTag = Buffer.from(parts[1], 'hex');
      tamperedAuthTag[0] ^= 0xff;
      const tampered = `${parts[0]}:${tamperedAuthTag.toString('hex')}:${parts[2]}`;

      expect(() => service.decrypt(tampered)).toThrow(
        /authentication tag verification failed|Decryption failed/,
      );
    });

    it('should throw when IV is modified', () => {
      const plaintext = '12345678';
      const encrypted = service.encrypt(plaintext)!;

      // Tamper with IV
      const parts = encrypted.split(':');
      const tamperedIV = Buffer.from(parts[0], 'hex');
      tamperedIV[0] ^= 0xff;
      const tampered = `${tamperedIV.toString('hex')}:${parts[1]}:${parts[2]}`;

      expect(() => service.decrypt(tampered)).toThrow(
        /authentication tag verification failed|Decryption failed/,
      );
    });

    it('should throw for malformed encrypted string', () => {
      expect(() => service.decrypt('invalid-format')).toThrow(/Invalid encrypted format/);
      expect(() => service.decrypt('a:b')).toThrow(/Invalid encrypted format/);
      expect(() => service.decrypt('a:b:c:d')).toThrow(/Invalid encrypted format/);
    });

    it('should throw for wrong IV length', () => {
      // Valid format but wrong IV length (should be 12 bytes = 24 hex chars)
      expect(() => service.decrypt('00:112233445566778899aabbccddeeff:33445566')).toThrow(/Invalid IV length/);
    });

    it('should throw for wrong auth tag length', () => {
      // Valid format but wrong auth tag length (should be 16 bytes = 32 hex chars)
      expect(() => service.decrypt('00112233445566778899aabb:11:33445566')).toThrow(/Invalid auth tag length/);
    });
  });

  describe('key loading validation', () => {
    it('should throw on missing PATIENT_ENCRYPTION_KEY', () => {
      const service = new EncryptionService();
      // Access private method via reflection
      const loadKey = (service as any).loadKey.bind(service);
      expect(loadKey).toThrow(/PATIENT_ENCRYPTION_KEY environment variable is not set/);
    });

    it('should throw on wrong key length', () => {
      const service = new EncryptionService();
      // Simulate short key by setting process.env temporarily
      const originalKey = process.env.PATIENT_ENCRYPTION_KEY;
      process.env.PATIENT_ENCRYPTION_KEY = '00'; // 1 byte = 2 hex chars
      try {
        expect(() => (service as any).loadKey()).toThrow(/must be 64 hex characters/);
      } finally {
        process.env.PATIENT_ENCRYPTION_KEY = originalKey;
      }
    });

    it('should throw on missing BLIND_INDEX_PEPPER', () => {
      const service = new EncryptionService();
      const loadPepper = (service as any).loadBlindIndexPepper.bind(service);
      expect(loadPepper).toThrow(/BLIND_INDEX_PEPPER environment variable is not set/);
    });

    it('should throw on wrong pepper length', () => {
      const service = new EncryptionService();
      const originalPepper = process.env.BLIND_INDEX_PEPPER;
      process.env.BLIND_INDEX_PEPPER = '00';
      try {
        expect(() => (service as any).loadBlindIndexPepper()).toThrow(/must be 64 hex characters/);
      } finally {
        process.env.BLIND_INDEX_PEPPER = originalPepper;
      }
    });
  });
});