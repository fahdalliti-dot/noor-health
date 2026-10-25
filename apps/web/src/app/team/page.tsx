'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'secretary';
  active: boolean;
}

export default function TeamPage() {
  const [staff] = useState<StaffMember[]>([
    { id: '1', name: 'Admin Clinic A', email: 'admin@clinic-a.test', role: 'admin', active: true },
    { id: '2', name: 'Dr. Ahmed Alami', email: 'doctor@clinic-a.test', role: 'doctor', active: true },
    { id: '3', name: 'Fatima Zahra', email: 'secretary@clinic-a.test', role: 'secretary', active: true },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'doctor' | 'secretary'>('secretary');
  const [inviteSent, setInviteSent] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSent(true);
    setInviteEmail('');
    setTimeout(() => setInviteSent(false), 3000);
  };

  const roleBadge = (role: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      admin: { label: 'Administrateur', cls: 'bg-purple-100 text-purple-700' },
      doctor: { label: 'Médecin', cls: 'bg-blue-100 text-blue-700' },
      secretary: { label: 'Secrétaire', cls: 'bg-green-100 text-green-700' },
    };
    const current = map[role] || { label: role, cls: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${current.cls}`}>
        {current.label}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Équipe & Praticiens</h1>
        <p className="text-sm text-gray-500">Membres du personnel et accès au cabinet médical.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Inviter un nouveau membre</h2>
        {inviteSent && (
          <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
            ✓ Invitation envoyée avec un jeton sécurisé (valable 7 jours).
          </div>
        )}
        <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              type="email"
              placeholder="adresse.email@praticien.ma"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as any)}
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="doctor">Médecin</option>
            <option value="secretary">Secrétaire</option>
          </select>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            Envoyer l&apos;invitation
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Membres actuels ({staff.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {staff.map((member) => (
            <div key={member.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div>
                <div className="font-medium text-gray-900">{member.name}</div>
                <div className="text-sm text-gray-500">{member.email}</div>
              </div>
              <div className="flex items-center gap-3">
                {roleBadge(member.role)}
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">Actif</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
