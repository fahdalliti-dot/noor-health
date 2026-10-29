import { IsOptional, IsString, IsIn } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsIn(['today', 'week', 'month', 'year', 'all'])
  period?: 'today' | 'week' | 'month' | 'year' | 'all' = 'all';

  @IsOptional()
  @IsString()
  doctorId?: string;
}
