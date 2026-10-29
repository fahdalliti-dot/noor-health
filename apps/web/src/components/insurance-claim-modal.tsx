'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { DateTime } from 'luxon';
import type { Appointment } from '@/hooks/use-agenda';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  doctorName?: string;
  doctorInpe?: string;
  doctorSpeciality?: string;
  clinicAddress?: string;
  timezone?: string;
}

export function InsuranceClaimModal({
  open,
  onOpenChange,
  appointment,
  doctorName = 'Dr. Amine Benali',
  doctorInpe = '104829384',
  doctorSpeciality = 'Cardiologie & Maladies Vasculaires',
  clinicAddress = '45 Bd Zerktouni, Casablanca',
  timezone = 'Africa/Casablanca',
}: Props) {
  const [organism, setOrganism] = useState<'cnss' | 'cnops' | 'private'>('cnss');
  const [immatriculation, setImmatriculation] = useState('198273910');
  const [cotation, setCotation] = useState('CS (Consultation Spécialiste)');
  const [tariff, setTariff] = useState(350);
  const [paid, setPaid] = useState(true);

  if (!open || !appointment) return null;

  const todayStr = DateTime.now().setZone(timezone).toFormat('dd/MM/yyyy');
  const patientFullName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Patient';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl border border-slate-200 max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
              📑
            </span>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Feuille de Soins & Prise en Charge Mutuelle (AMO Maroc)
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Patient : {patientFullName} • CIN : {appointment.patient?.cin || 'BE•••••2'}
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

        {/* Form controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="font-medium text-slate-700 block mb-1">Organisme Payeur :</label>
            <select
              value={organism}
              onChange={(e) => setOrganism(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded p-1.5 focus:outline-none"
            >
              <option value="cnss">CNSS — AMO Salariés / TNS</option>
              <option value="cnops">CNOPS — AMO Secteur Public</option>
              <option value="private">Assurance Privée (RMA, Saham, Wafa)</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">N° Immatriculation AMO :</label>
            <input
              type="text"
              value={immatriculation}
              onChange={(e) => setImmatriculation(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">Montant Acte (DH) :</label>
            <input
              type="number"
              value={tariff}
              onChange={(e) => setTariff(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* Moroccan Official Feuille de Soins Simulation */}
        <div className="border-2 border-slate-800 p-5 rounded-lg bg-white space-y-4 font-sans text-xs">
          {/* Header row */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Royaume du Maroc — Assurance Maladie Obligatoire
              </div>
              <h3 className="font-bold text-sm text-slate-900 uppercase">
                Feuille de Soins / Déclaration de Consultation
              </h3>
              <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                Organisme : {organism === 'cnss' ? 'CNSS (Caisse Nationale de Sécurité Sociale)' : organism === 'cnops' ? 'CNOPS' : 'Compagnie d\'Assurance Complémentaire'}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs border border-slate-300 px-2 py-1 rounded bg-slate-50">
                Réf: FS-2026-{Math.floor(100000 + Math.random() * 900000)}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">Date : {todayStr}</p>
            </div>
          </div>

          {/* 2-column details: Doctor & Beneficiary */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Partie 1 : Praticien Traitant
              </span>
              <div className="font-bold text-slate-900">{doctorName}</div>
              <div className="text-slate-600">{doctorSpeciality}</div>
              <div className="font-mono text-[11px] text-slate-700">INPE : {doctorInpe}</div>
              <div className="text-[10px] text-slate-500">{clinicAddress}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Partie 2 : Assuré(e) Bénéficiaire
              </span>
              <div className="font-bold text-slate-900">{patientFullName}</div>
              <div className="font-mono text-[11px] text-slate-700">
                CIN : {appointment.patient?.cin || 'BE•••••2'}
              </div>
              <div className="font-mono text-[11px] text-slate-700">
                N° Immatriculation : {immatriculation}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">Droits AMO : Vérifiés / Actifs</div>
            </div>
          </div>

          {/* Act breakdown */}
          <div>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2 border-b border-r">Date de l&apos;acte</th>
                  <th className="p-2 border-b border-r">Désignation de l&apos;acte médical</th>
                  <th className="p-2 border-b border-r">Cotation</th>
                  <th className="p-2 border-b text-right">Montant Honoraires</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border-r font-mono">{todayStr}</td>
                  <td className="p-2 border-r">Consultation spécialisée avec bilan clinique</td>
                  <td className="p-2 border-r font-mono">{cotation}</td>
                  <td className="p-2 text-right font-mono font-bold">{tariff} DH</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Stamps & Signatures */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="border border-dashed border-slate-300 p-3 rounded text-center text-[11px] text-slate-500">
              Signature de l&apos;assuré(e)
              <div className="h-10"></div>
            </div>
            <div className="border border-dashed border-slate-300 p-3 rounded text-center text-[11px] text-slate-500 font-mono">
              Cachet & Signature du Médecin (INPE: {doctorInpe})
              <div className="h-10 flex items-center justify-center font-bold text-slate-800">
                [ Cachet Officiel ]
              </div>
            </div>
          </div>
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
              className="px-3.5 py-1.5 text-xs text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨</span> Imprimer la Feuille de Soins
            </button>
            <Button
              size="sm"
              onClick={() => {
                alert('Feuille de soins émise et archivée pour la mutuelle.');
                onOpenChange(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Délivrer au Patient
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InsuranceClaimModal;
