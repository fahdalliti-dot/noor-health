'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

export default function ClinicSettingsPage() {
  const [clinicName, setClinicName] = useState('Demo Clinic Al-Andalus');
  const [city, setCity] = useState('Casablanca');
  const [address, setAddress] = useState('123 Avenue Hassan II');
  const [phone, setPhone] = useState('+212 522 123456');
  const [require2fa, setRequire2fa] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres du cabinet</h1>
        <p className="text-sm text-gray-500">Configuration générale de la clinique et politiques de sécurité.</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
          ✓ Paramètres enregistrés avec succès.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du cabinet / Clinique</label>
          <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={require2fa}
              onChange={(e) => setRequire2fa(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Exiger le 2FA pour tout le personnel (secrétaires incluses)
            </span>
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
