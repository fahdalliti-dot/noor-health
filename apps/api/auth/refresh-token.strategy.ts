import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: (req: any) => req?.cookies?.refresh_token || req?.headers?.['x-refresh-token'] || null,
      secretOrKey: config?.get<string>('JWT_REFRESH_SECRET') || process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const refreshToken = req?.cookies?.refresh_token || req?.headers?.['x-refresh-token'];
    return {
      ...payload,
      refreshToken,
    };
  }
}
