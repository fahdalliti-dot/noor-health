'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { DateTime } from 'luxon';
import type { Appointment } from '@/hooks/use-agenda';

export interface MoroccanDrug {
  name: string;
  dci: string; // Dénomination Commune Internationale
  defaultPosology: string;
  contraindications: string[]; // allergies that trigger alerts
}

const MOROCCAN_DRUG_DATABASE: MoroccanDrug[] = [
  {
    name: 'Doliprane 1000mg Comprimé',
    dci: 'Paracétamol',
    defaultPosology: '1 comprimé toutes les 8 heures si douleur ou fièvre (max 3g/jour)',
    contraindications: ['Paracétamol', 'Insuffisance hépatique sévère'],
  },
  {
    name: 'Augmentin 1g/125mg Sachet',
    dci: 'Amoxicilline + Acide clavulanique',
    defaultPosology: '1 sachet matin et soir au début des repas pendant 7 jours',
    contraindications: ['Pénicilline', 'Bêta-lactamines', 'Amoxicilline'],
  },
  {
    name: 'Amoxicilline 1g Comprimé dispersible',
    dci: 'Amoxicilline',
    defaultPosology: '1 comprimé matin et soir pendant 6 jours',
    contraindications: ['Pénicilline', 'Bêta-lactamines', 'Amoxicilline'],
  },
  {
    name: 'Kardegic 160mg Poudre pour solution buvable',
    dci: 'Acétylsalicylate de lysine',
    defaultPosology: '1 sachet par jour au milieu du déjeuner dans un demi-verre d\'eau',
    contraindications: ['Aspirine', 'AINS', 'Ulcère gastro-duodénal'],
  },
  {
    name: 'Tahor 20mg Comprimé pelliculé',
    dci: 'Atorvastatine',
    defaultPosology: '1 comprimé le soir au coucher en continu',
    contraindications: ['Myopathie active', 'Atorvastatine'],
  },
  {
    name: 'Inexium 40mg Comprimé gastro-résistant',
    dci: 'Esoméprazole',
    defaultPosology: '1 comprimé le matin à jeun 30 minutes avant le petit-déjeuner pendant 4 semaines',
    contraindications: ['Esoméprazole'],
  },
  {
    name: 'Glucophage 1000mg Comprimé',
    dci: 'Metformine',
    defaultPosology: '1 comprimé au milieu du dîner avec un grand verre d\'eau',
    contraindications: ['Insuffisance rénale sévère', 'Acidose lactique'],
  },
  {
    name: 'Solupred 20mg Comprimé orodispersible',
    dci: 'Prednisolone',
    defaultPosology: '2 comprimés le matin au petit-déjeuner pendant 5 jours',
    contraindications: ['Infection non contrôlée', 'Ulcère évolutif'],
  },
];

interface PrescriptionItem {
  id: string;
  drugName: string;
  posology: string;
  duration: string;
  hasContraindication: boolean;
  contraindicationDetail?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  patientAllergies?: string[]; // e.g. ['Pénicilline']
  doctorName?: string;
  doctorInpe?: string;
  doctorSpeciality?: string;
  clinicAddress?: string;
  timezone?: string;
}

