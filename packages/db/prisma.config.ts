// Prisma 7 config file
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://saas_owner:saas_pass@localhost:5432/saas_dev?schema=public'
  }
});
