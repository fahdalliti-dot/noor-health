import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthRepository } from '../db/repository';
import { JwtService } from '@nestjs/jwt';
import { hashPassword } from '@shared/utils/password';

@Injectable()
export class InvitationsService {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async create(clinicId: string, email: string, role: string, invitedById: string): Promise<any> {
    const inviter = await this.authRepository.findById(invitedById);
    if (!inviter || !inviter.is_active) {
      throw new NotFoundException('Inviter not found or not active');
    }

    // Check if email already belongs to any clinic
    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new ForbiddenException('Email already belongs to another clinic');
    }

    // Check if there's already a pending invite for this email in this clinic
    const existingInvite = await this.authRepository.findPendingInvite(clinicId, email);
    if (existingInvite) {
      // Resend existing invite (revoke old token)
      existingInvite.revoked_at = new Date();
      await this.authRepository.saveInvite(existingInvite);
    }

    // Create new invite
    const token = this.generateToken();
    const token_hash = await hashPassword(token);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await this.authRepository.createInvite({
      clinic_id: clinicId,
      email,
      role,
      token_hash,
      expires_at,
      invited_by: inviter.id,
    });

    // TODO: Send email via provider (Mailpit in dev)
    // For now, log the token (dev only)
    console.log(`Invite token for ${email} to clinic ${clinicId}: ${token}`);

    return {
      invite_id: invite.id,
      token, // Only returned here, will be used in email link
      email,
      role,
      expires_at,
    };
  }

  async findAll(clinicId: string, invitedById: string): Promise<any[]> {
    const inviter = await this.authRepository.findById(invitedById);
    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    const invites = await this.authRepository.findInvitesByClinic(clinicId);
    return invites.map(invite => ({ // Only safe fields
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expires_at: invite.expires_at,
      accepted_at: invite.accepted_at,
      revoked_at: invite.revoked_at,
    }));
  }

  async findById(id: string, clinicId: string, requestedById: string): Promise<any> {
    const invite = await this.authRepository.findInviteById(id);
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.clinic_id !== clinicId) {
      throw new ForbiddenException('Invite does not belong to this clinic');
    }

    const requester = await this.authRepository.findById(requestedById);
    if (!requester || (requester.role !== 'admin' && requester.clinic_id !== clinicId)) {
      throw new ForbiddenException('Not authorized to view this invite');
    }

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expires_at: invite.expires_at,
      accepted_at: invite.accepted_at,
      revoked_at: invite.revoked_at,
    };
  }

  async delete(id: string, clinicId: string, requestedById: string): Promise<{ success: true }> {
    const invite = await this.authRepository.findInviteById(id);
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.clinic_id !== clinicId) {
      throw new ForbiddenException('Invite does not belong to this clinic');
    }

    // Only admins can delete invites
    const requester = await this.authRepository.findById(requestedById);
    if (!requester || (requester.role !== 'admin' && requester.clinic_id !== clinicId)) {
      throw new ForbiddenException('Not authorized to delete this invite');
    }

    invite.revoked_at = new Date();
    await this.authRepository.saveInvite(invite);

    return { success: true };
  }

  async accept(token: string, password: string): Promise<any> {
    const invite = await this.authRepository.findInviteByToken(token);
    if (!invite || invite.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired invite');
    }

    if (invite.accepted_at || invite.revoked_at) {
      throw new BadRequestException('Invite already used or revoked');
    }

    // Check if email already belongs to any clinic
    const existingUser = await this.authRepository.findByEmail(invite.email);
    if (existingUser) {
      throw new BadRequestException('Email already belongs to another clinic');
    }

    // Create user account
    const hashedPassword = await hashPassword(password);
    const user = await this.authRepository.createUser({
      email: invite.email,
      password_hash: hashedPassword,
      full_name: '', // Will be set on first login
      role: invite.role,
      clinic_id: invite.clinic_id,
      is_clinic_admin: invite.role === 'admin', // Admin role in invite = clinic admin
      is_active: true,
    });

    // Mark invite as accepted
    invite.accepted_at = new Date();
    await this.authRepository.saveInvite(invite);

    // Generate initial session
    const refreshToken = this.generateRefreshToken();
    const hashedRefreshToken = await hashPassword(refreshToken);
    const family_id = this.generateId();

    const session = await this.authRepository.createSession({
      user_id: user.id,
      clinic_id: invite.clinic_id,
      family_id,
      refresh_token_hash: hashedRefreshToken,
      device_label: 'Web Initial',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const payload = {
      sub: user.id,
      clinic_id: invite.clinic_id,
      role: invite.role,
      is_clinic_admin: user.is_clinic_admin,
      session_id: session.id,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      user_id: user.id,
      access_token,
      refresh_token: refreshToken,
      session_id: session.id,
      clinic_id: invite.clinic_id,
    };
  }

  async revoke(id: string, clinicId: string, requestedById: string): Promise<{ success: true }> {
    const invite = await this.authRepository.findInviteById(id);
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.clinic_id !== clinicId) {
      throw new ForbiddenException('Invite does not belong to this clinic');
    }

    // Only admins can revoke invites
    const requester = await this.authRepository.findById(requestedById);
    if (!requester || (requester.role !== 'admin' && requester.clinic_id !== clinicId)) {
      throw new ForbiddenException('Not authorized to revoke this invite');
    }

    invite.revoked_at = new Date();
    await this.authRepository.saveInvite(invite);

    return { success: true };
  }

  // Helper methods
  private generateToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private generateId(): string {
    return require('crypto').randomBytes(16).toString('hex');
  }

  private generateRefreshToken(): string {
    return require('crypto').randomBytes(40).toString('hex');
  }
}
