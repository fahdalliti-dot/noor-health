'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';

export interface ConsumableItem {
  id: string;
  name: string;
  category: 'cardiologie' | 'general' | 'injection' | 'hygiene';
  quantity: number;
  unit: string;
  minThreshold: number;
  supplier: string;
  lastRestocked: string;
}

const INITIAL_INVENTORY: ConsumableItem[] = [
  { id: 'item-1', name: 'Rouleaux papier thermique ECG (110mm)', category: 'cardiologie', quantity: 12, unit: 'rouleaux', minThreshold: 5, supplier: 'Maroc Médical Pro (Casablanca)', lastRestocked: '20/10/2026' },
  { id: 'item-2', name: 'Gel échographie & Doppler 5 Litres', category: 'cardiologie', quantity: 2, unit: 'bidons', minThreshold: 3, supplier: 'Atlas Matériel Médical', lastRestocked: '05/10/2026' },
  { id: 'item-3', name: 'Seringues 5ml stériles + aiguilles 21G', category: 'injection', quantity: 85, unit: 'unités', minThreshold: 30, supplier: 'Pharma Nord Distribution', lastRestocked: '15/10/2026' },
  { id: 'item-4', name: 'Gants d\'examen Nitrile non poudrés (Boîtes de 100)', category: 'hygiene', quantity: 1, unit: 'boîte', minThreshold: 3, supplier: 'Atlas Matériel Médical', lastRestocked: '01/10/2026' },
  { id: 'item-5', name: 'Tubes de prélèvement EDTA (Numération / Troponine)', category: 'general', quantity: 45, unit: 'tubes', minThreshold: 20, supplier: 'Laboratoires BioMaroc', lastRestocked: '18/10/2026' },
  { id: 'item-6', name: 'Désinfectant surfaces médicales Aniospray 1L', category: 'hygiene', quantity: 6, unit: 'flacons', minThreshold: 2, supplier: 'Hygiène Santé Maroc', lastRestocked: '22/10/2026' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicName?: string;
}

export function InventoryManagerModal({
  open,
  onOpenChange,
  clinicName = 'Cabinet Dr. Amine Benali',
}: Props) {
  const [items, setItems] = useState<ConsumableItem[]>(INITIAL_INVENTORY);
  const [filter, setFilter] = useState<'all' | 'low'>('all');

  if (!open) return null;

  function adjustQuantity(id: string, delta: number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  }

  const lowStockCount = items.filter((i) => i.quantity <= i.minThreshold).length;

  const filteredItems = items.filter((item) => {
    if (filter === 'low') return item.quantity <= item.minThreshold;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-bold">
              📦
            </span>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                Gestion des Stocks & Consommables Médicaux
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {clinicName} • Réapprovisionnement & alertes de seuil
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600 p-1 text-sm rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter bar & alerts */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition ${filter === 'all' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tous les consommables ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('low')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${filter === 'low' ? 'bg-white font-semibold text-red-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <span>⚠️ Stocks Bas</span>
              <span className="bg-red-100 text-red-800 font-bold px-1.5 rounded-full text-[10px]">
                {lowStockCount}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => alert('Bon de commande fournisseur généré et pré-rempli pour les stocks bas.')}
            className="px-3 py-1.5 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <span>📝</span> Générer Bon de Commande Fournisseur
          </button>
        </div>

        {/* Stock Ledger Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-3">Désignation du Consommable</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Quantité en Réserve</th>
                <th className="p-3">Seuil Min.</th>
                <th className="p-3">Fournisseur Principal</th>
                <th className="p-3 text-right">Ajuster Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.quantity <= item.minThreshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Dernier réassort : {item.lastRestocked}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{item.quantity} {item.unit}</span>
                        {isLow && (
                          <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-bold uppercase animate-pulse">
                            Alerte Réassort
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{item.minThreshold} {item.unit}</td>
                    <td className="p-3 text-slate-600">{item.supplier}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustQuantity(item.id, -1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer"
                          title="Consommer 1 unité"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustQuantity(item.id, 1)}
                          className="w-6 h-6 rounded bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-600 font-bold flex items-center justify-center cursor-pointer"
                          title="Ajouter 1 unité"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InventoryManagerModal;
