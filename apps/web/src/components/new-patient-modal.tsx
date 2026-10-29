'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';

export interface NewPatientFormData {
  firstName: string;
  lastName: string;
  cin: string;
  phone: string;
  birthDate: string;
  gender: 'M' | 'F';
  city: string;
  address: string;
  mutuelle: 'AMO_CNSS' | 'CNOPS' | 'SAHAM' | 'AXA' | 'RMA' | 'AUCUNE';
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  chronicConditions: string;
  allergies: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patientData: NewPatientFormData) => void;
}

export function NewPatientModal({ open, onOpenChange, onSave }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cin, setCin] = useState('');
  const [phone, setPhone] = useState('+212 6');
  const [birthDate, setBirthDate] = useState('1985-05-15');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [city, setCity] = useState('Casablanca');
  const [address, setAddress] = useState('');
  const [mutuelle, setMutuelle] = useState<NewPatientFormData['mutuelle']>('AMO_CNSS');
  const [bloodType, setBloodType] = useState<NewPatientFormData['bloodType']>('A+');
  const [chronicConditions, setChronicConditions] = useState('');
  const [allergies, setAllergies] = useState('');

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !cin.trim()) {
      alert('Veuillez renseigner au moins le Nom, Prénom et le Numéro CIN.');
      return;
    }

    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      cin: cin.trim().toUpperCase(),
      phone: phone.trim(),
      birthDate,
      gender,
      city: city.trim(),
      address: address.trim(),
      mutuelle,
      bloodType,
      chronicConditions,
      allergies,
    });

    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center text-lg font-bold">
              👤
            </span>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Nouveau Dossier Patient (DMP)
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Conforme CNDP Déclaration D-W-412/2026 (Loi 09-08)
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nom & Prénom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-patient-first-name" className="block font-semibold text-slate-700 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                id="new-patient-first-name"
                name="firstName"
                type="text"
                required
                placeholder="ex: Yassine"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="new-patient-last-name" className="block font-semibold text-slate-700 mb-1">
                Nom de famille <span className="text-red-500">*</span>
              </label>
              <input
                id="new-patient-last-name"
                name="lastName"
                type="text"
                required
                placeholder="ex: Mansouri"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              />
            </div>
          </div>

          {/* CIN & Téléphone WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-patient-cin" className="block font-semibold text-slate-700 mb-1">
                Numéro CIN Maroc <span className="text-red-500">*</span>
              </label>
              <input
                id="new-patient-cin"
                name="cin"
                type="text"
                required
                placeholder="ex: BE492019"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono uppercase focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="new-patient-phone" className="block font-semibold text-slate-700 mb-1">
                Téléphone (WhatsApp) <span className="text-red-500">*</span>
              </label>
              <input
                id="new-patient-phone"
                name="phone"
                type="tel"
                required
                placeholder="+212 6..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Date de naissance, Sexe & Groupe Sanguin */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date de Naissance
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Genre
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              >
                <option value="M">Masculin (H)</option>
                <option value="F">Féminin (F)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Groupe Sanguin
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800 focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              >
                <option value="A+">A +</option>
                <option value="A-">A -</option>
                <option value="B+">B +</option>
                <option value="B-">B -</option>
                <option value="AB+">AB +</option>
                <option value="AB-">AB -</option>
                <option value="O+">O +</option>
                <option value="O-">O -</option>
              </select>
            </div>
          </div>

          {/* Mutuelle & Ville */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Couverture Maladie / Mutuelle
              </label>
              <select
                value={mutuelle}
                onChange={(e) => setMutuelle(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              >
                <option value="AMO_CNSS">AMO — CNSS (Secteur Privé)</option>
                <option value="CNOPS">CNOPS (Secteur Public)</option>
                <option value="SAHAM">Saham / Sanlam Assurance</option>
                <option value="AXA">AXA Assurance Maroc</option>
                <option value="RMA">RMA Watanya</option>
                <option value="AUCUNE">Sans Mutuelle (Paiement Direct)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ville de Résidence
              </label>
              <input
                type="text"
                placeholder="Casablanca, Rabat, Marrakech..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Antécédents & Facteurs de risque */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Antécédents médicaux / Affections chroniques (ALD)
            </label>
            <input
              type="text"
              placeholder="ex: Hypertension artérielle (HTA), Diabète Type 2, Asthme..."
              value={chronicConditions}
              onChange={(e) => setChronicConditions(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
            />
          </div>

          {/* Allergies médicamenteuses */}
          <div>
            <label className="block font-semibold text-rose-700 mb-1">
              ⚠️ Allergies médicamenteuses majeures
            </label>
            <input
              type="text"
              placeholder="ex: Pénicilline, Sulfamides, Aspirine (Laissez vide si aucune)"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="w-full bg-rose-50/50 border border-rose-300 rounded-lg p-2 text-rose-900 focus:ring-1 focus:ring-rose-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              * Champs obligatoires
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold"
              >
                Enregistrer le Patient
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewPatientModal;
