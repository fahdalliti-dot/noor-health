export interface CreateInventoryItemDto {
  name: string;
  category?: 'consumable' | 'medication' | 'equipment' | 'office';
  sku?: string;
  quantity?: number;
  min_threshold?: number;
  unit?: string;
  unit_cost?: number;
  supplier?: string;
}

export interface AdjustStockDto {
  quantity: number; // positive = restock, negative = usage
  action: 'restock' | 'usage' | 'waste' | 'adjustment';
  reason?: string;
}
