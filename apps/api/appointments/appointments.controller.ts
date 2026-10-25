import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  Headers,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  ChangeAppointmentStatusDto,
  AppointmentStatus,
} from '@shared/utils';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @Roles('admin', 'doctor', 'secretary')
  @ResponseFormat()
  async list(
    @GetUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('doctor_id') doctorId?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    const data = await this.appointmentsService.list({
      clinicId: user.clinic_id,
      userId: user.id,
      userRole: user.role,
      from,
      to,
      doctorId,
      status,
    });

    return {
      status: HttpStatus.OK,
      data: { appointments: data },
    };
  }

  @Post()
  @Roles('doctor', 'secretary')
  @ResponseFormat()
  async create(
    @Body() dto: CreateAppointmentDto,
    @GetUser() user: any,
  ) {
    const data = await this.appointmentsService.create(
      dto,
      user.clinic_id,
      user.id,
      user.role,
    );

    return {
      status: HttpStatus.CREATED,
      data: { appointment: data },
    };
  }

  @Get(':id')
  @Roles('admin', 'doctor', 'secretary')
  @ResponseFormat()
  async findById(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    const data = await this.appointmentsService.findById(
      id,
      user.clinic_id,
      user.id,
      user.role,
    );

    return {
      status: HttpStatus.OK,
      data: { appointment: data },
    };
  }

  @Patch(':id')
  @Roles('doctor', 'secretary')
  @ResponseFormat()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @GetUser() user: any,
    @Headers('if-match') ifMatch?: string,
  ) {
    const data = await this.appointmentsService.update(
      id,
      dto,
      user.clinic_id,
      user.id,
      user.role,
      ifMatch,
    );

    return {
      status: HttpStatus.OK,
      data: { appointment: data },
    };
  }

  @Post(':id/status')
  @Roles('doctor', 'secretary')
  @ResponseFormat()
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeAppointmentStatusDto,
    @GetUser() user: any,
  ) {
    const data = await this.appointmentsService.changeStatus(id, dto, user.clinic_id, user);

    return {
      status: HttpStatus.OK,
      data: { appointment: data },
    };
  }
}
