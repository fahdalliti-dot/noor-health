'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

interface AuditEntry {
  id: string;
  time: string;
  user: string;
  role: string;
  action: string;
  resource: string;
  ip: string;
  status: 'success' | 'warning' | 'alert';
}

const MOCK_AUDIT_LOGS: AuditEntry[] = [
  {
    id: 'log-1',
    time: '29/10/2026 09:32:14',
    user: 'Dr. Amine Benali',
    role: 'doctor',
    action: 'LECTURE_DOSSIER',
    resource: 'Patient #1089 (Fatima Zahra Alami)',
    ip: '196.200.145.22 (Casablanca)',
    status: 'success',
  },
  {
    id: 'log-2',
    time: '29/10/2026 09:30:05',
    user: 'Dr. Amine Benali',
    role: 'doctor',
    action: 'EMISSION_ORDONNANCE',
    resource: 'Rx #2026-1089 (Augmentin & Doliprane)',
    ip: '196.200.145.22 (Casablanca)',
    status: 'warning', // flagged for penicillin allergy check
  },
  {
    id: 'log-3',
    time: '29/10/2026 09:28:40',
    user: 'Secrétaire Meryem',
    role: 'secretary',
    action: 'ENCAISSEMENT_CASH',
    resource: 'Quittance #REC-2026-1042 (350 DH)',
    ip: '196.200.145.22 (Casablanca)',
    status: 'success',
  },
  {
    id: 'log-4',
    time: '29/10/2026 09:15:11',
    user: 'Secrétaire Meryem',
    role: 'secretary',
    action: 'ENREGISTREMENT_ARRIVEE',
    resource: 'Patient #1091 (Omar Bennani)',
    ip: '196.200.145.22 (Casablanca)',
    status: 'success',
  },
  {
    id: 'log-5',
    time: '29/10/2026 08:45:00',
    user: 'Dr. Amine Benali',
    role: 'doctor',
    action: 'AUTH_2FA_VERIFIEE',
    resource: 'Session Web TOTP',
    ip: '196.200.145.22 (Casablanca)',
    status: 'success',
  },
];

export default function ClinicSettingsPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'cndp'>('settings');
  const [clinicName, setClinicName] = useState('Cabinet de Cardiologie Dr. Amine Benali');
  const [city, setCity] = useState('Casablanca');
  const [address, setAddress] = useState('45 Boulevard Zerktouni, 3ème étage');
  const [phone, setPhone] = useState('+212 522 334455');
  const [inpe, setInpe] = useState('104829384');
  const [require2fa, setRequire2fa] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-gray-200 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Administration & Sécurité du Cabinet</h1>
          <p className="text-xs text-gray-500">
            Configuration du cabinet, conformité CNDP Loi 09-08 et journal d&apos;audit.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'settings' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Paramètres Généraux
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cndp')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'cndp' ? 'bg-white font-semibold text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Registre CNDP & Audit Trail (Loi 09-08)
          </button>
        </div>
      </div>

      {saved && (
        <div role="status" aria-live="polite" className="p-3 bg-green-50 text-green-800 rounded-lg text-xs border border-green-200">
          ✓ Modifications enregistrées avec succès dans la base sécurisée.
        </div>
      )}

      {activeTab === 'settings' ? (
        <form onSubmit={handleSave} className="space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs text-xs">
          <div>
            <label htmlFor="clinic-name" className="block font-medium text-gray-700 mb-1">
              Nom officiel du cabinet / Clinique
            </label>
            <Input
              id="clinic-name"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clinic-city" className="block font-medium text-gray-700 mb-1">
                Ville
              </label>
              <Input
                id="clinic-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="clinic-phone" className="block font-medium text-gray-700 mb-1">
                Téléphone fixe / Accueil
              </label>
              <Input
                id="clinic-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clinic-address" className="block font-medium text-gray-700 mb-1">
                Adresse physique
              </label>
              <Input
                id="clinic-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="clinic-inpe" className="block font-medium text-gray-700 mb-1">
                Identifiant National INPE (Médecin principal)
              </label>
              <Input
                id="clinic-inpe"
                value={inpe}
                onChange={(e) => setInpe(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label htmlFor="require-2fa" className="flex items-center gap-3 cursor-pointer">
              <input
                id="require-2fa"
                type="checkbox"
                checked={require2fa}
                onChange={(e) => setRequire2fa(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 font-medium">
                Exiger obligatoirement l&apos;authentification à double facteur (2FA TOTP) pour tous les comptes.
              </span>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" size="sm" className="bg-terracotta-600 hover:bg-terracotta-700 text-white">
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* CNDP Compliance Header Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-terracotta-600 flex items-center justify-center font-bold text-sm">
                  ⚖️
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Registre des Traitements & Conformité CNDP
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Conforme à la Loi N° 09-08 relative à la protection des données à caractère personnel.
                  </p>
                </div>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-md border border-emerald-200">
                ✓ Récépissé CNDP : D-W-2026/88
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Chiffrement</span>
                <span className="font-bold text-slate-900 font-mono">AES-256-GCM + Blind HMAC</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Durée de rétention</span>
                <span className="font-bold text-slate-900 font-mono">10 ans (Réglementaire Maroc)</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Cloisonnement RLS</span>
                <span className="font-bold text-emerald-700 font-mono">PostgreSQL NOBYPASSRLS</span>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">
                Journal Immuable des Accès & Modifications (Audit Trail)
              </span>
              <button
                type="button"
                onClick={() => alert('Export du registre CNDP téléchargé au format scellé.')}
                className="text-terracotta-600 hover:underline font-semibold cursor-pointer"
              >
                📥 Exporter l&apos;audit légal
              </button>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="p-3 font-mono">Horodatage (Casablanca)</th>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Ressource / Détails</th>
                  <th className="p-3">Adresse IP</th>
                  <th className="p-3 text-right">Statut CNDP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_AUDIT_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono text-slate-600 tabular-nums">{log.time}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-900">{log.user}</span>
                      <span className="text-slate-400 ms-1 text-[10px]">({log.role})</span>
                    </td>
                    <td className="p-3 font-mono text-[11px] font-semibold text-slate-800">
                      {log.action}
                    </td>
                    <td className="p-3 text-slate-600">{log.resource}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{log.ip}</td>
                    <td className="p-3 text-right">
                      {log.status === 'warning' ? (
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                          Alerte Contrôlée
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                          Conforme
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
