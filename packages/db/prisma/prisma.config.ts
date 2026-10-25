// Prisma 7 config file
const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: 'schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: 'file:./dev.db'
  }
});