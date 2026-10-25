import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';
import { DoctorsService } from './doctors.service';
import {
  CreateWorkingHoursDto,
  UpdateWorkingHoursDto,
  CreateTimeOffDto,
  GetAvailabilityDto,
} from '@shared/utils';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // =====================
  // Availability
  // =====================

  @Get(':id/availability')
  @Roles('admin', 'doctor', 'secretary')
  @ResponseFormat()
  async getAvailability(
    @Param('id') doctorId: string,
    @Query('date') date: string,
    @Query('slot_length') slotLength?: number,
    @GetUser() user?: any,
  ) {
    const dto: GetAvailabilityDto = {
      date,
      slot_length: slotLength ?? 30,
    };

    const result = await this.doctorsService.getAvailability(
      doctorId,
      dto,
      user.clinic_id,
    );

    return {
      status: HttpStatus.OK,
      data: result,
    };
  }

  // =====================
  // Working Hours
  // =====================

  @Post(':id/working-hours')
  @Roles('admin', 'doctor')
  @ResponseFormat()
  async createWorkingHours(
    @Param('id') doctorId: string,
    @Body() dto: CreateWorkingHoursDto,
    @GetUser() user: any,
  ) {
    const data = await this.doctorsService.createWorkingHours(
      { ...dto, doctor_id: doctorId },
      user.clinic_id,
      user.id,
      user.role,
    );

    return {
      status: HttpStatus.CREATED,
      data: { working_hours: data },
    };
  }

  @Get(':id/working-hours')
  @Roles('admin', 'doctor', 'secretary')
  @ResponseFormat()
  async listWorkingHours(
    @Param('id') doctorId: string,
    @GetUser() user: any,
  ) {
    const data = await this.doctorsService.listWorkingHours(doctorId, user.clinic_id);

    return {
      status: HttpStatus.OK,
      data: { working_hours: data },
    };
  }

  @Patch(':id/working-hours/:whId')
  @Roles('admin', 'doctor')
  @ResponseFormat()
  async updateWorkingHours(
    @Param('id') doctorId: string,
    @Param('whId') whId: string,
    @Body() dto: UpdateWorkingHoursDto,
    @GetUser() user: any,
  ) {
    const data = await this.doctorsService.updateWorkingHours(
      doctorId,
      whId,
      dto,
      user.clinic_id,
      user.id,
      user.role,
    );

    return {
      status: HttpStatus.OK,
      data: { working_hours: data },
    };
  }

  @Delete(':id/working-hours/:whId')
  @Roles('admin', 'doctor')
  @ResponseFormat()
  async deleteWorkingHours(
    @Param('id') doctorId: string,
    @Param('whId') whId: string,
    @GetUser() user: any,
  ) {
    await this.doctorsService.deleteWorkingHours(whId, user.clinic_id, user.id, user.role);

    return {
      status: HttpStatus.OK,
      data: { success: true },
    };
  }

  // =====================
  // Time Off
  // =====================

  @Post(':id/time-off')
  @Roles('admin', 'doctor')
  @ResponseFormat()
  async createTimeOff(
    @Param('id') doctorId: string,
    @Body() dto: CreateTimeOffDto,
    @GetUser() user: any,
  ) {
    const data = await this.doctorsService.createTimeOff(
      { ...dto, doctor_id: doctorId },
      user.clinic_id,
      user.id,
      user.role,
    );

    return {
      status: HttpStatus.CREATED,
      data: { time_off: data },
    };
  }

  @Delete(':id/time-off/:toId')
  @Roles('admin', 'doctor')
  @ResponseFormat()
  async deleteTimeOff(
    @Param('id') doctorId: string,
    @Param('toId') toId: string,
    @GetUser() user: any,
  ) {
    await this.doctorsService.deleteTimeOff(toId, user.clinic_id, user.id, user.role);

    return {
      status: HttpStatus.OK,
      data: { success: true },
    };
  }
}
