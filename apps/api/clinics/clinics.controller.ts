import { Controller, Get, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';
import { ClinicsService } from './clinics.service';
import type { Clinic } from '../db/client';

@Controller('clinic')
export class ClinicsController {
  constructor(private clinicsService: ClinicsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'doctor', 'secretary')
  @ResponseFormat()
  async getCurrentClinic(
    @GetUser() user: any,
  ): Promise<Clinic> {
    return this.clinicsService.findById(user.clinic_id);
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async updateClinic(
    @Body() body: { name?: string; city?: string; address?: string; phone?: string; locale?: 'fr' | 'ar' | 'en'; timezone?: string; require_2fa_all?: boolean },
    @GetUser() user: any,
  ): Promise<Clinic> {
    return this.clinicsService.update(user.clinic_id, body);
  }
}
