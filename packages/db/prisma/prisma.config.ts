// Prisma 7 config file
// datasource.url is read from process.env.DATABASE_URL.
// Prisma 7 auto-loads .env from the project root, so no dotenv import is needed.
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
  },
});