'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName?: string;
  amountMad?: number;
  consultationReason?: string;
  onPaymentSuccess?: (transactionRef: string) => void;
}

export function CmiPaymentModal({
  open,
  onOpenChange,
  patientName = 'Fatima Zahra Alami',
  amountMad = 400,
  consultationReason = 'Consultation de Cardiologie',
  onPaymentSuccess,
}: Props) {
  const [step, setStep] = useState<'card' | 'otp' | 'success'>('card');
  const [cardNumber, setCardNumber] = useState('4000 1234 5678 9010');
  const [cardHolder, setCardHolder] = useState('MME FATIMA ZAHRA ALAMI');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('321');
  const [bankOtp, setBankOtp] = useState('');
  const [txnRef, setTxnRef] = useState('CMI-2026-9812401');

  if (!open) return null;

  function handleSubmitCard(e: React.FormEvent) {
    e.preventDefault();
    setStep('otp');
  }

  function handleVerifyOtp() {
    const ref = `CMI-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setTxnRef(ref);
    setStep('success');
    if (onPaymentSuccess) onPaymentSuccess(ref);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
        {/* Header with CMI brand styling */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-7 rounded bg-terracotta-600 text-white flex items-center justify-center font-bold text-[10px] tracking-wider">
              CMI
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                Paiement Sécurisé CMI (Centre Monétique Interbancaire)
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">Cartes Bancaires Marocaines & Internationales</p>
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

        {/* Transaction Summary */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-500 text-[11px] block">Montant à régler :</span>
            <span className="font-bold text-slate-900 text-sm font-mono">{amountMad} DH</span>
          </div>
          <div className="text-right text-[11px] text-slate-600">
            <div>Patient : <strong className="text-slate-900">{patientName}</strong></div>
            <div className="text-slate-400 text-[10px]">{consultationReason}</div>
          </div>
        </div>

        {/* STEP 1: CARD DETAILS */}
        {step === 'card' && (
          <form onSubmit={handleSubmitCard} className="space-y-3.5 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Nom sur la carte :</label>
              <input
                type="text"
                required
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">Numéro de carte bancaire :</label>
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm tracking-wider focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Expiration (MM/AA) :</label>
                <input
                  type="text"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Cryptogramme (CVV) :</label>
                <input
                  type="password"
                  maxLength={3}
                  required
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-center tracking-widest focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="sm"
                className="w-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold py-2.5 text-xs"
              >
                Valider et continuer vers 3D Secure
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: 3D SECURE OTP SIMULATION */}
        {step === 'otp' && (
          <div className="space-y-4 text-center py-2 text-xs">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-terracotta-600 flex items-center justify-center text-lg mx-auto font-bold">
              🔒
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Authentification 3D Secure (Banque Marocaine)</h4>
              <p className="text-slate-500 mt-1">
                Saisissez le mot de passe à usage unique reçu sur votre mobile pour confirmer le paiement de <strong>{amountMad} DH</strong>.
              </p>
              <div className="mt-2 inline-block bg-slate-100 px-3 py-1 rounded-full font-mono text-slate-700 text-[11px]">
                Code test : <strong>884210</strong>
              </div>
            </div>

            <div className="max-w-xs mx-auto space-y-3">
              <input
                type="text"
                maxLength={6}
                value={bankOtp}
                onChange={(e) => setBankOtp(e.target.value)}
                placeholder="884210"
                className="w-full text-center text-xl font-mono border-2 border-slate-300 focus:border-terracotta-600 rounded-xl p-2 focus:outline-none"
              />

              <Button
                size="sm"
                onClick={handleVerifyOtp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 text-xs"
              >
                Confirmer le débit bancaire
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESSFUL RECEIPT */}
        {step === 'success' && (
          <div className="space-y-4 text-center py-2 animate-fade-in text-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mx-auto font-bold">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Paiement Accepté</h4>
              <p className="text-slate-500 mt-0.5">Autorisation bancaire accordée par le CMI.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Réf. CMI :</span>
                <span className="font-bold text-slate-900">{txnRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant débité :</span>
                <span className="font-bold text-slate-900">{amountMad} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statut Caisse :</span>
                <span className="text-emerald-700 font-bold">Encaissé (Carte Bancaire)</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
              >
                🖨 Imprimer le reçu fiscal
              </button>
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CmiPaymentModal;
