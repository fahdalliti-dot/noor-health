import {
  Controller,
  Get,
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
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    @Inject(AnalyticsService) private readonly service: AnalyticsService,
  ) {}

  @Get('dashboard')
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async getDashboard(
    @Query() query: AnalyticsQueryDto,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.getDashboard(user.clinic_id, query.period || 'all');
    return {
      status: HttpStatus.OK,
      data,
      message: 'Indicateurs financiers et analytiques du cabinet récupérés avec succès.',
    };
  }
}
