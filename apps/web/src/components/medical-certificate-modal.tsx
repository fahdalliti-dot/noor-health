'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { DateTime } from 'luxon';
import type { Appointment } from '@/hooks/use-agenda';

export type CertificateType = 'repos' | 'aptitude' | 'coups';

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

export function MedicalCertificateModal({
  open,
  onOpenChange,
  appointment,
  doctorName = 'Dr. Amine Benali',
  doctorInpe = '104829384',
  doctorSpeciality = 'Cardiologie & Maladies Vasculaires',
  clinicAddress = '45 Bd Zerktouni, 3ème étage, Casablanca',
  timezone = 'Africa/Casablanca',
}: Props) {
  const [certType, setCertType] = useState<CertificateType>('repos');
  const [restDays, setRestDays] = useState(3);
  const [restDaysWords, setRestDaysWords] = useState('trois');
  const [ittDays, setIttDays] = useState(15);
  const [sportDiscipline, setSportDiscipline] = useState('Football et activités sportives générales');
  const [observationNotes, setObservationNotes] = useState('État fébrile avec asthénie intense nécessitant du repos au lit.');

  if (!open || !appointment) return null;

  const todayStr = DateTime.now().setZone(timezone).toFormat('dd/MM/yyyy');
  const patientFullName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Patient';

  const patientCin = appointment.patient?.cin || 'BE•••••2';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl border border-slate-200 max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-terracotta-100 text-terracotta-600 flex items-center justify-center text-lg font-bold">
              📜
            </span>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Générateur de Certificats Médicaux Officiels (Maroc)
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Patient : {patientFullName} (CIN : {patientCin}) • {doctorName}
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

        {/* Certificate Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setCertType('repos')}
            className={`p-2.5 rounded-lg border text-xs text-left cursor-pointer transition ${
              certType === 'repos'
                ? 'bg-terracotta-50/80 border-terracotta-600 font-bold text-terracotta-600'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="font-semibold">🛌 Repos Médical (Arrêt)</div>
            <div className="text-[10px] text-slate-500 font-normal">Arrêt de travail ou scolaire</div>
          </button>

          <button
            type="button"
            onClick={() => setCertType('aptitude')}
            className={`p-2.5 rounded-lg border text-xs text-left cursor-pointer transition ${
              certType === 'aptitude'
                ? 'bg-terracotta-50/80 border-terracotta-600 font-bold text-terracotta-600'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="font-semibold">🏃 Aptitude Physique</div>
            <div className="text-[10px] text-slate-500 font-normal">Sport, embauche ou concours</div>
          </button>

          <button
            type="button"
            onClick={() => setCertType('coups')}
            className={`p-2.5 rounded-lg border text-xs text-left cursor-pointer transition ${
              certType === 'coups'
                ? 'bg-terracotta-50/80 border-terracotta-600 font-bold text-terracotta-600'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="font-semibold">⚖️ Constatation / ITT</div>
            <div className="text-[10px] text-slate-500 font-normal">Coups et blessures (Justice)</div>
          </button>
        </div>

        {/* Form specific settings */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
          {certType === 'repos' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Nombre de jours de repos :</label>
                <input
                  type="number"
                  value={restDays}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRestDays(val);
                    const words = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'quinze', 'vingt', 'trente'];
                    setRestDaysWords(words[val] || `${val}`);
                  }}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Motif / Constatation clinique :</label>
                <input
                  type="text"
                  value={observationNotes}
                  onChange={(e) => setObservationNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 focus:outline-none"
                />
              </div>
            </div>
          )}

          {certType === 'aptitude' && (
            <div>
              <label className="font-medium text-slate-700 block mb-1">Discipline sportive ou activité :</label>
              <input
                type="text"
                value={sportDiscipline}
                onChange={(e) => setSportDiscipline(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 focus:outline-none"
              />
            </div>
          )}

          {certType === 'coups' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Durée d&apos;Incapacité Totale Temporaire (ITT) :</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ittDays}
                    onChange={(e) => setIttDays(Number(e.target.value))}
                    className="w-24 bg-white border border-slate-300 rounded p-1.5 focus:outline-none"
                  />
                  <span className="font-medium text-slate-700">jours (sauf complications)</span>
                </div>
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Description des lésions :</label>
                <input
                  type="text"
                  value={observationNotes}
                  onChange={(e) => setObservationNotes(e.target.value)}
                  placeholder="Ecchymoses péri-orbitaires, dermabrasions..."
                  className="w-full bg-white border border-slate-300 rounded p-1.5 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Printable Official Document Preview */}
        <div className="border-2 border-slate-900 p-6 rounded-xl bg-white space-y-4 text-xs font-serif leading-relaxed">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start font-sans">
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">{doctorName}</h3>
              <p className="text-[11px] text-slate-600 font-medium">{doctorSpeciality}</p>
              <p className="text-[10px] text-slate-500 font-mono">INPE : {doctorInpe} • CNOM Casablanca</p>
              <p className="text-[10px] text-slate-500">{clinicAddress}</p>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-600">
              Casablanca, le {todayStr}
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 underline underline-offset-4">
              {certType === 'repos' && 'Certificat Médical de Repos'}
              {certType === 'aptitude' && 'Certificat Médical d\'Aptitude Physique'}
              {certType === 'coups' && 'Certificat Médical Initial de Coups et Blessures'}
            </h2>
          </div>

          {/* Body Text */}
          <div className="py-2 space-y-3 text-[13px] text-slate-800">
            <p>
              Je soussigné, <strong>{doctorName}</strong>, Docteur en Médecine, certifie avoir examiné ce jour :
            </p>

            <div className="ps-4 border-l-2 border-slate-300 space-y-1 font-sans text-xs">
              <div>Nom et Prénom : <strong className="text-slate-900">{patientFullName}</strong></div>
              <div>Titulaire de la CIN N° : <strong className="font-mono text-slate-900">{patientCin}</strong></div>
            </div>

            {certType === 'repos' && (
              <p className="leading-relaxed">
                Et atteste que son état de santé nécessite un repos médical et un arrêt de travail de{' '}
                <strong>{restDays} ({restDaysWords}) jours</strong>, sauf complications ultérieures, à compter de ce jour.
              </p>
            )}

            {certType === 'aptitude' && (
              <p className="leading-relaxed">
                Et atteste que l&apos;examen clinique et cardiovasculaire réalisé ce jour ne révèle aucune contre-indication apparente à la pratique de : <strong>{sportDiscipline}</strong>.
              </p>
            )}

            {certType === 'coups' && (
              <p className="leading-relaxed">
                Et constate la présence de lésions traumatiques récentes : <em>{observationNotes}</em>.
                Ces lésions entraînent, sous réserve de complications ultérieures, une Incapacité Totale Temporaire (ITT) de travail de <strong>{ittDays} jours</strong>.
              </p>
            )}

            <p className="text-[11px] text-slate-500 italic pt-2">
              Certificat délivré à l&apos;intéressé(e) en mains propres pour servir et valoir ce que de droit.
            </p>
          </div>

          {/* Signature Box */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-end font-sans">
            <div className="text-[10px] text-slate-400 font-mono">
              Référence : CERT-2026-{Math.floor(10000 + Math.random() * 90000)}
            </div>
            <div className="border border-dashed border-slate-400 p-3 rounded w-44 text-center text-[11px] text-slate-600 font-mono">
              Cachet & Signature
              <div className="h-10 flex items-center justify-center font-bold text-slate-800 text-xs">
                [ {doctorName} ]
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
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
              <span>🖨</span> Imprimer le Certificat
            </button>
            <Button
              size="sm"
              onClick={() => {
                alert('Certificat médical consigné et délivré avec succès.');
                onOpenChange(false);
              }}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold"
            >
              Archiver au Dossier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicalCertificateModal;
