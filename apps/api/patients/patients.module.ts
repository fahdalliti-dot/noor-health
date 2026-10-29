import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { AuditModule } from '../audit/audit.module';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [
    AuditModule,
    EncryptionModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'dev-secret',
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_TOKEN_TTL') || '900s' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}