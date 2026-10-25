import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: (req: any) =>
        req?.cookies?.access_token ||
        (req?.headers?.authorization ? req.headers.authorization.replace('Bearer ', '') : null),
      secretOrKey: config?.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      clinic_id: payload.clinic_id,
      role: payload.role,
      is_clinic_admin: payload.is_clinic_admin,
      session_id: payload.session_id,
    };
  }
}
