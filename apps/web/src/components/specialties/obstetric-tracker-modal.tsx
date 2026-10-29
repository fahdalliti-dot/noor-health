'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/button';
import { PrintPreviewModal } from '@/components/print/print-preview-modal';
import type { Appointment } from '@/hooks/use-agenda';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  doctorName?: string;
  doctorInpe?: string;
}

export function ObstetricTrackerModal({
  open,
  onOpenChange,
  appointment,
  doctorName = 'Dr. Amina Bennani',
  doctorInpe = '109384721',
}: Props) {
  // Obstetric Term & Calculator State
  const [ddrDate, setDdrDate] = useState('2026-05-10'); // Last menstrual period
  const [activeTab, setActiveTab] = useState<'calc' | 't1' | 't2' | 't3' | 'maternal'>('t2');

  // Calculated Term: DDR 10/05/2026 -> currently ~24 SA + 4 jours, DPA ~17/02/2027
  const currentSa = 24;
  const currentDays = 4;
  const dpaDate = '17 Février 2027';

  // T1 Biometry & Serology
  const [t1Lcc, setT1Lcc] = useState(64); // mm
  const [t1Cn, setT1Cn] = useState(1.2);  // mm (normal < 2.5mm)
  const [t1Bpcf, setT1Bpcf] = useState(158); // bpm
  const [toxoStatus, setToxoStatus] = useState<'immune' | 'non_immune'>('non_immune');
  const [rubeoleStatus, setRubeoleStatus] = useState<'immune' | 'non_immune'>('immune');

  // T2 Morphological Ultrasound
  const [t2Bip, setT2Bip] = useState(61);   // mm (Diamètre bipariétal)
  const [t2Pc, setT2Pc] = useState(225);   // mm (Périmètre crânien)
  const [t2Pa, setT2Pa] = useState(202);   // mm (Périmètre abdominal)
  const [t2Lf, setT2Lf] = useState(44);    // mm (Longueur fémorale)
  const [t2Placenta, setT2Placenta] = useState('Postérieur, inséré haut, sans hématome');
  const [t2Liquide, setT2Liquide] = useState('Quantité normale (ILA = 14 cm)');
  const [t2Sex, setT2Sex] = useState<'Féminin' | 'Masculin' | 'Non déterminé'>('Féminin');

  // T3 Growth & Doppler
  const [t3Presentation, setT3Presentation] = useState('Céphalique');
  const [t3EpfGrammes, setT3EpfGrammes] = useState(720); // grams at 24 SA
  const [t3Doppler, setT3Doppler] = useState('Doppler ombilical satisfaisant (IP = 0.95)');

  // Maternal Vitals
  const [maternalTa, setMaternalTa] = useState('115/75 mmHg');
  const [maternalWeightKg, setMaternalWeightKg] = useState(64.5);
  const [proteinuria, setProteinuria] = useState('Négative (0 g/24h)');

  const [showPrintModal, setShowPrintModal] = useState(false);

  if (!open || !appointment) return null;

  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Patiente Gestante';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-4xl w-full p-6 space-y-6 shadow-2xl max-h-[94vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center text-xl font-bold">
              🤰
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-stone-900">
                  Suivi de Grossesse & Compte-Rendu Échographique
                </h2>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded font-mono">
                  Gynécologie & Obstétrique
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono">
                Patiente : <span className="font-semibold text-stone-800">{patientName}</span> • CIN : {appointment.patient?.cin || 'BE849201'} • Dr. {doctorName} (INPE : {doctorInpe})
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

        {/* Obstetric Gestational Term Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50/50 border border-rose-200 flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="text-[10.5px] uppercase font-bold text-rose-800 tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
              Terme Actuel de la Grossesse :
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
                {currentSa} SA + {currentDays} jours
              </span>
              <span className="text-xs font-semibold text-stone-600">
                (2ème Trimestre • 6ème mois)
              </span>
            </div>
          </div>

          <div className="text-right text-xs space-y-0.5">
            <div className="text-stone-500">
              DDR : <span className="font-bold font-mono text-stone-800">{ddrDate}</span>
            </div>
            <div className="text-stone-900 font-medium">
              Terme Prévu (DPA) : <span className="font-bold text-rose-700">{dpaDate}</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('t1')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 't1' ? 'bg-rose-600 text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            1er Trimestre (T1 - 12 SA)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('t2')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 't2' ? 'bg-rose-600 text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            2ème Trimestre Morpho (T2 - 22 SA)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('t3')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 't3' ? 'bg-rose-600 text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            3ème Trimestre & Croissance (T3 - 32 SA)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('maternal')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'maternal' ? 'bg-rose-600 text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Surveillance Maternelle
          </button>
        </div>

        {/* Tab 1: T1 Datation & Clarté Nucale */}
        {activeTab === 't1' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/60 space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Longueur Cranio-Caudale (LCC)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={t1Lcc}
                    onChange={(e) => setT1Lcc(Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded border border-stone-300 font-mono font-bold"
                  />
                  <span className="font-mono text-stone-600">mm (12 SA+4j)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/60 space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Clarté Nucale (CN)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={t1Cn}
                    onChange={(e) => setT1Cn(Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded border border-stone-300 font-mono font-bold text-emerald-700"
                  />
                  <span className="font-mono text-emerald-700 font-semibold">mm (Normale &lt; 2.5)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/60 space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Rythme Cardiaque (BPCF)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={t1Bpcf}
                    onChange={(e) => setT1Bpcf(Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded border border-stone-300 font-mono font-bold"
                  />
                  <span className="font-mono text-stone-600">bpm (Activité régulière)</span>
                </div>
              </div>
            </div>

            {/* Sérologies Obligatoires au Maroc */}
            <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-3">
              <span className="font-bold text-stone-800 uppercase tracking-wider font-mono text-[11px] block">
                Bilan Sérologique Obligatoire (Législation Marocaine) :
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                  <div className="text-stone-500 text-[10px]">Toxoplasmose (IgG/IgM)</div>
                  <div className={`font-bold ${toxoStatus === 'non_immune' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {toxoStatus === 'non_immune' ? 'Non immunisée (contrôle mensuel)' : 'Immunisée'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                  <div className="text-stone-500 text-[10px]">Rubéole</div>
                  <div className="font-bold text-emerald-700">Immunisée (IgG positives)</div>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                  <div className="text-stone-500 text-[10px]">Syphilis (TPHA / VDRL)</div>
                  <div className="font-bold text-emerald-700">Sérologie Négative</div>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                  <div className="text-stone-500 text-[10px]">Groupage Sanguin & Rhésus</div>
                  <div className="font-bold text-stone-900 font-mono">A Positif (A+)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: T2 Morphological Ultrasound */}
        {activeTab === 't2' && (
          <div className="space-y-4 text-xs">
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/70 space-y-3">
              <span className="font-bold text-stone-800 uppercase tracking-wider font-mono text-[11px] block">
                Biométrie Fœtale T2 (22 - 24 SA) :
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                  <div className="text-[10px] text-stone-500">Diamètre Bipariétal (BIP)</div>
                  <div className="text-sm font-bold font-mono text-stone-900">{t2Bip} mm</div>
                  <div className="text-[9px] text-emerald-600 font-semibold">50ème percentile</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                  <div className="text-[10px] text-stone-500">Périmètre Crânien (PC)</div>
                  <div className="text-sm font-bold font-mono text-stone-900">{t2Pc} mm</div>
                  <div className="text-[9px] text-emerald-600 font-semibold">50ème percentile</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                  <div className="text-[10px] text-stone-500">Périmètre Abdominal (PA)</div>
                  <div className="text-sm font-bold font-mono text-stone-900">{t2Pa} mm</div>
                  <div className="text-[9px] text-emerald-600 font-semibold">48ème percentile</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                  <div className="text-[10px] text-stone-500">Longueur Fémorale (LF)</div>
                  <div className="text-sm font-bold font-mono text-stone-900">{t2Lf} mm</div>
                  <div className="text-[9px] text-emerald-600 font-semibold">52ème percentile</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-stone-200 bg-white space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Localisation Placentaire</label>
                <input
                  type="text"
                  value={t2Placenta}
                  onChange={(e) => setT2Placenta(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-stone-300 text-xs font-medium"
                />
              </div>
              <div className="p-3 rounded-lg border border-stone-200 bg-white space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Liquide Amniotique (ILA)</label>
                <input
                  type="text"
                  value={t2Liquide}
                  onChange={(e) => setT2Liquide(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-stone-300 text-xs font-medium"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-800">Morphologie d&apos;ensemble & Organes fœtaux :</span>
                <p className="text-stone-600 text-[11px] mt-0.5">
                  Cœur 4 cavités équilibrées, rachis continu, estomac et vessie visibles, membres visualisés complets.
                </p>
              </div>
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-xs shrink-0">
                Morphologie Normale ✓
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: T3 Croissance & Doppler */}
        {activeTab === 't3' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50 space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Présentation Fœtale</label>
                <input
                  type="text"
                  value={t3Presentation}
                  onChange={(e) => setT3Presentation(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-stone-300 text-xs font-bold"
                />
              </div>

              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50 space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Poids Fœtal Estimé (EPF)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={t3EpfGrammes}
                    onChange={(e) => setT3EpfGrammes(Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded border border-stone-300 font-mono font-bold text-terracotta-700"
                  />
                  <span className="font-mono text-stone-600">grammes (Hadlock)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50 space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Score Doppler Ombilical</label>
                <input
                  type="text"
                  value={t3Doppler}
                  onChange={(e) => setT3Doppler(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-stone-300 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Maternal Vitals */}
        {activeTab === 'maternal' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-stone-200 bg-white space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Pression Artérielle (TA)</label>
                <input
                  type="text"
                  value={maternalTa}
                  onChange={(e) => setMaternalTa(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-stone-300 text-xs font-mono font-bold"
                />
              </div>

              <div className="p-3 rounded-lg border border-stone-200 bg-white space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Poids Maternelle Actuel</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.5"
                    value={maternalWeightKg}
                    onChange={(e) => setMaternalWeightKg(Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded border border-stone-300 font-mono font-bold"
                  />
                  <span className="font-mono text-stone-600">kg (+6.5 kg depuis DDR)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-stone-200 bg-white space-y-1">
                <label className="text-[10.5px] font-semibold text-stone-500 uppercase block">Bandelette Urinaire (Protéinurie)</label>
                <input
                  type="text"
                  value={proteinuria}
                  onChange={(e) => setProteinuria(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-stone-300 text-xs font-medium text-emerald-700"
                />
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
              <span>🖨</span> Imprimer Compte-Rendu Échographique (A4)
            </button>
            <Button
              size="sm"
              onClick={() => {
                alert('Données obstétriques consignées dans le dossier médical.');
                onOpenChange(false);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Enregistrer le Bilan Écho
            </Button>
          </div>
        </div>

      </div>

      {/* Official Obstetric Ultrasound Report Print Modal */}
      <PrintPreviewModal
        open={showPrintModal}
        onOpenChange={setShowPrintModal}
        type="certificate"
        documentNumber={`ECHO-OBST-2026-${appointment.id.slice(0, 8).toUpperCase()}`}
        date="29/10/2026"
        doctorName={doctorName}
        doctorInpe={doctorInpe}
        doctorSpeciality="Gynécologie Médicale & Obstétrique"
        clinicName="Centre de Gynécologie & Médecine Fœtale Noor"
        clinicAddress="45 Boulevard Zerktouni, 3ème étage"
        clinicCity="Casablanca"
        patientName={patientName}
        patientCin={appointment.patient?.cin || 'BE849201'}
        certificateType="aptitude"
        sportDiscipline={`Grossesse intra-utérine évolutive de ${currentSa} SA + ${currentDays}j • DPA : ${dpaDate}`}
        observationNotes={`Échographie obstétrique T2 normale. Biométrie : BIP ${t2Bip}mm, PC ${t2Pc}mm, PA ${t2Pa}mm, LF ${t2Lf}mm. EPF : ${t3EpfGrammes}g. Placenta : ${t2Placenta}. Liquide : ${t2Liquide}. Sérologies à jour.`}
      />
    </div>
  );
}
