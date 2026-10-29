'use client';

import { useEffect, useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { DateTime } from 'luxon';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useAgenda, type Slot } from '../hooks/use-agenda';
import { api } from '@/lib/api';

export interface PatientSummary {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  cin?: string | null;
  birth_date?: string;
  gender?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
  doctorName: string;
  timezone: string;
  defaultSlot?: Slot;
  defaultDate: Date;
  onSuccess: () => void;
}

export function NewAppointmentModal({
  open,
  onOpenChange,
  doctorId,
  doctorName,
  timezone,
  defaultSlot,
  defaultDate,
  onSuccess,
}: Props) {
  const t = useTranslations();
  const { createAppointment } = useAgenda();

  // Time & Appointment state
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Patient Selection state
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientList, setPatientList] = useState<PatientSummary[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  // New Patient Form state
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('+212 ');
  const [newBirthDate, setNewBirthDate] = useState('1990-01-01');
  const [newGender, setNewGender] = useState<'male' | 'female' | 'other'>('male');
  const [newCin, setNewCin] = useState('');

  // Reset or initialize date/times when opened or defaultSlot changes
  useEffect(() => {
    if (defaultSlot) {
      setStartsAt(defaultSlot.start);
      setEndsAt(defaultSlot.end);
    } else {
      const d = DateTime.fromJSDate(defaultDate).setZone(timezone || 'Africa/Casablanca');
      setStartsAt(d.toISO() || '');
      setEndsAt(d.plus({ minutes: 30 }).toISO() || '');
    }
  }, [defaultSlot, defaultDate, timezone, open]);

  // Search existing patients
  const searchPatients = useCallback(async (query: string) => {
    setSearchingPatients(true);
    try {
      if (query.trim().length >= 1) {
        const res = await api.get<{ patients: PatientSummary[] }>(
          `/patients/search?q=${encodeURIComponent(query.trim())}`,
        );
        setPatientList(res.data.patients || []);
      } else {
        const res = await api.get<{ patients: PatientSummary[] }>('/patients?limit=10');
        setPatientList(res.data.patients || []);
      }
    } catch (err) {
      console.error('Failed to search patients', err);
    } finally {
      setSearchingPatients(false);
    }
  }, []);

  useEffect(() => {
    if (open && patientMode === 'existing') {
      searchPatients(patientSearch);
    }
  }, [open, patientMode, patientSearch, searchPatients]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt || !endsAt) {
      setError('Les heures de début et de fin sont obligatoires.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let patientId = selectedPatient?.id;

      // If creating a new patient inline
      if (patientMode === 'new') {
        if (!newFirstName.trim() || !newLastName.trim() || !newBirthDate) {
          setError('Veuillez renseigner le nom, prénom et la date de naissance du patient.');
          setSaving(false);
          return;
        }

        const patientRes = await api.post<{ patient: PatientSummary }>('/patients', {
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          phone: newPhone.trim() || undefined,
          birth_date: new Date(newBirthDate).toISOString(),
          gender: newGender,
          cin: newCin.trim() || undefined,
        });

        patientId = patientRes.data.patient.id;
      }

      if (!patientId) {
        setError('Veuillez sélectionner ou créer un patient pour ce rendez-vous.');
        setSaving(false);
        return;
      }

      await createAppointment({
        doctor_id: doctorId,
        patient_id: patientId,
        starts_at: startsAt,
        ends_at: endsAt,
        reason: reason.trim() || null,
        source: 'staff',
      });

      // Clear state and close
      setReason('');
      setSelectedPatient(null);
      setNewFirstName('');
      setNewLastName('');
      setNewCin('');
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      if (e.message?.includes('slot_unavailable') || e.code === 'slot_unavailable') {
        setError('Ce créneau horaire chevauche un rendez-vous existant pour ce médecin.');
      } else {
        setError(e.message || 'Impossible de créer le rendez-vous.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity" />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto sheet-card shadow-2xl p-6"
          aria-label="Nouveau rendez-vous"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <Dialog.Title className="text-lg font-bold text-gray-900">
                Nouveau rendez-vous
              </Dialog.Title>
              <p className="text-xs text-gray-500">
                Praticien : <span className="font-semibold text-gray-700">Dr. {doctorName}</span>
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
                aria-label="Fermer"
              >
                ✕
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {/* Patient Mode Tabs */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Patient concerné <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg text-xs font-medium mb-3">
                <button
                  type="button"
                  onClick={() => setPatientMode('existing')}
                  className={`py-1.5 rounded-md transition-all cursor-pointer ${
                    patientMode === 'existing'
                      ? 'bg-white text-terracotta-700 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Patient existant
                </button>
                <button
                  type="button"
                  onClick={() => setPatientMode('new')}
                  className={`py-1.5 rounded-md transition-all cursor-pointer ${
                    patientMode === 'new'
                      ? 'bg-white text-terracotta-700 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  + Nouveau patient
                </button>
              </div>

              {patientMode === 'existing' ? (
                <div>
                  {selectedPatient ? (
                    <div className="flex items-center justify-between p-3 bg-terracotta-50 border border-terracotta-200 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </p>
                        <p className="text-xs text-terracotta-700">
                          {selectedPatient.phone || 'Pas de numéro'} {selectedPatient.cin ? `· CIN: ${selectedPatient.cin}` : ''}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPatient(null)}
                        className="text-terracotta-700 hover:text-blue-900 hover:bg-terracotta-100"
                      >
                        Changer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        id="patient-search"
                        type="search"
                        placeholder="Rechercher par nom, téléphone ou CIN..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        autoComplete="off"
                      />
                      <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
                        {searchingPatients ? (
                          <div className="p-3 text-xs text-gray-500 text-center">Recherche en cours...</div>
                        ) : patientList.length === 0 ? (
                          <div className="p-3 text-xs text-gray-500 text-center">
                            Aucun patient trouvé. Passez à &quot;Nouveau patient&quot; pour le créer.
                          </div>
                        ) : (
                          patientList.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPatient(p)}
                              className="w-full text-left p-2.5 hover:bg-gray-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div>
                                <span className="font-semibold text-gray-900">
                                  {p.first_name} {p.last_name}
                                </span>
                                {p.cin && <span className="text-gray-400 ms-1.5">({p.cin})</span>}
                              </div>
                              <span className="text-gray-500">{p.phone || '—'}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="patient-last-name" className="block text-xs font-medium text-gray-700 mb-1">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="patient-last-name"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        placeholder="Ex: Alami"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="patient-first-name" className="block text-xs font-medium text-gray-700 mb-1">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="patient-first-name"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        placeholder="Ex: Youssef"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="patient-phone" className="block text-xs font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <Input
                        id="patient-phone"
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+212 6..."
                      />
                    </div>
                    <div>
                      <label htmlFor="patient-cin" className="block text-xs font-medium text-gray-700 mb-1">
                        CIN
                      </label>
                      <Input
                        id="patient-cin"
                        value={newCin}
                        onChange={(e) => setNewCin(e.target.value)}
                        placeholder="Ex: AB12345"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="patient-birthdate" className="block text-xs font-medium text-gray-700 mb-1">
                        Date de naissance <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="patient-birthdate"
                        type="date"
                        value={newBirthDate}
                        onChange={(e) => setNewBirthDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="patient-gender" className="block text-xs font-medium text-gray-700 mb-1">
                        Genre
                      </label>
                      <select
                        id="patient-gender"
                        value={newGender}
                        onChange={(e) => setNewGender(e.target.value as any)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                      >
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Time Scheduling */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="appointment-start" className="block text-xs font-medium text-gray-700 mb-1">
                  Début <span className="text-red-500">*</span>
                </label>
                <Input
                  id="appointment-start"
                  type="datetime-local"
                  value={startsAt ? startsAt.slice(0, 16) : ''}
                  onChange={(e) => {
                    const local = e.target.value;
                    if (!local) return;
                    const iso = new Date(local).toISOString();
                    setStartsAt(iso);
                    setEndsAt(new Date(new Date(iso).getTime() + 30 * 60000).toISOString());
                  }}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="appointment-end" className="block text-xs font-medium text-gray-700 mb-1">
                  Fin <span className="text-red-500">*</span>
                </label>
                <Input
                  id="appointment-end"
                  type="datetime-local"
                  value={endsAt ? endsAt.slice(0, 16) : ''}
                  onChange={(e) => {
                    const local = e.target.value;
                    if (local) setEndsAt(new Date(local).toISOString());
                  }}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="appointment-reason" className="block text-xs font-medium text-gray-700 mb-1">
                Motif de consultation
              </label>
              <Input
                id="appointment-reason"
                type="text"
                placeholder="Ex: Première consultation, Suivi tension..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 font-medium"
              >
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" type="button">
                  Annuler
                </Button>
              </Dialog.Close>
              <Button
                size="sm"
                type="submit"
                isLoading={saving}
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : 'Confirmer le rendez-vous'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default NewAppointmentModal;
