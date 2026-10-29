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
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';

@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificatesController {
  constructor(
    @Inject(CertificatesService) private readonly service: CertificatesService,
  ) {}

  @Post()
  @Roles('doctor')
  @ResponseFormat()
  async create(
    @Body() dto: CreateCertificateDto,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.create(dto, user.clinic_id, user.id);
    return {
      status: HttpStatus.CREATED,
      data,
      message: 'Official Moroccan medical certificate generated successfully.',
    };
  }

  @Get()
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
}
