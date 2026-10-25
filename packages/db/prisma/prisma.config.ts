// Prisma 7 config file
// Reads datasource.url from process.env.DATABASE_URL (loaded from root .env)
import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load root .env (no copies or symlinks)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
  },
  // datasource.url is read from process.env.DATABASE_URL automatically
  // Prisma 7 picks up DATABASE_URL from the environment
});
