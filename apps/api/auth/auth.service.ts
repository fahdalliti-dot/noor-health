import { v4 as uuidv4 } from 'uuid';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, Role } from '@doctors-morocco/db';
import { comparePasswords, hashPassword } from '@shared/utils/password';
import { AuthRepository } from '../db/repository';
import { SpeakeasyService } from '@shared/utils/speakeasy';
import { RecoveryCodeService } from '@shared/utils/recovery-code';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private authRepository: AuthRepository,
    private speakeasyService: SpeakeasyService,
    private recoveryCodeService: RecoveryCodeService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.authRepository.findById(id);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.authRepository.findByEmail(email);
    if (!user || !user.is_active) {
      return null;
    }

    const passwordValid = await comparePasswords(password, user.password_hash);
    if (!passwordValid) {
      return null;
    }

    return user;
  }

  async login(user: User, ip: string, userAgent: string) {
    // Check if 2FA is required for this user
    const twoFaRequired = await this.twoFaRequired(user);

    if (twoFaRequired) {
      // Create a session challenge token (short-lived, no access token yet)
      const session = await this.authRepository.createSession({
        user_id: user.id,
        clinic_id: user.clinic_id,
        ip,
        expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        family_id: uuidv4(),
      });

      return {
        status: 'two_factor_required',
        session_id: session.id,
        challenge_token: this.generateChallengeToken(session.id),
      };
    }

    // No 2FA required, proceed with normal login
    return this.createSessionAndTokens(user, ip, userAgent);
  }

  private async twoFaRequired(user: User): Promise<boolean> {
    // Doctors and admins always require 2FA
    if (user.role === Role.doctor || user.role === Role.admin) {
      return true;
    }

    // Secretaries: optional unless clinic enables require_2fa_all
    // For now, default to false (optional for secretaries)
    return false;
  }

  private async createSessionAndTokens(
    user: User,
    ip: string,
    userAgent: string,
  ) {
    // Create session with hashed refresh token
    const refreshToken = this.generateRefreshToken();
    const hashedRefreshToken = await hashPassword(refreshToken);

    const session = await this.authRepository.createSession({
      user_id: user.id,
      clinic_id: user.clinic_id,
      family_id: uuidv4(),
      refresh_token_hash: hashedRefreshToken,
      device_label: this.extractDeviceLabel(userAgent),
      ip,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Create access token
    const payload = {
      sub: user.id,
      clinic_id: user.clinic_id,
      role: user.role,
      is_clinic_admin: user.is_clinic_admin,
      session_id: session.id,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      session_id: session.id,
    };
  }

  private generateChallengeToken(sessionId: string): string {
    // Generate a short-lived challenge token
    return Buffer.from(sessionId).toString('base64');
  }

  private generateRefreshToken(): string {
    // Generate a cryptographically secure random token
    return require('crypto').randomBytes(40).toString('hex');
  }

  private generateResetToken(): string {
    // Generate a cryptographically secure random token
    return require('crypto').randomBytes(20).toString('hex');
  }

  private extractDeviceLabel(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';
    // Parse UA to get browser/device info - simplified
    return userAgent.substring(0, 50);
  }

  async loginWith2fa(
    sessionId: string,
    totpCode: string,
    ip: string,
    userAgent: string,
  ): Promise<{ access_token: string; refresh_token: string; session_id: string }> {
    // Verify the session exists and is waiting for 2FA
    const session = await this.authRepository.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session challenge');
    }

    // Verify TOTP code
    const user = await this.authRepository.findById(session.user_id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = this.speakeasyService.verifyTotp(
      user.totp_secret!,
      totpCode,
    );

    if (!isValid) {
      // Audit failed 2FA attempt
      await this.authRepository.auditLog({
        action: 'login_failed',
        clinic_id: user.clinic_id,
        user_id: user.id,
        ip,
        metadata: { reason: '2fa_invalid' },
        request_id: 'system',
      });

      throw new UnauthorizedException('Invalid TOTP code');
    }

    // 2FA successful, create session and tokens
    return this.createSessionAndTokens(user, ip, userAgent);
  }

  async refreshToken(refreshToken: string) {
    const result = await this.authRepository.findSessionAndUser(refreshToken);
    if (!result) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { user, session } = result;

    // Revoke old session
    await this.authRepository.revokeSession(session.id, 'rotated');

    // Create new session
    const newRefreshToken = this.generateRefreshToken();
    const hashedNewRefreshToken = await hashPassword(newRefreshToken);

    const newSession = await this.authRepository.createSession({
      user_id: user.id,
      clinic_id: user.clinic_id,
      family_id: session.family_id,
      refresh_token_hash: hashedNewRefreshToken,
      device_label: session.device_label || undefined,
      ip: session.ip || undefined,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Create new access token
    const payload = {
      sub: user.id,
      clinic_id: user.clinic_id,
      role: user.role,
      is_clinic_admin: user.is_clinic_admin,
      session_id: newSession.id,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      session_id: newSession.id,
    };
  }

  async logout(sessionId: string, userId: string) {
    await this.authRepository.revokeSession(sessionId, 'logout');

    // Could also clear cookies on the client side
  }

  async setup2fa(user: User) {
    const result = this.speakeasyService.generateSecret({
      name: `${user.email}`,
      secret: undefined, // Let the library generate
      length: 160,
    });

    // Store the plain TOTP secret for demo
    user.totp_secret = result.base32;
    user.totp_enabled_at = new Date();

    await this.authRepository.save(user);

    return {
      qrCodeUri: result.otpauth_url,
      backupCodes: await this.recoveryCodeService.generateBackupCodes(user.id),
    };
  }

  async verify2faSetup(user: User, totpCode: string): Promise<boolean> {
    return this.speakeasyService.verifyTotp(user.totp_secret!, totpCode);
  }

  async resetPassword(email: string) {
    const user = await this.authRepository.findByEmail(email);
    if (!user || !user.is_active) {
      // Don't enumerate - return generic message
      return { success: false };
    }

    // Create password reset token
    const resetToken = this.generateResetToken();
    const hashedToken = await hashPassword(resetToken);

    await this.authRepository.createPasswordResetToken({
      user_id: user.id,
      token_hash: hashedToken,
      expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    // In production, send email via Mailpit or transactional provider
    // For now, log the token (dev only)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { success: true };
  }

  async completePasswordReset(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const tokenRecord = await this.authRepository.findPasswordResetToken(
      await hashPassword(token),
    );

    if (!tokenRecord || !tokenRecord.expires_at || tokenRecord.expires_at < new Date()) {
      return { success: false };
    }

    if (tokenRecord.used_at) {
      return { success: false };
    }

    const user = await this.authRepository.findById(tokenRecord.user_id || '');
    if (!user) {
      return { success: false };
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password_hash = hashedPassword;

    // Revoke all sessions on password change
    await this.authRepository.revokeAllSessions(user.id);

    user.password_hash = hashedPassword;
    await this.authRepository.save(user);

    // Audit password reset completion
    await this.authRepository.auditLog({
      action: 'password_reset_completed',
      clinic_id: user.clinic_id,
      user_id: user.id,
      metadata: { fields: ['password_hash'] }, // Only metadata of field names, never values
      request_id: 'system',
    });

    return { success: true };
  }

  async acceptInvite(token: string, password: string, role: string): Promise<{ user: User; access_token: string; refresh_token: string; session_id: string }> {
    const invite = await this.authRepository.findInviteByToken(token);

    if (!invite || invite.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired invite');
    }

    if (invite.accepted_at) {
      throw new UnauthorizedException('Invite already accepted');
    }

    // Check email doesn't already belong to any clinic
    const existingUser = await this.authRepository.findByEmail(invite.email);
    if (existingUser) {
      throw new UnauthorizedException(
        'Email already belongs to another clinic',
      );
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await this.authRepository.createUser({
      email: invite.email,
      password_hash: hashedPassword,
      full_name: '', // Will be set on first login
      role,
      clinic_id: invite.clinic_id,
      is_clinic_admin: role === 'admin',
      is_active: true,
    });

    // Mark invite as accepted
    invite.accepted_at = new Date();
    await this.authRepository.saveInvite(invite);

    // Audit user created via invite
    await this.authRepository.auditLog({
      action: 'invite_accepted',
      clinic_id: invite.clinic_id,
      user_id: user.id,
      metadata: { fields: ['role', 'clinic_id'] },
      request_id: 'system',
    });

    // Create initial session
    const refreshToken = this.generateRefreshToken();
    const hashedRefreshToken = await hashPassword(refreshToken);

    const session = await this.authRepository.createSession({
      user_id: user.id,
      clinic_id: invite.clinic_id,
      family_id: uuidv4(),
      refresh_token_hash: hashedRefreshToken,
      device_label: 'Web Initial',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const payload = {
      sub: user.id,
      clinic_id: invite.clinic_id,
      role,
      is_clinic_admin: user.is_clinic_admin,
      session_id: session.id,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
      session_id: session.id,
    };
  }

  async deactivateUser(userId: string, byUserId: string) {
    const user = await this.authRepository.findById(userId);
    const actor = await this.authRepository.findById(byUserId);

    if (!user || !actor) {
      throw new UnauthorizedException('User not found');
    }

    // Prevent deactivating the last active admin
    if (user.role === Role.admin && user.is_active && actor.role === Role.admin) {
      const activeAdmins = await this.authRepository.countActiveAdmins(
        user.clinic_id,
      );
      if (activeAdmins <= 1) {
        throw new UnauthorizedException(
          'Cannot deactivate the last active admin',
        );
      }
    }

    // Revoke all sessions for this user
    await this.authRepository.revokeAllSessions(userId);

    // Soft delete / deactivate
    user.is_active = false;
    user.deactivated_at = new Date();
    await this.authRepository.save(user);

    // Audit user deactivation
    await this.authRepository.auditLog({
      action: 'user_deactivated',
      clinic_id: user.clinic_id,
      user_id: actor.id,
      metadata: { fields: ['is_active', 'deactivated_at'] },
      request_id: 'system',
    });

    return { success: true };
  }
}