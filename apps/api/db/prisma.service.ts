import path from 'path';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../../../packages/db/src/generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const dbPath = process.env.DATABASE_URL?.replace(/^file:/, '') || path.resolve(__dirname, '../../../dev.db');
    const resolvedUrl = dbPath.startsWith('file:') ? dbPath : `file:${path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath)}`;
    const adapter = new PrismaLibSql({ url: resolvedUrl });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
