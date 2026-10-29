'use client';

import { useEffect, useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { DateTime } from 'luxon';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useAgenda, type Slot } from '../hooks/use-agenda';
import { api } from '@/lib/api';
import {
  findOfflinePatients,
  addOfflinePatient,
  getOfflineAppointments,
  saveOfflineAppointments,
  normalizePatient,
} from '@/lib/offline/offline-store';

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

  // Search existing patients (both from local/offline registry and backend API)
  const searchPatients = useCallback(async (query: string) => {
    setSearchingPatients(true);
    try {
      // 1. Get cached/offline patients (always available with 0ms latency)
      const offlineMatches = findOfflinePatients(query);

      // 2. Fetch from backend API if online
      let apiMatches: any[] = [];
      try {
        if (query.trim().length >= 1) {
          const res = await api.get<{ patients: any[] }>(
            `/patients/search?q=${encodeURIComponent(query.trim())}`,
          );
          apiMatches = res.data?.patients || [];
        } else {
          const res = await api.get<{ patients: any[] }>('/patients?limit=25');
          apiMatches = res.data?.patients || [];
        }
      } catch {
        // Fallback gracefully to offline cache if API is offline or returns error
      }

      // 3. Merge, normalize and deduplicate by id or CIN
      const mergedMap = new Map<string, PatientSummary>();

      for (const p of offlineMatches) {
        const norm = normalizePatient(p);
        const key = (norm.cin && norm.cin.trim()) || norm.id;
        mergedMap.set(key, norm);
      }

      for (const p of apiMatches) {
        const norm = normalizePatient(p);
        const key = (norm.cin && norm.cin.trim()) || norm.id;
        mergedMap.set(key, { ...mergedMap.get(key), ...norm });
      }

      setPatientList(Array.from(mergedMap.values()));
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
      let effectivePatient = selectedPatient;

      // If creating a new patient inline
      if (patientMode === 'new') {
        if (!newFirstName.trim() || !newLastName.trim() || !newBirthDate) {
          setError('Veuillez renseigner le nom, prénom et la date de naissance du patient.');
          setSaving(false);
          return;
        }

        const newPatientData = {
          id: `p-${Date.now()}`,
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          phone: newPhone.trim() || undefined,
          birth_date: newBirthDate,
          gender: newGender,
          cin: newCin.trim().toUpperCase() || undefined,
        };

        // Immediately add to local offline registry so it is immediately searchable everywhere
        const localSaved = addOfflinePatient(newPatientData);
        patientId = localSaved.id;
        effectivePatient = localSaved;

        // Asynchronously/persistently sync to backend API if available
        try {
          const patientRes = await api.post<{ patient: PatientSummary }>('/patients', {
            first_name: newFirstName.trim(),
            last_name: newLastName.trim(),
            phone: newPhone.trim() || undefined,
            birth_date: newBirthDate,
            gender: newGender,
            cin: newCin.trim().toUpperCase() || undefined,
          });
          if (patientRes.data?.patient?.id) {
            patientId = patientRes.data.patient.id;
            addOfflinePatient(patientRes.data.patient);
          }
        } catch (apiErr) {
          console.warn('Backend patient creation deferred to offline sync', apiErr);
        }
      }

      if (!patientId) {
        setError('Veuillez sélectionner ou créer un patient pour ce rendez-vous.');
        setSaving(false);
        return;
      }

      let createdAppt: any;
      try {
        createdAppt = await createAppointment({
          doctor_id: doctorId,
          patient_id: patientId,
          starts_at: startsAt,
          ends_at: endsAt,
          reason: reason.trim() || null,
          source: 'staff',
        });
      } catch (err: any) {
        // Fallback for local session / offline creation
        createdAppt = {
          id: `appt-${Date.now()}`,
          clinic_id: 'clinic-a',
          patient_id: patientId,
          doctor_id: doctorId,
          starts_at: startsAt,
          ends_at: endsAt,
          status: 'scheduled',
          reason: reason.trim() || 'Consultation',
          source: 'staff',
          cancelled_at: null,
          cancel_reason: null,
          created_by: doctorId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          doctor: { id: doctorId, full_name: doctorName },
        };
      }

      // Enrich and cache locally so it displays immediately on the timetable
      if (effectivePatient) {
        createdAppt.patient = {
          id: effectivePatient.id,
          first_name: effectivePatient.first_name,
          last_name: effectivePatient.last_name,
          phone: effectivePatient.phone,
          cin: effectivePatient.cin,
        };
      }

      const cachedAppts = getOfflineAppointments();
      saveOfflineAppointments([
        createdAppt,
        ...cachedAppts.filter((a: any) => a.id !== createdAppt.id),
      ]);

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
                    <div className="flex items-center justify-between p-3.5 bg-terracotta-50/80 border border-terracotta-200 rounded-xl shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-terracotta-700 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                          {`${selectedPatient.first_name[0] || ''}${selectedPatient.last_name[0] || ''}`.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">
                            {selectedPatient.first_name} {selectedPatient.last_name}
                          </p>
                          <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                            {selectedPatient.cin && (
                              <span className="font-mono bg-sand-200/90 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                CIN: {selectedPatient.cin}
                              </span>
                            )}
                            <span className="font-mono text-slate-500">{selectedPatient.phone || 'Sans contact'}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPatient(null)}
                        className="text-terracotta-700 hover:text-terracotta-900 hover:bg-terracotta-100 rounded-xl text-xs font-semibold"
                      >
                        Changer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        id="patient-search"
                        type="search"
                        placeholder="Rechercher par nom, CIN (ex: BE492019) ou tél..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        autoComplete="off"
                        className="rounded-xl border-sand-300 focus:border-terracotta-500 text-xs"
                      />
                      <div className="max-h-48 overflow-y-auto border border-sand-200 rounded-xl divide-y divide-sand-100 bg-white shadow-2xs">
                        {searchingPatients ? (
                          <div className="p-4 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-terracotta-500 animate-ping" />
                            <span>Recherche clinique en cours...</span>
                          </div>
                        ) : patientList.length === 0 ? (
                          <div className="p-4 text-xs text-slate-500 text-center space-y-2">
                            <p>Aucun patient trouvé avec ce critère.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setPatientMode('new');
                                const parts = patientSearch.trim().split(' ');
                                if (parts.length >= 2) {
                                  setNewFirstName(parts[0]);
                                  setNewLastName(parts.slice(1).join(' '));
                                } else if (parts.length === 1 && !/^[A-Z]{1,2}\d+$/i.test(parts[0])) {
                                  setNewLastName(parts[0]);
                                } else if (/^[A-Z]{1,2}\d+$/i.test(parts[0])) {
                                  setNewCin(parts[0].toUpperCase());
                                }
                              }}
                              className="text-terracotta-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>+ Créer immédiatement &quot;{patientSearch || 'Nouveau Patient'}&quot;</span>
                            </button>
                          </div>
                        ) : (
                          patientList.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPatient(p)}
                              className="w-full text-left p-3 hover:bg-sand-50/80 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-sand-200/90 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-terracotta-100 group-hover:text-terracotta-800 transition">
                                  {`${p.first_name[0] || ''}${p.last_name[0] || ''}`.toUpperCase()}
                                </div>
                                <div className="truncate">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 group-hover:text-terracotta-700 transition">
                                      {p.first_name} {p.last_name}
                                    </span>
                                    {p.cin && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sand-200/90 text-slate-800">
                                        {p.cin}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="text-slate-500 font-mono text-[11px] shrink-0">{p.phone || '—'}</span>
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
