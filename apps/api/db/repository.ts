import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User, Clinic, Session, Invite, Subscription, RecoveryCode, AuditLog, Role, Action } from '@doctors-morocco/db';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  // User methods
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findSessionAndUser(refreshTokenHash: string): Promise<{ user: User; session: Session } | null> {
    const result = await this.prisma.session.findUnique({
      where: {
        refresh_token_hash: refreshTokenHash,
      },
      include: {
        user: {
          include: {
            clinic: true,
          },
        },
      },
    });
    if (!result) return null;
    return { user: result.user as User, session: result as Session };
  }

  async findSessionById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async getSession(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async findSessionsByUser(userId: string, clinicId: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: {
        user_id: userId,
        clinic_id: clinicId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findAllByClinic(clinicId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { clinic_id: clinicId, is_active: true },
    });
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'clinic_id' | 'sessions' | 'recovery_codes' | 'invites_sent' | 'invites_received'>>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findInviteByToken(tokenHash: string): Promise<Invite | null> {
    return this.prisma.invite.findUnique({
      where: {
        token_hash: tokenHash,
      },
    });
  }

  async findInviteById(id: string): Promise<Invite | null> {
    return this.prisma.invite.findUnique({ where: { id } });
  }

  async findInvitesByClinic(clinicId: string): Promise<Invite[]> {
    return this.prisma.invite.findMany({
      where: {
        clinic_id: clinicId,
        revoked_at: null,
        accepted_at: null,
      },
    });
  }

  async findPendingInvite(clinicId: string, email: string): Promise<Invite | null> {
    return this.prisma.invite.findFirst({
      where: {
        clinic_id: clinicId,
        email,
        revoked_at: null,
        accepted_at: null,
      },
    });
  }

  async createInvite(data: {
    clinic_id: string;
    email: string;
    role: string;
    token_hash: string;
    expires_at: Date;
    invited_by: string;
  }): Promise<Invite> {
    return this.prisma.invite.create({
      data: {
        clinic_id: data.clinic_id,
        email: data.email,
        role: data.role as any,
        token_hash: data.token_hash,
        expires_at: data.expires_at,
        invited_by: data.invited_by,
      },
    });
  }

  async createUser(data: {
    email: string;
    password_hash: string;
    full_name: string;
    role: string;
    clinic_id: string;
    is_clinic_admin: boolean;
    is_active: boolean;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password_hash: data.password_hash,
        full_name: data.full_name,
        role: data.role as any,
        clinic: { connect: { id: data.clinic_id } },
        is_clinic_admin: data.is_clinic_admin,
        is_active: data.is_active,
      },
    });
  }

  async createSession(data: {
    user_id: string;
    clinic_id: string;
    family_id: string;
    refresh_token_hash?: string;
    device_label?: string;
    ip?: string;
    expires_at: Date;
  }): Promise<Session> {
    return this.prisma.session.create({
      data: {
        user: { connect: { id: data.user_id } },
        clinic: { connect: { id: data.clinic_id } },
        family_id: data.family_id,
        refresh_token_hash: data.refresh_token_hash ?? '',
        device_label: data.device_label,
        ip: data.ip,
        expires_at: data.expires_at,
      },
    });
  }

  async createPasswordResetToken(data: {
    user_id: string;
    token_hash: string;
    expires_at: Date;
    used_at?: Date | null;
  }): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        action: Action.password_reset_requested,
        user_id: data.user_id,
        expires_at: data.expires_at,
        token_hash: data.token_hash,
        request_id: 'system',
        metadata: {},
      },
    });
  }

  async save(user: User): Promise<User> {
    return this.prisma.user.update({
      where: { id: user.id },
      data: user,
    });
  }

  async findPasswordResetToken(tokenHash: string): Promise<any | null> {
    return this.prisma.auditLog.findFirst({
      where: {
        token_hash: tokenHash,
        action: Action.password_reset_requested,
        used_at: null,
        expires_at: { gte: new Date() },
      },
    });
  }

  async validateRefreshSession(refreshTokenHash: string): Promise<{ user: User; session: Session } | null> {
    return this.findSessionAndUser(refreshTokenHash);
  }

  async saveInvite(invite: Invite): Promise<Invite> {
    return this.prisma.invite.update({
      where: { id: invite.id },
      data: invite,
    });
  }

  async auditLog(data: {
    action: string;
    clinic_id?: string | null;
    user_id?: string | null;
    ip?: string | null;
    user_agent?: string | null;
    metadata: Record<string, any>;
    request_id?: string;
    entity_type?: string | null;
    entity_id?: string | null;
  }): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        action: data.action as any,
        clinic_id: data.clinic_id,
        user_id: data.user_id,
        ip: data.ip,
        user_agent: data.user_agent,
        metadata: data.metadata,
        request_id: data.request_id ?? 'system',
        entity_type: data.entity_type,
        entity_id: data.entity_id,
      },
    });
  }

  // Session management
  async revokeSession(sessionId: string, reason: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        revoked_at: new Date(),
        revoked_reason: reason,
      },
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        user_id: userId,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
        revoked_reason: 'password_change',
      },
    });
  }

  // Clinic management
  async countActiveAdmins(clinicId: string): Promise<number> {
    return this.prisma.user.count({
      where: {
        clinic_id: clinicId,
        role: 'admin',
        is_active: true,
      },
    });
  }

  async findClinicById(id: string): Promise<Clinic | null> {
    return this.prisma.clinic.findUnique({ where: { id } });
  }

  async createClinic(data: {
    name: string;
    city: string;
    address: string;
    phone: string;
    locale?: string;
    timezone?: string;
    require_2fa_all?: boolean;
  }): Promise<Clinic> {
    return this.prisma.clinic.create({
      data: {
        name: data.name,
        city: data.city,
        address: data.address,
        phone: data.phone,
        locale: data.locale as any,
        timezone: data.timezone ?? 'Africa/Casablanca',
        require_2fa_all: data.require_2fa_all ?? false,
      },
    });
  }

  async updateClinic(id: string, data: Partial<Omit<Clinic, 'id' | 'users' | 'subscription'>>): Promise<Clinic> {
    return this.prisma.clinic.update({
      where: { id },
      data,
    });
  }

  // Subscription management
  async createSubscription(data: {
    clinic_id: string;
    plan?: string;
    status?: string;
    trial_ends_at: Date;
  }): Promise<Subscription> {
    return this.prisma.subscription.create({
      data: {
        clinic: { connect: { id: data.clinic_id } },
        plan: (data.plan ?? 'trial') as any,
        status: (data.status ?? 'trialing') as any,
        trial_ends_at: data.trial_ends_at,
      },
    });
  }

  // Recovery code management
  async createRecoveryCode(data: {
    user_id: string;
    code_hash: string;
  }): Promise<RecoveryCode> {
    return this.prisma.recoveryCode.create({
      data: {
        user: { connect: { id: data.user_id } },
        code_hash: data.code_hash,
      },
    });
  }

  // Audit log management
  async findAuditLogs(clinicId?: string, userId?: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        clinic_id: clinicId,
        user_id: userId,
      },
      orderBy: {
        occurred_at: 'desc',
      },
    });
  }

  async findPatientAccessLogs(clinicId: string, userId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        clinic_id: clinicId,
        user_id: userId,
        action: 'read' as any,
      },
      orderBy: {
        occurred_at: 'desc',
      },
    });
  }
}