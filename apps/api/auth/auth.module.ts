import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { TwoFaStrategy } from './two-fa.strategy';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import { SpeakeasyService } from '@shared/utils/speakeasy';
import { RecoveryCodeService } from '@shared/utils/recovery-code';
import { AuthRepository } from '../db/repository';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'local' }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'dev-secret',
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_TOKEN_TTL') || '900s' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    TwoFaStrategy,
    RefreshTokenStrategy,
    SpeakeasyService,
    RecoveryCodeService,
    AuthRepository,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
