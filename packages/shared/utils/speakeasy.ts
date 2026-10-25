import { default as speakeasy } from 'speakeasy';

export class SpeakeasyService {
  generateSecret(options: { name: string; length?: number; secret?: string }) {
    return speakeasy.generateSecret({
      name: options.name,
      length: options.length,
      secret: options.secret,
    });
  }

  verifyTotp(secret: string, token: string, options: { window?: number } = {}): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: options.window ?? 1,
    });
  }

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}