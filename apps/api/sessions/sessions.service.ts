import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../db/repository';
import { hashPassword } from '@shared/utils/password';

@Injectable()
export class SessionsService {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async findAll(userId: string, clinicId: string): Promise<any[]> {
    const user = await this.authRepository.findById(userId);
    if (!user || user.clinic_id !== clinicId) {
      throw new UnauthorizedException('User not found or not in this clinic');
    }

    const sessions = await this.authRepository.findSessionsByUser(userId, clinicId);

    return sessions.map(session => ({
      id: session.id,
      device_label: session.device_label,
      ip: session.ip,
      last_used_at: session.last_used_at,
      created_at: session.created_at,
      expires_at: session.expires_at,
      revoked_at: session.revoked_at,
      revoked_reason: session.revoked_reason,
    }));
  }

  async revoke(sessionId: string, userId: string, reason?: string): Promise<{ success: true }> {
    const session = await this.authRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.user_id !== userId) {
      throw new ForbiddenException('Not authorized to revoke this session');
    }

    await this.authRepository.revokeSession(sessionId, reason || 'user_logout');

    return { success: true };
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const result = await this.authRepository.findSessionAndUser(refreshToken);
    if (!result || !result.session || result.session.revoked_at) {
      throw new UnauthorizedException('Invalid or revoked session');
    }

    const { user, session: oldSession } = result;
    const oldFamilyId = oldSession.family_id;

    // Revoke old session
    await this.authRepository.revokeSession(oldSession.id, 'rotated');

    // Create new session
    const newRefreshToken = this.generateRefreshToken();
    const hashedNewRefreshToken = await hashPassword(newRefreshToken);

    const newSession = await this.authRepository.createSession({
      user_id: user.id,
      clinic_id: user.clinic_id,
      family_id: oldFamilyId, // Keep same family for parallel tabs
      refresh_token_hash: hashedNewRefreshToken,
      device_label: oldSession.device_label ?? undefined,
      ip: oldSession.ip ?? undefined,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const payload = {
      sub: user.id,
      clinic_id: user.clinic_id,
      role: user.role,
      is_clinic_admin: user.is_clinic_admin,
      session_id: newSession.id,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      refresh_token: newRefreshToken,
      session_id: newSession.id,
      device_label: newSession.device_label,
    };
  }

  // Helper methods
  private generateRefreshToken(): string {
    return require('crypto').randomBytes(40).toString('hex');
  }
}
