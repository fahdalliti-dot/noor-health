import { Injectable, ForbiddenException } from '@nestjs/common';
import { AuthRepository } from '../db/repository';

@Injectable()
export class ClinicsService {
  constructor(private authRepository: AuthRepository) {}

  async findById(id: string) {
    const clinic = await this.authRepository.findClinicById(id);
    if (!clinic) {
      throw new ForbiddenException('Clinic not found');
    }
    return clinic;
  }

  async update(clinicId: string, data: { name?: string; city?: string; address?: string; phone?: string; locale?: 'fr' | 'ar' | 'en'; timezone?: string; require_2fa_all?: boolean }) {
    return this.authRepository.updateClinic(clinicId, data);
  }
}