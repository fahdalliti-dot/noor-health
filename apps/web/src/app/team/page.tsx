'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'secretary';
  inpe?: string;
  specialty?: string;
  twoFactorEnabled: boolean;
  active: boolean;
  permissions: {
    canViewDmp: boolean;
    canPrescribe: boolean;
    canCollectCash: boolean;
    canExportAudit: boolean;
  };
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Dr. Amine Benali',
    email: 'a.benali@cardio-casablanca.ma',
    role: 'doctor',
    inpe: '104829384',
    specialty: 'Cardiologie & Maladies Vasculaires',
    twoFactorEnabled: true,
    active: true,
    permissions: {
      canViewDmp: true,
      canPrescribe: true,
      canCollectCash: true,
      canExportAudit: true,
    },
  },
  {
    id: 'staff-2',
    name: 'Dr. Sara Karim',
    email: 's.karim@pediatrie-rabat.ma',
    role: 'doctor',
    inpe: '209384912',
    specialty: 'Pédiatrie & Néonatologie',
    twoFactorEnabled: true,
    active: true,
    permissions: {
      canViewDmp: true,
      canPrescribe: true,
      canCollectCash: true,
      canExportAudit: false,
    },
  },
  {
    id: 'staff-3',
    name: 'Meryem Alami',
    email: 'secretariat@cardio-casablanca.ma',
    role: 'secretary',
    twoFactorEnabled: true,
    active: true,
    permissions: {
      canViewDmp: false, // Strict CNDP isolation: secretary cannot view clinical medical notes
      canPrescribe: false,
      canCollectCash: true,
      canExportAudit: false,
    },
  },
];

export default function TeamPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'doctor' | 'secretary'>('secretary');
  const [inviteInpe, setInviteInpe] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: inviteName || (inviteRole === 'doctor' ? `Dr. ${inviteEmail.split('@')[0]}` : inviteEmail.split('@')[0]),
      email: inviteEmail,
      role: inviteRole,
      inpe: inviteRole === 'doctor' ? (inviteInpe || 'En attente') : undefined,
      twoFactorEnabled: inviteRole === 'doctor',
      active: true,
      permissions: {
        canViewDmp: inviteRole === 'doctor',
        canPrescribe: inviteRole === 'doctor',
        canCollectCash: true,
        canExportAudit: false,
      },
    };
    setStaff([newMember, ...staff]);
    setInviteSent(true);
    setInviteEmail('');
    setInviteName('');
    setInviteInpe('');
    setTimeout(() => setInviteSent(false), 4000);
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Médecin Praticien
          </span>
        );
      case 'secretary':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Secrétariat Médical
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            Administrateur
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Équipe Clinique & Habilitations</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestion des praticiens, accès secrétariat et conformité CNDP Loi 09-08 (Séparation stricte des privilèges).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            2FA Obligatoire pour Médecins
          </span>
        </div>
      </div>

      {/* Invite Member Section */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Inviter un nouveau collaborateur</h2>
          <span className="text-xs text-gray-500">Lien d&apos;invitation cryptographique valable 7 jours</span>
        </div>

        {inviteSent && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded text-xs border border-emerald-200 flex items-center gap-2">
            <span className="font-bold">✓</span> Invitation envoyée avec succès par email et SMS au collaborateur.
          </div>
        )}

        <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom complet</label>
            <Input
              type="text"
              placeholder="Dr. Nom Prénom ou Prénom"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Adresse Email professionnelle</label>
            <Input
              type="email"
              placeholder="praticien@cabinet.ma"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rôle & Habilitations</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white h-[38px]"
            >
              <option value="doctor">Médecin (Accès DMP + Prescription)</option>
              <option value="secretary">Secrétaire (Accueil + Caisse sans DMP)</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-[38px]">
              Envoyer l&apos;invitation
            </Button>
          </div>
        </form>
      </div>

      {/* Staff Directory */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Effectif du Cabinet ({staff.length} Collaborateurs)
          </h2>
          <span className="text-[11px] text-gray-500 font-mono">Conformité CNDP: Rôles Séparés</span>
        </div>

        <div className="divide-y divide-gray-100">
          {staff.map((member) => (
            <div key={member.id} className="p-4 hover:bg-gray-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-sm text-gray-900">{member.name}</span>
                  {roleBadge(member.role)}
                  {member.inpe && (
                    <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">
                      INPE: {member.inpe}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-3">
                  <span>{member.email}</span>
                  {member.specialty && (
                    <>
                      <span>•</span>
                      <span className="text-blue-700 font-medium">{member.specialty}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Security & Permissions Matrix */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${
                      member.permissions.canViewDmp
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'bg-gray-100 text-gray-400 line-through'
                    }`}
                  >
                    Dossier Médical (DMP)
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${
                      member.permissions.canPrescribe
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'bg-gray-100 text-gray-400 line-through'
                    }`}
                  >
                    Ordonnances
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${
                      member.permissions.canCollectCash
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'bg-gray-100 text-gray-400 line-through'
                    }`}
                  >
                    Caisse / Encaissement
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      member.twoFactorEnabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {member.twoFactorEnabled ? '2FA Actif' : '2FA En attente'}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Actif
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
