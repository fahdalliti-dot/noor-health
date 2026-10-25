// Prisma 7 config file
// Prisma 7 auto-loads .env from the project root, so no dotenv import is needed.
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: './migrations',
  },
});