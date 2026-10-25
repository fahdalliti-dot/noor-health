import { Controller, Post, Get, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';
import { InvitationsService } from './invitations.service';

@Controller('invites')
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async create(
    @Body('email') email: string,
    @Body('role') role: string,
    @GetUser() user: any,
  ) {
    const result = await this.invitationsService.create(
      user.clinic_id,
      email,
      role,
      user.id,
    );

    return {
      status: 200,
      data: {
        invite_id: result.invite_id,
        email: result.email,
        role: result.role,
        expires_at: result.expires_at,
        token: result.token,
      },
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async findAll(@GetUser() user: any) {
    const invites = await this.invitationsService.findAll(user.clinic_id, user.id);

    return {
      status: 200,
      data: { invites },
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async findById(@Param('id') id: string, @GetUser() user: any) {
    const invite = await this.invitationsService.findById(
      id,
      user.clinic_id,
      user.id,
    );

    return {
      status: 200,
      data: { invite },
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async delete(@Param('id') id: string, @GetUser() user: any) {
    await this.invitationsService.delete(id, user.clinic_id, user.id);

    return {
      status: 200,
      data: { success: true },
    };
  }
}