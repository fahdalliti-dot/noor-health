import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';
import { AuditService } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async findAll(
    @GetUser() user: any,
    @Query('user_id') user_id?: string,
  ) {
    const logs = await this.auditService.findAll(user.clinic_id, user_id);

    return {
      status: 200,
      data: { audit_logs: logs },
    };
  }

  @Get('patients/:id/access-log')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async findPatientAccessLog(@Param('id') patient_id: string, @GetUser() user: any) {
    const logs = await this.auditService.findPatientAccessLog(patient_id, user.clinic_id);

    return {
      status: 200,
      data: { access_logs: logs },
    };
  }

  @Get('exports/patient/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async exportPatientData(@Param('id') patient_id: string, @GetUser() user: any) {
    const export_data = await this.auditService.exportPatientData(patient_id, user.clinic_id);

    return {
      status: 200,
      data: export_data,
    };
  }
}