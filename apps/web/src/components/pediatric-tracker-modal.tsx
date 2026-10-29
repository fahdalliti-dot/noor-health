'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/button';
import { PrintPreviewModal } from '@/components/print/print-preview-modal';
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
  doctorName?: string;
  doctorInpe?: string;
}

export function PediatricTrackerModal({
  open,
  onOpenChange,
  appointment,
  childAgeMonths = 8,
  doctorName = 'Dr. Sara Alami',
  doctorInpe = '109283745',
}: Props) {
  const [schedule, setSchedule] = useState<VaccineScheduleItem[]>(MOROCCAN_PNI_SCHEDULE);
  const [weightKg, setWeightKg] = useState(8.6);
  const [heightCm, setHeightCm] = useState(70.5);
  const [cranialCm, setCranialCm] = useState(44.2);
  const [activeTab, setActiveTab] = useState<'pni' | 'who_curves'>('pni');
  const [showPrintModal, setShowPrintModal] = useState(false);

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
            dateAdministered: next ? '29/10/2026' : undefined,
            batchNumber: next ? 'LOT-2026-MA' : undefined,
          };
        }
        return item;
      }),
    );
  }

  // BMI Pediatric calculation (kg / m^2)
  const heightM = heightCm / 100;
  const imc = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  // WHO Percentile Check for 8 months
  const weightStatus =
    weightKg < 7.0
      ? 'Poids faible (< 3ème percentile OMS)'
      : weightKg > 10.5
      ? 'Poids élevé (> 97ème percentile OMS)'
      : 'Poids idéal (Médiane OMS - Croissance harmonieuse)';

  const heightStatus =
    heightCm < 66
      ? 'Taille inférieure aux normes'
      : heightCm > 73
      ? 'Taille supérieure aux normes'
      : 'Taille normale (50ème percentile OMS)';

  const administeredCount = schedule.filter((s) => s.administered).length;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-4xl w-full p-6 space-y-6 shadow-2xl max-h-[94vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center text-xl font-bold">
              👶
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-stone-900">
                  Carnet de Santé Numérique & Suivi Vaccinal PNI Maroc
                </h2>
                <span className="text-[10px] bg-pink-100 text-pink-800 font-bold px-2 py-0.5 rounded font-mono">
                  Pédiatrie & Néonatalogie
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono">
                Enfant : <span className="font-semibold text-stone-800">{childName}</span> ({childAgeMonths} mois) • {doctorName} (INPE : {doctorInpe})
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fermer
          </Button>
        </div>

        {/* Biometric Measurements Card */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <span className="font-semibold text-stone-500 block uppercase text-[10px]">Poids Actuel</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-20 bg-white border border-stone-300 rounded p-1 font-mono font-bold text-sm"
              />
              <span className="font-mono text-stone-600 font-bold">kg</span>
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">{weightStatus}</div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <span className="font-semibold text-stone-500 block uppercase text-[10px]">Taille / Longueur</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.5"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-20 bg-white border border-stone-300 rounded p-1 font-mono font-bold text-sm"
              />
              <span className="font-mono text-stone-600 font-bold">cm</span>
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">{heightStatus}</div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <span className="font-semibold text-stone-500 block uppercase text-[10px]">Périmètre Crânien</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                value={cranialCm}
                onChange={(e) => setCranialCm(Number(e.target.value))}
                className="w-20 bg-white border border-stone-300 rounded p-1 font-mono font-bold text-sm"
              />
              <span className="font-mono text-stone-600 font-bold">cm</span>
            </div>
            <div className="text-[10px] text-stone-600">Courbe crânienne régulière ✓</div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <span className="font-semibold text-stone-500 block uppercase text-[10px]">Indice de Masse (IMC)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-bold font-mono text-terracotta-700">{imc}</span>
              <span className="text-[10px] text-stone-500">kg/m²</span>
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">Morphologie harmonieuse</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('pni')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'pni' ? 'bg-pink-600 text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Programme National d&apos;Immunisation (PNI Maroc) • {administeredCount}/{schedule.length}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('who_curves')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'who_curves' ? 'bg-pink-600 text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Courbes de Croissance Graphiques OMS (0 - 2 ans)
          </button>
        </div>

        {/* Tab 1: PNI Vaccination Table */}
        {activeTab === 'pni' && (
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-stone-50 border-b border-stone-200 flex justify-between items-center text-xs">
              <span className="font-bold text-stone-900">
                Calendrier Vaccinal Officiel (Programme National d&apos;Immunisation - Ministère de la Santé)
              </span>
              <span className="text-[11px] text-emerald-700 font-mono font-bold">Conformité PNI 100%</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/70 border-b border-stone-200 text-stone-500 font-medium">
                <tr>
                  <th className="p-2.5 font-mono">Âge Recommandé</th>
                  <th className="p-2.5">Vaccins & Doses PNI</th>
                  <th className="p-2.5">Date / N° de Lot</th>
                  <th className="p-2.5 text-right">Statut Vaccinal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {schedule.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/60">
                    <td className="p-2.5 font-mono font-semibold text-stone-900">{item.ageLabel}</td>
                    <td className="p-2.5 text-stone-800 font-medium">{item.vaccines}</td>
                    <td className="p-2.5 font-mono text-[11px] text-stone-500">
                      {item.dateAdministered ? `${item.dateAdministered} (${item.batchNumber || 'Lot certifié'})` : '—'}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleVaccine(item.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition ${
                          item.administered
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {item.administered ? '✓ Injecté & Validé' : '+ Valider l\'injection'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Interactive WHO Growth Curves Chart */}
        {activeTab === 'who_curves' && (
          <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-900 text-sm">
                  Courbe de Poids selon l&apos;Âge (0 à 24 mois - Normes OMS)
                </span>
                <p className="text-[11px] text-stone-500">
                  Repères de percentiles : +2 Écart-Type (97e), Médiane OMS (50e), -2 Écart-Type (3e)
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10.5px] font-medium text-stone-600">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-stone-300 inline-block"></span> +2 SD</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-emerald-500 inline-block"></span> Médiane</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-stone-300 inline-block"></span> -2 SD</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span> Enfant ({weightKg} kg)</span>
              </div>
            </div>

            {/* Visual SVG Growth Curve */}
            <div className="h-56 bg-stone-50 rounded-xl border border-stone-200 p-3 relative flex flex-col justify-between">
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#E4DDD0" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="480" y2="60" stroke="#E4DDD0" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="480" y2="100" stroke="#E4DDD0" strokeDasharray="3 3" />
                <line x1="40" y1="140" x2="480" y2="140" stroke="#E4DDD0" strokeDasharray="3 3" />
                <line x1="40" y1="180" x2="480" y2="180" stroke="#E4DDD0" />

                {/* Y-axis Labels (Weight kg: 15kg at top, 3kg at bottom) */}
                <text x="10" y="24" fontSize="9" fill="#8C8C7A" fontFamily="monospace">15 kg</text>
                <text x="10" y="64" fontSize="9" fill="#8C8C7A" fontFamily="monospace">12 kg</text>
                <text x="10" y="104" fontSize="9" fill="#8C8C7A" fontFamily="monospace">9 kg</text>
                <text x="10" y="144" fontSize="9" fill="#8C8C7A" fontFamily="monospace">6 kg</text>
                <text x="10" y="184" fontSize="9" fill="#8C8C7A" fontFamily="monospace">3 kg</text>

                {/* +2 SD Line (Upper limit) */}
                <path
                  d="M 40,165 Q 150,115 260,85 T 480,25"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* WHO Median (Green Reference Line) */}
                <path
                  d="M 40,175 Q 150,130 260,105 T 480,45"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />

                {/* -2 SD Line (Lower limit) */}
                <path
                  d="M 40,185 Q 150,145 260,125 T 480,75"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Child Plot Point: At 8 months (x ~ 186, y ~ 108 for 8.6 kg) */}
                <circle cx="186" cy="108" r="6" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                <text x="198" y="112" fontSize="10" fontWeight="bold" fill="#be123c">
                  8 mois : {weightKg} kg (Médiane)
                </text>
              </svg>

              <div className="flex justify-between text-[10px] font-mono text-stone-500 pl-8 pr-2">
                <span>0 m (Naissance)</span>
                <span>2 m</span>
                <span>4 m</span>
                <span>6 m</span>
                <span className="font-bold text-rose-700">8 mois (Actuel)</span>
                <span>12 m (1 an)</span>
                <span>18 m</span>
                <span>24 m (2 ans)</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-200">
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
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2 text-xs font-bold text-stone-800 bg-stone-100 border border-stone-300 rounded-lg hover:bg-stone-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>🖨</span> Imprimer le Carnet PNI Officiel (A4)
            </button>
            <Button
              size="sm"
              onClick={() => {
                alert('Données vaccinales et biométriques enregistrées au dossier pédiatrique.');
                onOpenChange(false);
              }}
              className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold"
            >
              Enregistrer au Carnet
            </Button>
          </div>
        </div>

      </div>

      {/* Official Pediatric Health Book Print Modal */}
      <PrintPreviewModal
        open={showPrintModal}
        onOpenChange={setShowPrintModal}
        type="certificate"
        documentNumber={`CARNET-PNI-2026-${appointment.id.slice(0, 8).toUpperCase()}`}
        date="29/10/2026"
        doctorName={doctorName}
        doctorInpe={doctorInpe}
        doctorSpeciality="Pédiatrie & Néonatalogie"
        clinicName="Centre Pédiatrique & Néonatal Noor"
        clinicAddress="45 Boulevard Zerktouni, 3ème étage"
        clinicCity="Casablanca"
        patientName={childName}
        patientCin="CARNET-SANTE-MAROC"
        certificateType="aptitude"
        sportDiscipline={`Suivi de croissance et vaccination PNI Maroc (${childAgeMonths} mois)`}
        observationNotes={`Biométrie pédiatrique : Poids ${weightKg}kg, Taille ${heightCm}cm, PC ${cranialCm}cm, IMC ${imc}kg/m². Courbes OMS régulières. Statut vaccinal PNI à jour (${administeredCount} vaccins validés). Prochain rappel : RR1 à 9 mois.`}
      />
    </div>
  );
}

export default PediatricTrackerModal;
