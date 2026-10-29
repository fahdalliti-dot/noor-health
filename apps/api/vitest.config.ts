import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Run test files sequentially to avoid database state conflicts
    // since tests create/cleanup shared database records
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Setup file runs BEFORE any test files, ensuring env vars are set before module imports
    setupFiles: ['./test/e2e-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@shared': path.resolve(__dirname, '../../packages/shared'),
    },
  },
});
