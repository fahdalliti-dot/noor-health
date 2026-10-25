import { Injectable, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Encryption service for sensitive patient data (CIN, medical notes).
 * Uses AES-256-GCM with a 32-byte key from environment variable.
 *
 * Output format: iv:authTag:ciphertext (all hex-encoded)
 * Blind index: HMAC-SHA256 with pepper for CIN lookups without decryption.
 */
@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12; // 96 bits for GCM
  private readonly tagLength = 16; // 128 bits
  private readonly encoding: BufferEncoding = 'hex';

  private encryptionKey!: Buffer;
  private blindIndexPepper!: Buffer;

  onModuleInit(): void {
    this.loadKey();
    this.loadBlindIndexPepper();
  }

  private loadKey(): void {
    const keyHex = process.env.PATIENT_ENCRYPTION_KEY;

    if (!keyHex) {
      throw new Error(
        'PATIENT_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate a 32-byte (64 hex chars) key with: openssl rand -hex 32',
      );
    }

    if (keyHex.length !== 64) {
      throw new Error(
        `PATIENT_ENCRYPTION_KEY must be 64 hex characters (32 bytes), got ${keyHex.length} characters.`,
      );
    }

    this.encryptionKey = Buffer.from(keyHex, 'hex');
  }

  private loadBlindIndexPepper(): void {
    const pepperHex = process.env.BLIND_INDEX_PEPPER;

    if (!pepperHex) {
      throw new Error(
        'BLIND_INDEX_PEPPER environment variable is not set. ' +
        'Generate a 32-byte (64 hex chars) pepper with: openssl rand -hex 32',
      );
    }

    if (pepperHex.length !== 64) {
      throw new Error(
        `BLIND_INDEX_PEPPER must be 64 hex characters (32 bytes), got ${pepperHex.length} characters.`,
      );
    }

    this.blindIndexPepper = Buffer.from(pepperHex, 'hex');
  }

  /**
   * Encrypt a plaintext string using AES-256-GCM.
   * Returns a string in format: iv:authTag:ciphertext (all hex).
   *
   * @param plaintext - The string to encrypt (e.g., CIN, medical note)
   * @returns Encrypted string or null/undefined if input is null/undefined
   */
  encrypt(plaintext: string | null | undefined): string | null {
    if (plaintext === null || plaintext === undefined) {
      return null;
    }

    if (plaintext === '') {
      return '';
    }

    // Generate random IV
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv, {
      authTagLength: this.tagLength,
    });

    // Encrypt
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all hex)
    return `${iv.toString(this.encoding)}:${authTag.toString(this.encoding)}:${ciphertext.toString(this.encoding)}`;
  }

  /**
   * Decrypt a string encrypted by `encrypt()`.
   * Verifies the authentication tag; throws if tampered/corrupted.
   *
   * @param encrypted - String in format iv:authTag:ciphertext (hex)
   * @returns Decrypted plaintext or null/undefined if input is null/undefined
   * @throws Error if authentication tag verification fails
   */
  decrypt(encrypted: string | null | undefined): string | null {
    if (encrypted === null || encrypted === undefined) {
      return null;
    }

    if (encrypted === '') {
      return '';
    }

    // Parse: iv:authTag:ciphertext
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format: expected iv:authTag:ciphertext');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;

    // Validate hex lengths
    if (ivHex.length !== this.ivLength * 2) {
      throw new Error(`Invalid IV length: expected ${this.ivLength * 2} hex chars, got ${ivHex.length}`);
    }
    if (authTagHex.length !== this.tagLength * 2) {
      throw new Error(`Invalid auth tag length: expected ${this.tagLength * 2} hex chars, got ${authTagHex.length}`);
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv, {
      authTagLength: this.tagLength,
    });

    decipher.setAuthTag(authTag);

    // Decrypt - this will throw if auth tag doesn't match
    let plaintext: Buffer;
    try {
      plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
    } catch (e: unknown) {
      const error = new Error('Decryption failed: authentication tag verification failed (data tampered or corrupted)');
      if (e instanceof Error) {
        error.cause = e;
      }
      throw error;
    }

    return plaintext.toString('utf8');
  }

  /**
   * Compute a blind index (HMAC-SHA256) for a value.
   * Used for CIN lookups without decrypting every row.
   *
   * Normalizes input: trim whitespace, uppercase.
   * Returns empty string for empty/whitespace-only input.
   * Uses a separate pepper (BLIND_INDEX_PEPPER) from the encryption key.
   *
   * @param value - The plaintext value (e.g., CIN)
   * @returns Hex-encoded HMAC-SHA256 hash, or empty string if input is empty after normalization
   */
  hashBlindIndex(value: string): string {
    if (!value) {
      return '';
    }

    // Normalize: trim, uppercase (CIN format is digits, but be safe)
    const normalized = value.trim().toUpperCase();

    // Return empty string for empty after normalization
    if (!normalized) {
      return '';
    }

    const hmac = crypto.createHmac('sha256', this.blindIndexPepper);
    hmac.update(normalized);
    return hmac.digest('hex');
  }

  /**
   * Verify a blind index matches a value.
   * @param value - Plaintext value to check
   * @param blindIndex - Precomputed blind index to compare against
   * @returns true if they match (constant-time comparison)
   */
  verifyBlindIndex(value: string, blindIndex: string): boolean {
    if (!value || !blindIndex) {
      return false;
    }

    const computed = this.hashBlindIndex(value);
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(blindIndex, 'hex'));
  }
}