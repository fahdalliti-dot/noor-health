import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from '@/appointments/appointments.service';
import type { User, Role } from '@doctors-morocco/db';

function createMockPrisma() {
  return {
    appointment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    clinic: {
      findUnique: vi.fn(),
    },
  };
}

function createMockAuditLog() {
  return {
    log: vi.fn(),
  };
}

function mockUser(role: Role | any, id = 'u1', clinicId = 'c1'): Partial<User> {
  return { id, role, clinic_id: clinicId, full_name: 'Test', email: 'test@test.com' };
}

describe('AppointmentsService — State Machine', () => {
  let service: AppointmentsService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let auditLog: ReturnType<typeof createMockAuditLog>;

  beforeEach(() => {
    prisma = createMockPrisma();
    auditLog = createMockAuditLog();
    service = new AppointmentsService(prisma as any, auditLog as any);
  });

  function mockAppointment(status: string, doctorId = 'd1', clinicId = 'c1') {
    return {
      id: 'appt-1',
      clinic_id: clinicId,
      doctor_id: doctorId,
      status,
      starts_at: new Date(Date.now() - 60 * 60 * 1000),
      ends_at: new Date(Date.now() + 30 * 60 * 1000),
      updated_at: new Date(),
    };
  }

  describe('changeStatus', () => {
    it('should allow scheduled → confirmed by secretary', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment('scheduled'));
      prisma.appointment.update.mockResolvedValue({ ...mockAppointment('scheduled'), status: 'confirmed' });

      const result = await service.changeStatus(
        'appt-1',
        { status: 'confirmed' },
        'c1',
        mockUser('secretary') as User,
      );

      expect(result.status).toBe('confirmed');
    });

    it('should reject confirmed → completed (illegal)', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment('confirmed'));

      await expect(
        service.changeStatus('appt-1', { status: 'completed' }, 'c1', mockUser('secretary') as User),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject no_show before start time', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        ...mockAppointment('confirmed'),
        starts_at: new Date(Date.now() + 60 * 60 * 1000),
      });

      await expect(
        service.changeStatus('appt-1', { status: 'no_show' }, 'c1', mockUser('secretary') as User),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject doctor transitioning another doctor\'s appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment('scheduled', 'd-other'));

      await expect(
        service.changeStatus(
          'appt-1',
          { status: 'confirmed' },
          'c1',
          mockUser('doctor', 'd1') as User,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject transition from terminal status', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment('completed'));

      await expect(
        service.changeStatus('appt-1', { status: 'scheduled' }, 'c1', mockUser('secretary') as User),
      ).rejects.toThrow(ConflictException);
    });

    it('should 404 for non-existent appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.changeStatus('appt-1', { status: 'confirmed' }, 'c1', mockUser('secretary') as User),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
