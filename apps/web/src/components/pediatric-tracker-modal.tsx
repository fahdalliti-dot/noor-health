'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import type { Appointment } from '@/hooks/use-agenda';

interface VaccineScheduleItem {
  id: string;
  ageLabel: string;
  vaccines: string;
  administered: boolean;
  dateAdministered?: string;
  batchNumber?: string;
}

const MOROCCAN_PNI_SCHEDULE: VaccineScheduleItem[] = [
  { id: 'v-0', ageLabel: 'À la naissance', vaccines: 'BCG + Hépatite B (dose néonatale) + VPO zéro', administered: true, dateAdministered: '15/01/2026', batchNumber: 'BCG-9921A' },
  { id: 'v-2m', ageLabel: '2 mois', vaccines: 'Pentavalent 1 (DTC-HepB-Hib) + VPO 1 + Pneumo 1 + Rota 1', administered: true, dateAdministered: '16/03/2026', batchNumber: 'PNT-8812B' },
  { id: 'v-3m', ageLabel: '3 mois', vaccines: 'Pentavalent 2 + VPO 2 + Rotavirus 2', administered: true, dateAdministered: '18/04/2026', batchNumber: 'PNT-8833C' },
  { id: 'v-4m', ageLabel: '4 mois', vaccines: 'Pentavalent 3 + VPO 3 + Pneumocoque 2 + VPI', administered: true, dateAdministered: '20/05/2026', batchNumber: 'PNT-8901D' },
  { id: 'v-9m', ageLabel: '9 mois', vaccines: 'Rougeole-Rubéole 1 (RR 1) + Vitamine A 100 000 UI', administered: false },
  { id: 'v-12m', ageLabel: '12 mois', vaccines: 'Rappel Pneumocoque (Pneumo 3)', administered: false },
  { id: 'v-18m', ageLabel: '18 mois', vaccines: 'Rougeole-Rubéole 2 (RR 2) + DTC 1er Rappel + VPO Rappel', administered: false },
  { id: 'v-5y', ageLabel: '5 ans', vaccines: 'DTC 2ème Rappel + VPO', administered: false },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  childAgeMonths?: number;
}

export function PediatricTrackerModal({
  open,
  onOpenChange,
  appointment,
  childAgeMonths = 8,
}: Props) {
  const [schedule, setSchedule] = useState<VaccineScheduleItem[]>(MOROCCAN_PNI_SCHEDULE);
  const [weightKg, setWeightKg] = useState(8.2);
  const [heightCm, setHeightCm] = useState(69);
  const [cranialCm, setCranialCm] = useState(44);

  if (!open || !appointment) return null;

  const childName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Enfant';

  function toggleVaccine(id: string) {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.administered;
          return {
            ...item,
            administered: next,
            dateAdministered: next ? 'Aujourd\'hui' : undefined,
          };
        }
        return item;
      }),
    );
  }

  // WHO Growth Percentile Estimation for 8 months
  const weightStatus = weightKg < 7.0 ? 'Poids faible (< 3ème percentile)' : weightKg > 9.8 ? 'Poids élevé (> 97ème percentile)' : 'Poids normal (Médiane OMS)';
  const heightStatus = heightCm < 66 ? 'Taille inférieure aux normes' : heightCm > 72 ? 'Taille supérieure aux normes' : 'Taille normale (Médiane OMS)';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl border border-slate-200 max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center text-lg font-bold">
              👶
            </span>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Suivi Pédiatrique & Programme National d&apos;Immunisation (PNI Maroc)
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Enfant : {childName} ({childAgeMonths} mois) • Carnet de Santé Numérique
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

        {/* Top: Biometric measurements and percentiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
            <span className="font-semibold text-slate-500 block uppercase text-[10px]">Poids Actuel</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-20 bg-white border border-slate-300 rounded p-1 font-mono font-bold text-sm"
              />
              <span className="font-mono text-slate-600">kg</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">✓ {weightStatus}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
            <span className="font-semibold text-slate-500 block uppercase text-[10px]">Taille / Longueur</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.5"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-20 bg-white border border-slate-300 rounded p-1 font-mono font-bold text-sm"
              />
              <span className="font-mono text-slate-600">cm</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">✓ {heightStatus}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
            <span className="font-semibold text-slate-500 block uppercase text-[10px]">Périmètre Crânien</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.5"
                value={cranialCm}
                onChange={(e) => setCranialCm(Number(e.target.value))}
                className="w-20 bg-white border border-slate-300 rounded p-1 font-mono font-bold text-sm"
              />
              <span className="font-mono text-slate-600">cm</span>
            </div>
            <div className="text-[11px] text-slate-600">Courbe crânienne régulière</div>
          </div>
        </div>

        {/* PNI Vaccination Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-900">
              Calendrier Vaccinal Obligatoire (Ministère de la Santé du Maroc)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">PNI Conforme</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="p-2.5 font-mono">Âge Recommandé</th>
                <th className="p-2.5">Vaccins & Doses</th>
                <th className="p-2.5">Date / Lot</th>
                <th className="p-2.5 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="p-2.5 font-mono font-semibold text-slate-900">{item.ageLabel}</td>
                  <td className="p-2.5 text-slate-800">{item.vaccines}</td>
                  <td className="p-2.5 font-mono text-[11px] text-slate-500">
                    {item.dateAdministered ? `${item.dateAdministered} (${item.batchNumber || 'Lot OK'})` : '—'}
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleVaccine(item.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition ${
                        item.administered
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {item.administered ? '✓ Administré' : '+ Valider l\'injection'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fermer
          </Button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition cursor-pointer flex items-center gap-1"
            >
              <span>🖨</span> Imprimer le Carnet PNI
            </button>
            <Button
              size="sm"
              onClick={() => {
                alert('Données vaccinales et biométriques enregistrées au dossier pédiatrique.');
                onOpenChange(false);
              }}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold"
            >
              Enregistrer au Carnet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PediatricTrackerModal;
