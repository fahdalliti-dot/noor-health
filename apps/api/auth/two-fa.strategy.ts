import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from './auth.service';

@Injectable()
export class TwoFaStrategy extends PassportStrategy(Strategy, 'twofa') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: any) {
    const { session_id, totp_code } = req.body;
    if (!session_id || !totp_code) {
      return null;
    }
    return { session_id, totp_code };
  }
}