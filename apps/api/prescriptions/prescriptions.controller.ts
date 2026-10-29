import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(
    @Inject(PrescriptionsService) private readonly service: PrescriptionsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  @ResponseFormat()
  async create(
    @Body() dto: CreatePrescriptionDto,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.create(dto, user.clinic_id, user.id);
    return {
      status: HttpStatus.CREATED,
      data,
      message: 'Prescription generated successfully with anti-fraud QR verification token.',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async findAll(
    @Query('patient_id') patientId: string,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.findAll(user.clinic_id, patientId);
    return {
      status: HttpStatus.OK,
      data,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.findOne(id, user.clinic_id);
    return {
      status: HttpStatus.OK,
      data,
    };
  }

  // Public pharmacist verification endpoint
  @Get('verify/:token')
  @ResponseFormat()
  async verifyQr(@Param('token') token: string): Promise<any> {
    const data = await this.service.verifyQr(token);
    return {
      status: HttpStatus.OK,
      data,
      message: 'Prescription authenticity verified successfully.',
    };
  }
}
