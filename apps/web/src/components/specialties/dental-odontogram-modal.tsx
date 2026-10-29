'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/button';
import { PrintPreviewModal } from '@/components/print/print-preview-modal';
import type { Appointment } from '@/hooks/use-agenda';

export type ToothStatus = 'healthy' | 'cavity' | 'restored' | 'endo' | 'crown' | 'implant' | 'missing';

export interface ToothData {
  number: number;
  status: ToothStatus;
  note?: string;
  procedure?: string;
  costMad?: number;
}

const DEFAULT_ADULT_TEETH: ToothData[] = [
  // Quadrant 1 (Maxillaire Droit: 18 - 11)
  { number: 18, status: 'missing' },
  { number: 17, status: 'restored', procedure: 'Obturation composite 3 faces', costMad: 450 },
  { number: 16, status: 'crown', procedure: 'Couronne céramo-zircone', costMad: 2500 },
  { number: 15, status: 'healthy' },
  { number: 14, status: 'cavity', procedure: 'Traitement de carie mésiale', costMad: 400 },
  { number: 13, status: 'healthy' },
  { number: 12, status: 'healthy' },
  { number: 11, status: 'healthy' },

  // Quadrant 2 (Maxillaire Gauche: 21 - 28)
  { number: 21, status: 'healthy' },
  { number: 22, status: 'healthy' },
  { number: 23, status: 'healthy' },
  { number: 24, status: 'healthy' },
  { number: 25, status: 'endo', procedure: 'Traitement canalaire biradiculé', costMad: 800 },
  { number: 26, status: 'implant', procedure: 'Implant titane ostéo-intégré', costMad: 6500 },
  { number: 27, status: 'healthy' },
  { number: 28, status: 'missing' },

  // Quadrant 4 (Mandibulaire Droit: 48 - 41)
  { number: 48, status: 'missing' },
  { number: 47, status: 'healthy' },
  { number: 46, status: 'restored', procedure: 'Composite occlusal', costMad: 350 },
  { number: 45, status: 'healthy' },
  { number: 44, status: 'healthy' },
  { number: 43, status: 'healthy' },
  { number: 42, status: 'healthy' },
  { number: 41, status: 'healthy' },

  // Quadrant 3 (Mandibulaire Gauche: 31 - 38)
  { number: 31, status: 'healthy' },
  { number: 32, status: 'healthy' },
  { number: 33, status: 'healthy' },
  { number: 34, status: 'healthy' },
  { number: 35, status: 'cavity', procedure: 'Carie cervicale débutante', costMad: 350 },
  { number: 36, status: 'endo', procedure: 'Dévitalisation molaire', costMad: 900 },
  { number: 37, status: 'healthy' },
  { number: 38, status: 'missing' },
];

const STATUS_METADATA: Record<ToothStatus, { label: string; color: string; border: string; bg: string }> = {
  healthy: { label: 'Saine', color: 'text-stone-700', border: 'border-stone-300', bg: 'bg-white' },
  cavity: { label: 'Carie active', color: 'text-red-700', border: 'border-red-400', bg: 'bg-red-500' },
  restored: { label: 'Obturation / Composite', color: 'text-blue-700', border: 'border-blue-400', bg: 'bg-blue-500' },
  endo: { label: 'Dévitalisée (Endo)', color: 'text-purple-700', border: 'border-purple-400', bg: 'bg-purple-600' },
  crown: { label: 'Couronne / Prothèse', color: 'text-amber-700', border: 'border-amber-400', bg: 'bg-amber-500' },
  implant: { label: 'Implant', color: 'text-emerald-700', border: 'border-emerald-400', bg: 'bg-emerald-600' },
  missing: { label: 'Absente / Extraite', color: 'text-stone-400', border: 'border-stone-300', bg: 'bg-stone-200' },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  doctorName?: string;
  doctorInpe?: string;
}