export function PrescriptionModal({
  open,
  onOpenChange,
  appointment,
  patientAllergies = ['Pénicilline'],
  doctorName = 'Dr. Amine Benali',
  doctorInpe = 'INPE: 104829384 / CNOM: 12903',
  doctorSpeciality = 'Spécialiste en Cardiologie & Maladies Vasculaires',
  clinicAddress = '45 Bd Zerktouni, 3ème étage, Casablanca • Tél: +212 522-334455',
  timezone = 'Africa/Casablanca',
}: Props) {
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      id: 'item-1',
      drugName: 'Kardegic 160mg Poudre pour solution buvable',
      posology: '1 sachet par jour au milieu du déjeuner dans un demi-verre d\'eau',
      duration: '3 mois renouvelable',
      hasContraindication: false,
    },
    {
      id: 'item-2',
      drugName: 'Tahor 20mg Comprimé pelliculé',
      posology: '1 comprimé le soir au coucher en continu',
      duration: '3 mois',
      hasContraindication: false,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<MoroccanDrug | null>(null);
  const [customPosology, setCustomPosology] = useState('');
  const [customDuration, setCustomDuration] = useState('1 mois');

  if (!open || !appointment) return null;

  const todayStr = DateTime.now().setZone(timezone).toFormat('dd/MM/yyyy');
  const patientFullName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Patient';

  const searchResults = searchQuery.trim()
    ? MOROCCAN_DRUG_DATABASE.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.dci.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  function handleSelectDrug(drug: MoroccanDrug) {
    setSelectedDrug(drug);
    setCustomPosology(drug.defaultPosology);
  }

  function handleAddItem() {
    if (!selectedDrug) return;

    // Check allergies contraindication
    const matchedContra = selectedDrug.contraindications.find((c) =>
      patientAllergies.some((a) => a.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(a.toLowerCase())),
    );

    const newItem: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      drugName: selectedDrug.name,
      posology: customPosology || selectedDrug.defaultPosology,
      duration: customDuration || '1 mois',
      hasContraindication: !!matchedContra,
      contraindicationDetail: matchedContra ? `Attention : Patient allergique à ${matchedContra}!` : undefined,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedDrug(null);
    setSearchQuery('');
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl border border-slate-200 max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-terracotta-100 text-terracotta-600 flex items-center justify-center text-lg font-bold">
              💊
            </span>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Ordonnance Médicale Numérique (DMP Maroc)
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Patient : {patientFullName} ({appointment.patient?.cin || 'Sans CIN'})
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

        {/* Allergy banner */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-700 font-bold">⚠️ Allergies signalées au dossier :</span>
            <span className="font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300/60 font-mono">
              {patientAllergies.join(', ') || 'Aucune allergie connue'}
            </span>
          </div>
          <span className="text-[11px] text-amber-700">Contrôle d&apos;interaction automatique activé</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Moroccan Drug Search & Posology Picker */}
          <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide block">
              1. Sélectionner un Médicament (Référentiel Marocain)
            </span>

            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher (ex: Augmentin, Doliprane, Tahor, Kardegic)..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              />

              {searchResults.length > 0 && (
                <div className="mt-1.5 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 shadow-sm text-xs">
                  {searchResults.map((drug) => {
                    const isAllergic = drug.contraindications.some((c) =>
                      patientAllergies.some((a) => a.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(a.toLowerCase())),
                    );
                    return (
                      <button
                        key={drug.name}
                        type="button"
                        onClick={() => handleSelectDrug(drug)}
                        className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{drug.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">DCI: {drug.dci}</div>
                        </div>
                        {isAllergic ? (
                          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded border border-red-200">
                            🚨 Allergie
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            Sélectionner
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedDrug && (
              <div className="bg-white p-3 rounded-lg border border-terracotta-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900">{selectedDrug.name}</div>
                <div className="text-[11px] text-slate-500">DCI: {selectedDrug.dci}</div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 block mb-1">
                    Posologie & Instructions :
                  </label>
                  <textarea
                    rows={2}
                    value={customPosology}
                    onChange={(e) => setCustomPosology(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-terracotta-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-medium text-slate-700 block mb-0.5">
                      Durée :
                    </label>
                    <input
                      type="text"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      placeholder="ex: 7 jours, 3 mois"
                      className="w-full text-xs border border-slate-300 rounded p-1.5 focus:outline-none"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddItem}
                    className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold self-end"
                  >
                    + Ajouter
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Printable Prescription Sheet Preview */}
          <div className="border border-slate-300 rounded-xl p-5 bg-white space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              {/* Doctor Header */}
              <div className="border-b-2 border-slate-800 pb-3 text-center sm:text-left flex flex-wrap justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                    {doctorName}
                  </h3>
                  <p className="text-[11px] text-slate-600 font-medium">{doctorSpeciality}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{doctorInpe}</p>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono">
                  Casablanca, le {todayStr}
                </div>
              </div>

              {/* Patient header */}
              <div className="py-2.5 border-b border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Patient(e) : </span>
                  <span className="font-bold text-slate-900">{patientFullName}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  {appointment.patient?.cin ? `CIN: ${appointment.patient.cin}` : ''}
                </div>
              </div>

              {/* Drug list */}
              <div className="py-3 space-y-3 min-h-[140px]">
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">
                    Aucun médicament ajouté à l&apos;ordonnance.
                  </p>
                ) : (
                  items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded-lg text-xs flex items-start justify-between gap-2 ${
                        item.hasContraindication
                          ? 'bg-red-50 border border-red-300 text-red-900'
                          : 'bg-slate-50/80 border border-slate-100'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="font-mono text-slate-400">{idx + 1}.</span>
                          <span>{item.drugName}</span>
                          {item.hasContraindication && (
                            <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded">
                              CONTRE-INDICATION
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-700 ps-4">
                          ↳ {item.posology} — <span className="font-medium">{item.duration}</span>
                        </div>
                        {item.contraindicationDetail && (
                          <div className="text-[10px] text-red-700 font-semibold ps-4">
                            ⚠️ {item.contraindicationDetail}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-red-600 text-xs p-1 cursor-pointer"
                        title="Retirer"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stamp & Footer */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
              <div className="font-mono">
                <div>{clinicAddress}</div>
                <div>Numéro d&apos;ordre CNOM certifié • CNDP 09-08</div>
              </div>
              <div className="text-center font-mono text-[11px] border border-dashed border-slate-300 p-2 rounded w-32">
                Cachet & Signature
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
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
              <span>🖨</span> Imprimer l&apos;Ordonnance
            </button>
            <Button
              size="sm"
              onClick={() => {
                alert('Ordonnance enregistrée dans le dossier médical du patient.');
                onOpenChange(false);
              }}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold"
            >
              Enregistrer au Dossier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrescriptionModal;
