'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { DateTime } from 'luxon';

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  patientName: string;
  doctorName: string;
  time: string;
  amount: number; // in MAD (e.g. 300)
  method: 'cash' | 'check' | 'card' | 'pending';
  receiptNumber: string;
  checkNumber?: string;
  isPaid: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timezone?: string;
  clinicName?: string;
}

// Initial mock records for the clinic shift
const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    appointmentId: 'appt-1',
    patientName: 'Yassine Mansouri',
    doctorName: 'Dr. Amine Benali',
    time: '09:00',
    amount: 350,
    method: 'cash',
    receiptNumber: 'REC-2026-1042',
    isPaid: true,
  },
  {
    id: 'pay-2',
    appointmentId: 'appt-2',
    patientName: 'Fatima Zahra Alami',
    doctorName: 'Dr. Amine Benali',
    time: '09:30',
    amount: 400,
    method: 'check',
    checkNumber: 'CHQ-882910',
    receiptNumber: 'REC-2026-1089',
    isPaid: true,
  },
  {
    id: 'pay-3',
    appointmentId: 'appt-3',
    patientName: 'Omar Bennani',
    doctorName: 'Dr. Amine Benali',
    time: '10:00',
    amount: 300,
    method: 'cash',
    receiptNumber: 'REC-2026-1091',
    isPaid: true,
  },
  {
    id: 'pay-4',
    appointmentId: 'appt-4',
    patientName: 'Khadija Tazi',
    doctorName: 'Dr. Amine Benali',
    time: '10:30',
    amount: 350,
    method: 'pending',
    receiptNumber: 'REC-2026-1077',
    isPaid: false,
  },
];

export function CashDeskModal({
  open,
  onOpenChange,
  timezone = 'Africa/Casablanca',
  clinicName = 'Cabinet Dr. Amine Benali',
}: Props) {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [filter, setFilter] = useState<'all' | 'cash' | 'check' | 'card' | 'pending'>('all');
  const [closed, setClosed] = useState(false);

  if (!open) return null;

  const todayStr = DateTime.now().setZone(timezone).toFormat('cccc d LLLL yyyy');

  const totalCash = payments
    .filter((p) => p.isPaid && p.method === 'cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCheck = payments
    .filter((p) => p.isPaid && p.method === 'check')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCard = payments
    .filter((p) => p.isPaid && p.method === 'card')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => !p.isPaid || p.method === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCollected = totalCash + totalCheck + totalCard;

  const filteredList = payments.filter((p) => {
    if (filter === 'all') return true;
    return p.method === filter;
  });

  function togglePayment(id: string, method: 'cash' | 'check' | 'card') {
    setPayments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            method,
            isPaid: true,
          };
        }
        return item;
      }),
    );
  }

  function handleCloseRegister() {
    setClosed(true);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl border border-slate-200 max-w-3xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-terracotta-100 text-terracotta-600 flex items-center justify-center text-lg font-bold">
              💰
            </span>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Caisse & Règlements Journaliers (Clôture de Caisse)
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {clinicName} • {todayStr}
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

        {/* 4 Financial Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Collected */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
              Total Encaissé
            </span>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5 tabular-nums">
              {totalCollected.toLocaleString('fr-FR')} <span className="text-xs font-normal">DH</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Caisse active</span>
          </div>

          {/* Cash / Espèces */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block">
              Espèces (Cash)
            </span>
            <div className="text-base font-bold text-emerald-900 font-mono mt-0.5 tabular-nums">
              {totalCash.toLocaleString('fr-FR')} <span className="text-xs font-normal">DH</span>
            </div>
            <span className="text-[10px] text-emerald-700">En tiroir caisse</span>
          </div>

          {/* Checks / Chèques */}
          <div className="bg-terracotta-50/50 border border-terracotta-200 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-terracotta-800 block">
              Chèques
            </span>
            <div className="text-base font-bold text-terracotta-900 font-mono mt-0.5 tabular-nums">
              {totalCheck.toLocaleString('fr-FR')} <span className="text-xs font-normal">DH</span>
            </div>
            <span className="text-[10px] text-terracotta-700">À déposer en banque</span>
          </div>

          {/* Pending */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 block">
              En attente
            </span>
            <div className="text-base font-bold text-amber-900 font-mono mt-0.5 tabular-nums">
              {totalPending.toLocaleString('fr-FR')} <span className="text-xs font-normal">DH</span>
            </div>
            <span className="text-[10px] text-amber-700">À recouvrer</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            {(['all', 'cash', 'check', 'card', 'pending'] as const).map((key) => {
              const labels = {
                all: 'Tous les actes',
                cash: 'Espèces',
                check: 'Chèques',
                card: 'Cartes/TPE',
                pending: 'En attente',
              };
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`px-2.5 py-1 rounded-md transition ${filter === key ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>

          {closed && (
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
              <span>✓</span> Clôture validée
            </span>
          )}
        </div>

        {/* Table of transactions */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-3 font-mono">Quittance</th>
                <th className="p-3">Heure</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Montant (DH)</th>
                <th className="p-3">Mode de règlement</th>
                <th className="p-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 font-mono text-terracotta-600 font-medium">{item.receiptNumber}</td>
                  <td className="p-3 font-mono text-slate-600">{item.time}</td>
                  <td className="p-3 font-medium text-slate-900">{item.patientName}</td>
                  <td className="p-3 font-mono font-bold text-slate-900 tabular-nums">
                    {item.amount} DH
                  </td>
                  <td className="p-3">
                    {item.isPaid ? (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        {item.method === 'cash' && '💵 Espèces'}
                        {item.method === 'check' && `📝 Chèque (${item.checkNumber || 'Banque'})`}
                        {item.method === 'card' && '💳 Carte / TPE'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePayment(item.id, 'cash')}
                          className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium cursor-pointer"
                        >
                          + Espèces
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePayment(item.id, 'check')}
                          className="px-2 py-0.5 rounded text-[11px] bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 border border-terracotta-200 font-medium cursor-pointer"
                        >
                          + Chèque
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {item.isPaid ? (
                      <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                        Réglé
                      </span>
                    ) : (
                      <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium">
                        En attente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Export certifié pour comptabilité marocaine (Reçu fiscal conforme).
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition font-medium cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨</span> Imprimer le journal
            </button>
            <Button
              size="sm"
              onClick={handleCloseRegister}
              disabled={closed}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
            >
              {closed ? '✓ Clôture effectuée' : 'Effectuer la Clôture de Caisse'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashDeskModal;
