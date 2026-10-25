import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      request.user = null;
      return false;
    }

    const token = authorization.substring(7);

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      // Attach user to request from payload
      request.user = {
        id: payload.sub,
        clinic_id: payload.clinic_id,
        role: payload.role,
        is_clinic_admin: payload.is_clinic_admin,
      };

      return true;
    } catch (error) {
      request.user = null;
      return false;
    }
  }
}