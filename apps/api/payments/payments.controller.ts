import {
  Controller,
  Get,
  Post,
  Body,
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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, MockCmiProcessDto } from './dto/create-payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    @Inject(PaymentsService) private readonly service: PaymentsService,
  ) {}

  @Post()
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async create(
    @Body() dto: CreatePaymentDto,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.create(dto, user.clinic_id, user.id);
    return {
      status: HttpStatus.CREATED,
      data,
      message: 'Paiement encaissé avec succès et reçu officiel généré.',
    };
  }

  @Post('cmi/mock-process')
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async processMockCmi(
    @Body() dto: MockCmiProcessDto,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.processMockCmi(dto, user.clinic_id, user.id);
    return {
      status: HttpStatus.CREATED,
      data,
      message: 'Transaction CMI 3D-Secure validée et fonds crédités.',
    };
  }

  @Get()
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async findAll(
    @Query('method') method: string,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.findAll(user.clinic_id, method);
    return {
      status: HttpStatus.OK,
      data,
    };
  }

  @Get('daily-summary')
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async getDailySummary(@GetUser() user: any): Promise<any> {
    const data = await this.service.getDailySummary(user.clinic_id);
    return {
      status: HttpStatus.OK,
      data,
    };
  }
}
