import { hash, verify } from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 64 * 1024, // 64MB
    timeCost: 3,
    parallelism: 4,
  });
}

export async function comparePasswords(
  password: string,
  hash: string,
): Promise<boolean> {
  return verify(hash, password);
}
