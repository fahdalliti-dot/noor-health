import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(JwtService) private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    console.log('[DEBUG JwtAuthGuard] Authorization header:', authorization ? 'present' : 'missing');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('[DEBUG JwtAuthGuard] No Bearer token');
      request.user = null;
      return false;
    }

    const token = authorization.substring(7);

    try {
      const payload = this.jwtService.verify(token);

      console.log('[DEBUG JwtAuthGuard] Payload:', JSON.stringify(payload));

      // Attach user to request from payload
      request.user = {
        id: payload.sub,
        clinic_id: payload.clinic_id,
        role: payload.role,
        is_clinic_admin: payload.is_clinic_admin,
      };

      console.log('[DEBUG JwtAuthGuard] User attached:', JSON.stringify(request.user));
      return true;
    } catch (error: any) {
      console.log('[DEBUG JwtAuthGuard] Token verification failed:', error?.message);
      request.user = null;
      return false;
    }
  }
}