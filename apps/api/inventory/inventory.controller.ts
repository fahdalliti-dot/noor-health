import {
  Controller,
  Get,
  Post,
  Patch,
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
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, AdjustStockDto } from './dto/create-inventory.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    @Inject(InventoryService) private readonly service: InventoryService,
  ) {}

  @Post()
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async createItem(
    @Body() dto: CreateInventoryItemDto,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.createItem(dto, user.clinic_id, user.id);
    return {
      status: HttpStatus.CREATED,
      data,
      message: 'Article d’inventaire ajouté avec succès.',
    };
  }

  @Get()
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async findAll(
    @Query('category') category: string,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.findAll(user.clinic_id, category);
    return {
      status: HttpStatus.OK,
      data,
    };
  }

  @Patch(':id/adjust')
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.adjustStock(id, dto, user.clinic_id, user.id);
    return {
      status: HttpStatus.OK,
      data,
      message: 'Niveau de stock mis à jour avec traçabilité complète.',
    };
  }

  @Get(':id/logs')
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async getLogs(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.getLogs(id, user.clinic_id);
    return {
      status: HttpStatus.OK,
      data,
    };
  }
}
