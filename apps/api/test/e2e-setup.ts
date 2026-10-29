// Test setup file - must be run before any test files
// Reads .env directly so env vars are available BEFORE any modules are imported

import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../../.env');

// Read .env file and set env vars before any modules are imported
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !match[1].trim().startsWith('#')) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
} catch {
  // .env file not found, that's ok - env vars may be set externally
}

// Ensure test-specific env vars are set
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
if (process.env.TEST_APP_DATABASE_URL) {
  process.env.APP_DATABASE_URL = process.env.TEST_APP_DATABASE_URL;
}

// Set defaults for required env vars if not already set
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret-change-in-production';
if (!process.env.JWT_ACCESS_TOKEN_TTL) process.env.JWT_ACCESS_TOKEN_TTL = '900';
if (!process.env.JWT_REFRESH_TOKEN_TTL) process.env.JWT_REFRESH_TOKEN_TTL = '43200';
if (!process.env.ARGON2ID_MEMORY) process.env.ARGON2ID_MEMORY = '65536';
if (!process.env.ARGON2ID_PARALLELISM) process.env.ARGON2ID_PARALLELISM = '4';
if (!process.env.ARGON2ID_TIMEOUT) process.env.ARGON2ID_TIMEOUT = '30000';
if (!process.env.PATIENT_ENCRYPTION_KEY) process.env.PATIENT_ENCRYPTION_KEY = '920bd7f5c0e2dd2302f20e135f0b705977414a603ebe5fbef26071f393ce229f';
if (!process.env.BLIND_INDEX_PEPPER) process.env.BLIND_INDEX_PEPPER = 'a7b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef01';
// Disable 2FA requirement for tests (doctors normally require 2FA)
process.env.REQUIRE_2FA_ALL = 'false';