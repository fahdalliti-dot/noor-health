import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ResponseFormat()
  async findAll(@GetUser() user: any) {
    const sessions = await this.sessionsService.findAll(
      user.id,
      user.clinic_id,
    );

    return {
      status: 200,
      data: { sessions },
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ResponseFormat()
  async revoke(
    @Param('id') sessionId: string,
    @GetUser() user: any,
    @Body('reason') reason?: string,
  ) {
    await this.sessionsService.revoke(sessionId, user.id, reason);

    return {
      status: 200,
      data: { success: true },
    };
  }

  @Post('refresh')
  @ResponseFormat()
  async refresh(@Body('refresh_token') refreshToken: string) {
    const result = await this.sessionsService.refreshToken(refreshToken);

    return {
      status: 200,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        session_id: result.session_id,
        device_label: result.device_label,
      },
    };
  }
}