export function DentalOdontogramModal({
  open,
  onOpenChange,
  appointment,
  doctorName = 'Dr. Karim Tazi',
  doctorInpe = '108492019',
}: Props) {
  const [teeth, setTeeth] = useState<ToothData[]>(DEFAULT_ADULT_TEETH);
  const [selectedToothNum, setSelectedToothNum] = useState<number | null>(16);
  const [activePalette, setActivePalette] = useState<ToothStatus>('cavity');
  const [showPrintModal, setShowPrintModal] = useState(false);

  if (!open || !appointment) return null;

  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Patient';

  const selectedTooth = teeth.find((t) => t.number === selectedToothNum);

  const applyStatusToSelected = (status: ToothStatus) => {
    if (!selectedToothNum) return;
    setTeeth((prev) =>
      prev.map((t) => (t.number === selectedToothNum ? { ...t, status } : t))
    );
  };

  const handleToothClick = (num: number) => {
    setSelectedToothNum(num);
  };

  // Calculate quote totals
  const treatmentsWithCost = teeth.filter((t) => t.procedure && t.costMad && t.costMad > 0);
  const totalDevisMad = treatmentsWithCost.reduce((sum, t) => sum + (t.costMad || 0), 0);

  // Group teeth into quadrants
  const q1 = teeth.filter((t) => t.number >= 11 && t.number <= 18).reverse(); // 18 -> 11
  const q2 = teeth.filter((t) => t.number >= 21 && t.number <= 28);           // 21 -> 28
  const q4 = teeth.filter((t) => t.number >= 41 && t.number <= 48).reverse(); // 48 -> 41
  const q3 = teeth.filter((t) => t.number >= 31 && t.number <= 38);           // 31 -> 38

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-5xl w-full p-6 space-y-6 shadow-2xl max-h-[94vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-bold">
              🦷
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-stone-900">
                  Schéma Dentaire & Odontogramme Officiel (FDI / ISO 3950)
                </h2>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded font-mono">
                  Dentisterie & Odontologie
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono">
                Patient : <span className="font-semibold text-stone-800">{patientName}</span> • Praticien : {doctorName} (INPE : {doctorInpe})
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

        {/* Legend & Action Palette */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="font-bold text-stone-700 text-[11px] uppercase tracking-wider font-mono">
            Palette d&apos;États Cliniques :
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(Object.keys(STATUS_METADATA) as ToothStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setActivePalette(st);
                  applyStatusToSelected(st);
                }}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                  activePalette === st
                    ? 'ring-2 ring-blue-500 ring-offset-1 bg-white shadow-2xs font-bold'
                    : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_METADATA[st].bg}`}></span>
                <span>{STATUS_METADATA[st].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2D Interactive Odontogram FDI Canvas */}
        <div className="p-6 bg-radial from-stone-50 to-stone-100/90 rounded-2xl border border-stone-200 space-y-6 text-center select-none">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-widest font-mono">
            MAXILLAIRE SUPÉRIEUR (HAUT)
          </div>

          {/* Upper Arch (Q1 & Q2) */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            {/* Quadrant 1 (18 to 11) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {q1.map((tooth) => {
                const isSelected = selectedToothNum === tooth.number;
                return (
                  <button
                    key={tooth.number}
                    type="button"
                    onClick={() => handleToothClick(tooth.number)}
                    className={`relative w-8 sm:w-10 h-14 sm:h-16 rounded-xl border flex flex-col items-center justify-between p-1 transition-all ${
                      isSelected
                        ? 'ring-2 ring-terracotta-600 ring-offset-2 bg-white shadow-md scale-105 z-10'
                        : 'bg-white hover:bg-stone-50 border-stone-300'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold text-stone-500">
                      {tooth.number}
                    </span>
                    {/* Visual Tooth Representation */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        STATUS_METADATA[tooth.status].bg
                      } ${tooth.status === 'healthy' ? 'border border-stone-300' : 'text-white'}`}
                    >
                      {tooth.status === 'missing' ? '✕' : ''}
                    </div>
                    <span className="text-[8px] font-semibold truncate w-full text-center">
                      {STATUS_METADATA[tooth.status].label.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="h-12 w-px bg-stone-300 hidden sm:block"></div>

            {/* Quadrant 2 (21 to 28) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {q2.map((tooth) => {
                const isSelected = selectedToothNum === tooth.number;
                return (
                  <button
                    key={tooth.number}
                    type="button"
                    onClick={() => handleToothClick(tooth.number)}
                    className={`relative w-8 sm:w-10 h-14 sm:h-16 rounded-xl border flex flex-col items-center justify-between p-1 transition-all ${
                      isSelected
                        ? 'ring-2 ring-terracotta-600 ring-offset-2 bg-white shadow-md scale-105 z-10'
                        : 'bg-white hover:bg-stone-50 border-stone-300'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold text-stone-500">
                      {tooth.number}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        STATUS_METADATA[tooth.status].bg
                      } ${tooth.status === 'healthy' ? 'border border-stone-300' : 'text-white'}`}
                    >
                      {tooth.status === 'missing' ? '✕' : ''}
                    </div>
                    <span className="text-[8px] font-semibold truncate w-full text-center">
                      {STATUS_METADATA[tooth.status].label.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-48 h-px bg-stone-300 mx-auto"></div>

          {/* Lower Arch (Q4 & Q3) */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            {/* Quadrant 4 (48 to 41) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {q4.map((tooth) => {
                const isSelected = selectedToothNum === tooth.number;
                return (
                  <button
                    key={tooth.number}
                    type="button"
                    onClick={() => handleToothClick(tooth.number)}
                    className={`relative w-8 sm:w-10 h-14 sm:h-16 rounded-xl border flex flex-col items-center justify-between p-1 transition-all ${
                      isSelected
                        ? 'ring-2 ring-terracotta-600 ring-offset-2 bg-white shadow-md scale-105 z-10'
                        : 'bg-white hover:bg-stone-50 border-stone-300'
                    }`}
                  >
                    <span className="text-[8px] font-semibold truncate w-full text-center">
                      {STATUS_METADATA[tooth.status].label.slice(0, 3)}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        STATUS_METADATA[tooth.status].bg
                      } ${tooth.status === 'healthy' ? 'border border-stone-300' : 'text-white'}`}
                    >
                      {tooth.status === 'missing' ? '✕' : ''}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-stone-500">
                      {tooth.number}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="h-12 w-px bg-stone-300 hidden sm:block"></div>

            {/* Quadrant 3 (31 to 38) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {q3.map((tooth) => {
                const isSelected = selectedToothNum === tooth.number;
                return (
                  <button
                    key={tooth.number}
                    type="button"
                    onClick={() => handleToothClick(tooth.number)}
                    className={`relative w-8 sm:w-10 h-14 sm:h-16 rounded-xl border flex flex-col items-center justify-between p-1 transition-all ${
                      isSelected
                        ? 'ring-2 ring-terracotta-600 ring-offset-2 bg-white shadow-md scale-105 z-10'
                        : 'bg-white hover:bg-stone-50 border-stone-300'
                    }`}
                  >
                    <span className="text-[8px] font-semibold truncate w-full text-center">
                      {STATUS_METADATA[tooth.status].label.slice(0, 3)}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        STATUS_METADATA[tooth.status].bg
                      } ${tooth.status === 'healthy' ? 'border border-stone-300' : 'text-white'}`}
                    >
                      {tooth.status === 'missing' ? '✕' : ''}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-stone-500">
                      {tooth.number}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-widest font-mono">
            MANDIBULE INFÉRIEURE (BAS)
          </div>
        </div>

        {/* Selected Tooth Detail & Procedure Quote */}
        {selectedTooth && (
          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-terracotta-100 text-terracotta-800 font-bold font-mono text-xs flex items-center justify-center">
                  #{selectedTooth.number}
                </span>
                <span className="font-bold text-sm text-stone-900">
                  Dent {selectedTooth.number} : {STATUS_METADATA[selectedTooth.status].label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {(Object.keys(STATUS_METADATA) as ToothStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => applyStatusToSelected(st)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                      selectedTooth.status === st
                        ? 'bg-stone-900 text-white'
                        : 'bg-white text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {STATUS_METADATA[st].label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block mb-1">
                  Acte clinique / Traitement prescrit
                </label>
                <input
                  type="text"
                  value={selectedTooth.procedure || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTeeth((prev) =>
                      prev.map((t) => (t.number === selectedTooth.number ? { ...t, procedure: val } : t))
                    );
                  }}
                  placeholder="Ex: Composite 3 faces, Endo molaire, Couronne zircone..."
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium focus:outline-terracotta-600"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block mb-1">
                  Honoraires prévus (DH)
                </label>
                <input
                  type="number"
                  value={selectedTooth.costMad || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTeeth((prev) =>
                      prev.map((t) => (t.number === selectedTooth.number ? { ...t, costMad: val } : t))
                    );
                  }}
                  placeholder="Ex: 450"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold focus:outline-terracotta-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Treatment Plan & Quote Ledger */}
        <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider font-mono">
              Plan de Traitement & Devis Chiffré ({treatmentsWithCost.length} actes prévus)
            </span>
            <div className="text-right">
              <span className="text-xs text-stone-500 mr-2">Total Devis :</span>
              <span className="text-base font-extrabold font-mono text-terracotta-700">
                {totalDevisMad.toLocaleString()} DH
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-mono text-stone-500">
                <tr>
                  <th className="p-2">N° Dent</th>
                  <th className="p-2">Diagnostic</th>
                  <th className="p-2">Traitement Programmé</th>
                  <th className="p-2 text-right">Montant (DH)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {treatmentsWithCost.map((t) => (
                  <tr key={t.number}>
                    <td className="p-2 font-mono font-bold text-stone-900">Dent #{t.number}</td>
                    <td className="p-2 font-medium text-stone-700">{STATUS_METADATA[t.status].label}</td>
                    <td className="p-2 font-semibold text-stone-900">{t.procedure}</td>
                    <td className="p-2 text-right font-mono font-bold text-terracotta-700">{t.costMad} DH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
              <span>🖨</span> Imprimer le Devis Dentaire Officiel (A4)
            </button>
            <Button
              size="sm"
              onClick={() => {
                alert('Schéma dentaire et devis enregistrés avec succès au dossier médical.');
                onOpenChange(false);
              }}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold"
            >
              Enregistrer l&apos;Odontogramme
            </Button>
          </div>
        </div>

      </div>

      {/* Official Dental Quote Print Modal */}
      <PrintPreviewModal
        open={showPrintModal}
        onOpenChange={setShowPrintModal}
        type="amo_claim"
        documentNumber={`DEVIS-DENT-2026-${appointment.id.slice(0, 8).toUpperCase()}`}
        date="29/10/2026"
        doctorName={doctorName}
        doctorInpe={doctorInpe}
        doctorSpeciality="Chirurgie Dentaire & Implantologie"
        clinicName="Cabinet de Chirurgie Dentaire Noor"
        clinicAddress="45 Boulevard Zerktouni, 3ème étage"
        clinicCity="Casablanca"
        patientName={patientName}
        patientCin={appointment.patient?.cin || 'BE849201'}
        patientAmoNumber="CNSS-DENTAIRE-01"
        organism="cnss"
        cotationNgap={`Plan de traitement odontologique complet (${treatmentsWithCost.length} actes)`}
        tariffMad={totalDevisMad}
        paymentMethod="Devis prévisionnel échelonné"
      />
    </div>
  );
}
