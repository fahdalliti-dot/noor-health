import { Controller, Get, Patch, Body, Param, Delete, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async findAll(@Query('clinic_id') clinicId: string): Promise<any[]> {
    return this.usersService.findAll(clinicId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @GetUser() user: any,
  ) {
    // Prevent changing own role or admin status
    if (user.id === id && (body.role || body.is_active === false)) {
      throw new ForbiddenException('Cannot modify your own role or admin status');
    }

    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ResponseFormat()
  async deactivate(
    @Param('id') id: string,
    @GetUser() actor: any,
  ) {
    await this.usersService.deactivate(id, actor.id);
    return { success: true };
  }
}
