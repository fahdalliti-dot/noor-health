import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class ClinicContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.clinic_id) {
      // Set the RLS session variable for this request's database connection
      await this.prisma.$executeRawUnsafe(
        `SELECT set_config('app.clinic_id', $1, true)`,
        user.clinic_id
      );
    }

    return true;
  }
}