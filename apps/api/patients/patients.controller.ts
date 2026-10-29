import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';
import { PatientsService } from './patients.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
} from '@shared/utils';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(@Inject(PatientsService) private readonly patientsService: PatientsService) {}

  // =====================
  // Patient Identity (demographics, contact)
  // =====================

  @Post()
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async createPatient(
    @Body() dto: CreatePatientDto,
    @GetUser() user: any,
  ) {
    console.log('[DEBUG createPatient] user:', JSON.stringify(user));
    const data = await this.patientsService.createPatient(
      dto,
      user.clinic_id,
      user.id,
      user.role,
    );

    return {
      status: HttpStatus.CREATED,
      data: { patient: data },
    };
  }

  @Get()
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async listPatients(
    @Query('deleted') deleted?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @GetUser() user?: any,
  ) {
    const data = await this.patientsService.listPatients(user.clinic_id, {
      deleted: deleted === 'true',
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return {
      status: HttpStatus.OK,
      data: { patients: data },
    };
  }

  @Get('search')
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async searchPatients(
    @Query('q') q: string,
    @Query('limit') limit?: string,
    @GetUser() user?: any,
  ) {
    if (!q || q.trim().length < 1) {
      return {
        status: HttpStatus.OK,
        data: { patients: [] },
      };
    }

    const data = await this.patientsService.searchPatients(user.clinic_id, {
      q: q.trim(),
      limit: limit ? parseInt(limit, 10) : 20,
    });

    return {
      status: HttpStatus.OK,
      data: { patients: data },
    };
  }

  @Get(':id')
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async getPatient(
    @Param('id') id: string,
    @Query('include_medical_profile') includeMedicalProfile?: string,
    @GetUser() user?: any,
  ) {
    const data = await this.patientsService.getPatient(
      id,
      user.clinic_id,
      includeMedicalProfile === 'true',
    );

    return {
      status: HttpStatus.OK,
      data: { patient: data },
    };
  }

  @Patch(':id')
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async updatePatient(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @GetUser() user: any,
  ) {
    const data = await this.patientsService.updatePatient(
      id,
      dto,
      user.clinic_id,
      user.id,
      user.role,
    );

    return {
      status: HttpStatus.OK,
      data: { patient: data },
    };
  }

  @Delete(':id')
  @Roles('doctor')
  @ResponseFormat()
  async deletePatient(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    await this.patientsService.softDeletePatient(id, user.clinic_id, user.id, user.role);

    return {
      status: HttpStatus.OK,
      data: { success: true },
    };
  }

  // =====================
  // Medical Profile (Doctor only)
  // =====================

  @Get(':id/medical-profile')
  @Roles('doctor')
  @ResponseFormat()
  async getMedicalProfile(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    const data = await this.patientsService.getMedicalProfile(id, user.clinic_id);

    return {
      status: HttpStatus.OK,
      data: { medical_profile: data },
    };
  }

  @Post(':id/medical-profile')
  @Roles('doctor')
  @ResponseFormat()
  async upsertMedicalProfile(
    @Param('id') id: string,
    @Body() dto: {
      height_cm?: number | null;
      weight_kg?: number | null;
      blood_type?: string | null;
      allergies?: string[] | null;
      chronic_conditions?: string[] | null;
    },
    @GetUser() user: any,
  ) {
    const data = await this.patientsService.upsertMedicalProfile(
      id,
      dto,
      user.clinic_id,
      user.id,
      user.role,
    );

    return {
      status: HttpStatus.OK,
      data: { medical_profile: data },
    };
  }

  @Delete(':id/medical-profile')
  @Roles('doctor')
  @ResponseFormat()
  async deleteMedicalProfile(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    await this.patientsService.deleteMedicalProfile(id, user.clinic_id, user.id, user.role);

    return {
      status: HttpStatus.OK,
      data: { success: true },
    };
  }
}