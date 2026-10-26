// Prisma 7 config file
const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: 'packages/db/prisma/schema.prisma',
  migrations: {
    path: 'packages/db/prisma/migrations'
  },
  datasource: {
    url: process.env.DATABASE_URL || 'file:./dev.db'
  }
});
