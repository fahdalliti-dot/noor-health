'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';

interface TimeSlot {
  time: string;
  available: boolean;
}

const AVAILABLE_SLOTS: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '09:30', available: false }, // busy
  { time: '10:00', available: true },
  { time: '10:30', available: false }, // busy
  { time: '11:00', available: true },
  { time: '11:30', available: true },
  { time: '14:30', available: true },
  { time: '15:00', available: true },
  { time: '15:30', available: false },
  { time: '16:00', available: true },
];

export default function PublicBookingPage({ params }: { params: { slug: string } }) {
  const [step, setStep] = useState<'service' | 'slot' | 'details' | 'otp' | 'confirmed'>('service');
  const [selectedService, setSelectedService] = useState({
    title: 'Première Consultation Cardiologie',
    tariff: '400 DH',
    duration: '30 min',
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('11:00');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('+212 6');
  const [patientCin, setPatientCin] = useState('');
  const [patientMotive, setPatientMotive] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('7419');

  function handleSendOtp() {
    if (!patientName || !patientPhone) {
      alert('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setStep('otp');
  }

  function handleVerifyOtp() {
    if (otpCode.trim() !== generatedOtp) {
      alert(`Code incorrect. Veuillez saisir le code de vérification reçu : ${generatedOtp}`);
      return;
    }
    setStep('confirmed');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Doctor Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-terracotta-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              AB
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Dr. Amine Benali</h1>
              <p className="text-xs text-terracotta-600 font-semibold">Spécialiste en Cardiologie & Maladies Vasculaires</p>
              <p className="text-xs text-slate-500 mt-0.5">
                📍 45 Boulevard Zerktouni, 3ème étage, Casablanca
              </p>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md font-semibold">
              ● Prise de RDV en Ligne
            </span>
            <p className="text-[10px] text-slate-400 font-mono mt-1">INPE: 104829384</p>
          </div>
        </div>

        {/* Multi-Step Intake Flow */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* STEP 1: SELECT SERVICE */}
          {step === 'service' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">1. Choisissez le motif de votre consultation</h2>
                <p className="text-xs text-slate-500">Tarifs conventionnés et durée estimée.</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { title: 'Première Consultation Cardiologie', tariff: '400 DH', duration: '30 min', desc: 'Bilan complet des facteurs de risque et auscultation' },
                  { title: 'Consultation de Suivi / Contrôle', tariff: '350 DH', duration: '30 min', desc: 'Renouvellement d\'ordonnance et suivi de traitement' },
                  { title: 'Électrocardiogramme (ECG) & Tension', tariff: '500 DH', duration: '45 min', desc: 'Tracé ECG 12 dérivations et bilan hémodynamique' },
                ].map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => {
                      setSelectedService(s);
                      setStep('slot');
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      selectedService.title === s.title
                        ? 'border-terracotta-600 bg-blue-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{s.title}</div>
                      <div className="text-[11px] text-slate-500">{s.desc} • {s.duration}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs text-slate-900 font-mono">{s.tariff}</div>
                      <span className="text-[10px] text-terracotta-600 font-semibold">Choisir →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT TIME SLOT */}
          {step === 'slot' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">2. Sélectionnez un créneau disponible</h2>
                  <p className="text-xs text-slate-500">Fuseau horaire : Africa/Casablanca (GMT+1)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('service')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ← Changer de motif
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {AVAILABLE_SLOTS.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot.time);
                      setStep('details');
                    }}
                    className={`p-3 rounded-xl border text-xs font-mono font-semibold transition ${
                      !slot.available
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                        : selectedSlot === slot.time
                        ? 'bg-terracotta-600 text-white border-terracotta-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-terracotta-600 hover:bg-blue-50/40 cursor-pointer'
                    }`}
                  >
                    <div>{slot.time}</div>
                    <span className="text-[10px] font-sans font-normal opacity-80">
                      {slot.available ? 'Libre' : 'Occupé'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PATIENT INTAKE DETAILS */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">3. Vos coordonnées</h2>
                  <p className="text-xs text-slate-500">
                    Rendez-vous à <strong>{selectedSlot}</strong> pour <strong>{selectedService.title}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('slot')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ← Changer d&apos;heure
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nom et Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="ex: Salma El Idrissi"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Numéro de Téléphone (WhatsApp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="+212 6..."
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Numéro CIN (Facultatif)
                    </label>
                    <input
                      type="text"
                      value={patientCin}
                      onChange={(e) => setPatientCin(e.target.value)}
                      placeholder="ex: BE123456"
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Précisions sur votre visite
                  </label>
                  <textarea
                    rows={2}
                    value={patientMotive}
                    onChange={(e) => setPatientMotive(e.target.value)}
                    placeholder="Symptômes ressentis, antécédents particuliers..."
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={handleSendOtp}
                    className="w-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold py-2.5 text-xs"
                  >
                    Recevoir le code de confirmation SMS / WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SMS OTP VERIFICATION */}
          {step === 'otp' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mx-auto font-bold">
                📱
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Vérification de votre téléphone</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Un code à 4 chiffres a été envoyé par SMS au <strong className="font-mono">{patientPhone}</strong>.
                </p>
                <div className="mt-2 inline-block bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-3 py-1 rounded-full font-mono">
                  Code de test : <strong>{generatedOtp}</strong>
                </div>
              </div>

              <div className="max-w-xs mx-auto space-y-3">
                <input
                  type="text"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="0000"
                  className="w-full text-center tracking-widest text-2xl font-mono border-2 border-slate-300 focus:border-terracotta-600 rounded-xl p-2.5 focus:outline-none"
                />

                <Button
                  size="sm"
                  onClick={handleVerifyOtp}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 text-xs"
                >
                  Confirmer mon rendez-vous
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: CONFIRMATION TICKET */}
          {step === 'confirmed' && (
            <div className="space-y-5 text-center py-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mx-auto font-bold">
                ✓
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Rendez-vous Confirmé avec Succès !</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Dr. Amine Benali et son équipe vous attendent au cabinet.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left space-y-2 max-w-md mx-auto">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Patient :</span>
                  <span className="font-bold text-slate-900">{patientName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Horaire :</span>
                  <span className="font-bold font-mono text-terracotta-600">Aujourd&apos;hui à {selectedSlot}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Motif :</span>
                  <span className="font-medium text-slate-800">{selectedService.title}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Honoraires :</span>
                  <span className="font-bold font-mono text-slate-900">{selectedService.tariff}</span>
                </div>
              </div>

              <div className="flex justify-center gap-2">
                <a
                  href="https://maps.google.com/?q=Casablanca+Zerktouni"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  📍 Itinéraire Google Maps
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  🖨 Imprimer ma convocation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
