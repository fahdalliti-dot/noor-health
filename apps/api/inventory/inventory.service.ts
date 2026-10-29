import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { AuditLogRepository } from '../audit/audit-log.repository';
import { CreateInventoryItemDto, AdjustStockDto } from './dto/create-inventory.dto';
import { InventoryCategory, InventoryAction, Prisma } from '@doctors-morocco/db';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogRepository,
  ) {}

  async createItem(
    dto: CreateInventoryItemDto,
    clinicId: string,
    userId: string,
  ): Promise<any> {
    const item = await this.prisma.inventoryItem.create({
      data: {
        clinic_id: clinicId,
        name: dto.name,
        category: (dto.category as InventoryCategory) || InventoryCategory.consumable,
        sku: dto.sku || null,
        quantity: dto.quantity ?? 0,
        min_threshold: dto.min_threshold ?? 5,
        unit: dto.unit || 'unité',
        unit_cost: dto.unit_cost !== undefined ? new Prisma.Decimal(dto.unit_cost) : null,
        supplier: dto.supplier || null,
      },
    });

    if (item.quantity > 0) {
      await this.prisma.inventoryLog.create({
        data: {
          item_id: item.id,
          action: InventoryAction.restock,
          quantity: item.quantity,
          reason: 'Stock initial à la création',
          actor_id: userId,
        },
      });
    }

    await this.auditLog.log({
      action: 'create',
      entity_type: 'InventoryItem',
      entity_id: item.id,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { name: item.name, quantity: item.quantity },
    });

    return item;
  }

  async findAll(clinicId: string, category?: string): Promise<any> {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        clinic_id: clinicId,
        ...(category ? { category: category as InventoryCategory } : {}),
      },
      orderBy: { name: 'asc' },
    });

    return items.map((item) => ({
      ...item,
      is_low_stock: item.quantity <= item.min_threshold,
    }));
  }

  async adjustStock(
    itemId: string,
    dto: AdjustStockDto,
    clinicId: string,
    userId: string,
  ): Promise<any> {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, clinic_id: clinicId },
    });

    if (!item) {
      throw new NotFoundException('Article d’inventaire non trouvé.');
    }

    const newQuantity = item.quantity + dto.quantity;
    if (newQuantity < 0) {
      throw new BadRequestException('Stock insuffisant pour cette consommation.');
    }

    const [updatedItem, log] = await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity },
      }),
      this.prisma.inventoryLog.create({
        data: {
          item_id: itemId,
          action: dto.action as InventoryAction,
          quantity: dto.quantity,
          reason: dto.reason || null,
          actor_id: userId,
        },
      }),
    ]);

    await this.auditLog.log({
      action: 'update',
      entity_type: 'InventoryItem',
      entity_id: itemId,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { change: dto.quantity, new_quantity: newQuantity, action: dto.action },
    });

    return {
      item: {
        ...updatedItem,
        is_low_stock: updatedItem.quantity <= updatedItem.min_threshold,
      },
      log,
    };
  }

  async getLogs(itemId: string, clinicId: string): Promise<any> {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, clinic_id: clinicId },
    });

    if (!item) {
      throw new NotFoundException('Article d’inventaire non trouvé.');
    }

    return this.prisma.inventoryLog.findMany({
      where: { item_id: itemId },
      include: {
        actor: {
          select: {
            id: true,
            full_name: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }
}
