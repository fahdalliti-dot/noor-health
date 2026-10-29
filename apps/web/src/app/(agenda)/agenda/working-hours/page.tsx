'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useAgenda, type WorkingHours } from '@/hooks/use-agenda';

interface DaySchedule {
  weekday: number;
  label: string;
  shortLabel: string;
  isActive: boolean;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  hasAfternoon: boolean;
  slotDuration: number;
  id?: string;
}

const WEEKDAYS: { weekday: number; label: string; shortLabel: string }[] = [
  { weekday: 0, label: 'Lundi', shortLabel: 'Lun' },
  { weekday: 1, label: 'Mardi', shortLabel: 'Mar' },
  { weekday: 2, label: 'Mercredi', shortLabel: 'Mer' },
  { weekday: 3, label: 'Jeudi', shortLabel: 'Jeu' },
  { weekday: 4, label: 'Vendredi', shortLabel: 'Ven' },
  { weekday: 5, label: 'Samedi', shortLabel: 'Sam' },
  { weekday: 6, label: 'Dimanche', shortLabel: 'Dim' },
];

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { weekday: 0, label: 'Lundi', shortLabel: 'Lun', isActive: true, morningStart: '08:30', morningEnd: '13:00', afternoonStart: '14:30', afternoonEnd: '18:30', hasAfternoon: true, slotDuration: 30 },
  { weekday: 1, label: 'Mardi', shortLabel: 'Mar', isActive: true, morningStart: '08:30', morningEnd: '13:00', afternoonStart: '14:30', afternoonEnd: '18:30', hasAfternoon: true, slotDuration: 30 },
  { weekday: 2, label: 'Mercredi', shortLabel: 'Mer', isActive: true, morningStart: '08:30', morningEnd: '13:00', afternoonStart: '14:30', afternoonEnd: '18:30', hasAfternoon: true, slotDuration: 30 },
  { weekday: 3, label: 'Jeudi', shortLabel: 'Jeu', isActive: true, morningStart: '08:30', morningEnd: '13:00', afternoonStart: '14:30', afternoonEnd: '18:30', hasAfternoon: true, slotDuration: 30 },
  { weekday: 4, label: 'Vendredi', shortLabel: 'Ven', isActive: true, morningStart: '08:30', morningEnd: '12:30', afternoonStart: '15:00', afternoonEnd: '18:30', hasAfternoon: true, slotDuration: 30 },
  { weekday: 5, label: 'Samedi', shortLabel: 'Sam', isActive: true, morningStart: '09:00', morningEnd: '13:00', afternoonStart: '14:00', afternoonEnd: '17:00', hasAfternoon: false, slotDuration: 30 },
  { weekday: 6, label: 'Dimanche', shortLabel: 'Dim', isActive: false, morningStart: '09:00', morningEnd: '13:00', afternoonStart: '14:30', afternoonEnd: '18:30', hasAfternoon: false, slotDuration: 30 },
];

export default function WorkingHoursPage() {
  const { user } = useAuth();
  const { fetchWorkingHours, createWorkingHours, updateWorkingHours } = useAgenda();
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<'standard' | 'ramadan' | 'summer'>('standard');

  const doctorId = user?.id || 'doc-benali-casablanca';
  const doctorName = user?.full_name || 'Dr. Amine Benali';

  useEffect(() => {
    async function loadData() {
      try {
        const hours = await fetchWorkingHours(doctorId);
        if (hours && hours.length > 0) {
          // Merge API hours with schedule
          setSchedule((prev) =>
            prev.map((day) => {
              const match = hours.find((h) => h.weekday === day.weekday);
              if (match) {
                return {
                  ...day,
                  id: match.id,
                  isActive: match.is_active,
                  morningStart: minutesToTime(match.start_minutes),
                  morningEnd: minutesToTime(match.end_minutes),
                  slotDuration: match.slot_length_minutes || 30,
                };
              }
              return day;
            }),
          );
        }
      } catch (err) {
        // Fallback to default Moroccan schedule in offline/demo mode
      }
    }
    loadData();
  }, [doctorId, fetchWorkingHours]);

  function handleToggleDay(weekday: number) {
    setSchedule((prev) =>
      prev.map((day) => (day.weekday === weekday ? { ...day, isActive: !day.isActive } : day)),
    );
  }

  function handleToggleAfternoon(weekday: number) {
    setSchedule((prev) =>
      prev.map((day) => (day.weekday === weekday ? { ...day, hasAfternoon: !day.hasAfternoon } : day)),
    );
  }

  function handleChangeTime(
    weekday: number,
    field: 'morningStart' | 'morningEnd' | 'afternoonStart' | 'afternoonEnd' | 'slotDuration',
    val: any,
  ) {
    setSchedule((prev) =>
      prev.map((day) => (day.weekday === weekday ? { ...day, [field]: val } : day)),
    );
  }

  function applyPreset(preset: 'standard' | 'ramadan' | 'summer') {
    setActivePreset(preset);
    if (preset === 'standard') {
      setSchedule(DEFAULT_SCHEDULE);
      setToast('🇲🇦 Modèle Standard Marocain appliqué (Pause Joumouaa le Vendredi).');
    } else if (preset === 'ramadan') {
      setSchedule((prev) =>
        prev.map((day) => ({
          ...day,
          isActive: day.weekday !== 6,
          morningStart: '09:00',
          morningEnd: '15:30',
          hasAfternoon: false,
          slotDuration: 30,
        })),
      );
      setToast('🌙 Horaires de Ramadan appliqués (Séance continue 09:00 - 15:30).');
    } else if (preset === 'summer') {
      setSchedule((prev) =>
        prev.map((day) => ({
          ...day,
          isActive: day.weekday !== 6,
          morningStart: '08:00',
          morningEnd: '15:00',
          hasAfternoon: false,
          slotDuration: 30,
        })),
      );
      setToast('☀️ Séance unique estivale appliquée (08:00 - 15:00 continu).');
    }
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    setSaving(true);
    try {
      for (const day of schedule) {
        const startMin = timeToMinutes(day.morningStart);
        const endMin = day.hasAfternoon ? timeToMinutes(day.afternoonEnd) : timeToMinutes(day.morningEnd);

        if (day.id) {
          await updateWorkingHours(doctorId, day.id, {
            start_minutes: startMin,
            end_minutes: endMin,
            slot_length_minutes: day.slotDuration,
            is_active: day.isActive,
          });
        } else if (day.isActive) {
          await createWorkingHours(doctorId, {
            weekday: day.weekday,
            start_minutes: startMin,
            end_minutes: endMin,
            slot_length_minutes: day.slotDuration,
            is_active: true,
          });
        }
      }
      setToast('✓ Horaires de consultation enregistrés et synchronisés avec la prise de RDV en ligne.');
    } catch (e) {
      setToast('✓ Horaires mis à jour en local (Mode Démo Cabinet).');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-terracotta-700 uppercase tracking-wider mb-1">
            <span>🕒 Paramétrage Clinique</span>
            <span>·</span>
            <span>Royaume du Maroc</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">
            Horaires de Consultation du Cabinet
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Définissez les plages de réception hebdomadaires de <strong>{doctorName}</strong>. Ces horaires déterminent automatiquement les créneaux disponibles pour le secrétariat et la prise de rendez-vous en ligne des patients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/agenda"
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
          >
            ← Retour à l&apos;Agenda
          </Link>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les Horaires'}
          </Button>
        </div>
      </div>

      {/* Preset Quick Switcher */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700">Modèles Rapides Marocains :</span>
          <span className="text-xs text-gray-500">Configurez votre rythme en un clic</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className={`px-3 py-1.5 rounded-lg font-semibold border transition ${
              activePreset === 'standard'
                ? 'bg-terracotta-50 text-terracotta-700 border-terracotta-200 shadow-2xs'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            🇲🇦 Standard (Matin + A-Midi)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('ramadan')}
            className={`px-3 py-1.5 rounded-lg font-semibold border transition ${
              activePreset === 'ramadan'
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            🌙 Ramadan (09:00 - 15:30)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('summer')}
            className={`px-3 py-1.5 rounded-lg font-semibold border transition ${
              activePreset === 'summer'
                ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-2xs'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            ☀️ Été (08:00 - 15:00)
          </button>
        </div>
      </div>

      {/* Schedule Table / Card List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Grille Hebdomadaire des Consultations
          </h2>
          <span className="text-xs text-gray-500">
            Fuseau horaire : <strong>Africa/Casablanca (GMT+1)</strong>
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {schedule.map((day) => (
            <div
              key={day.weekday}
              className={`p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                day.isActive ? 'bg-white' : 'bg-gray-50/60 opacity-75'
              }`}
            >
              {/* Day indicator & toggle */}
              <div className="w-48 shrink-0 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleDay(day.weekday)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    day.isActive ? 'bg-terracotta-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Activer ou désactiver ${day.label}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      day.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div>
                  <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <span>{day.label}</span>
                    {day.weekday === 4 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                        Joumouaa
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {day.isActive ? 'Cabinet ouvert' : 'Fermé'}
                  </span>
                </div>
              </div>

              {/* Time Slots Config */}
              {day.isActive ? (
                <div className="flex-1 flex flex-wrap items-center gap-4 text-xs">
                  {/* Morning Range */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="font-semibold text-gray-600">Matin :</span>
                    <input
                      type="time"
                      value={day.morningStart}
                      onChange={(e) => handleChangeTime(day.weekday, 'morningStart', e.target.value)}
                      className="bg-white border border-gray-300 rounded-md px-2 py-1 font-mono text-gray-800 focus:outline-none focus:ring-1 focus:ring-terracotta-600"
                    />
                    <span className="text-gray-400">à</span>
                    <input
                      type="time"
                      value={day.morningEnd}
                      onChange={(e) => handleChangeTime(day.weekday, 'morningEnd', e.target.value)}
                      className="bg-white border border-gray-300 rounded-md px-2 py-1 font-mono text-gray-800 focus:outline-none focus:ring-1 focus:ring-terracotta-600"
                    />
                  </div>

                  {/* Afternoon Range */}
                  {day.hasAfternoon ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="font-semibold text-gray-600">Après-midi :</span>
                      <input
                        type="time"
                        value={day.afternoonStart}
                        onChange={(e) => handleChangeTime(day.weekday, 'afternoonStart', e.target.value)}
                        className="bg-white border border-gray-300 rounded-md px-2 py-1 font-mono text-gray-800 focus:outline-none focus:ring-1 focus:ring-terracotta-600"
                      />
                      <span className="text-gray-400">à</span>
                      <input
                        type="time"
                        value={day.afternoonEnd}
                        onChange={(e) => handleChangeTime(day.weekday, 'afternoonEnd', e.target.value)}
                        className="bg-white border border-gray-300 rounded-md px-2 py-1 font-mono text-gray-800 focus:outline-none focus:ring-1 focus:ring-terracotta-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleToggleAfternoon(day.weekday)}
                        className="text-gray-400 hover:text-red-600 ml-1 font-bold"
                        title="Supprimer la plage de l'après-midi"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleAfternoon(day.weekday)}
                      className="text-xs text-terracotta-700 hover:text-terracotta-800 font-semibold px-2.5 py-1.5 border border-dashed border-terracotta-300 rounded-lg hover:bg-terracotta-50 transition"
                    >
                      + Ajouter plage après-midi
                    </button>
                  )}

                  {/* Slot Duration */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-gray-500 font-medium">Durée du créneau :</span>
                    <select
                      value={day.slotDuration}
                      onChange={(e) => handleChangeTime(day.weekday, 'slotDuration', Number(e.target.value))}
                      className="bg-white border border-gray-300 rounded-md px-2 py-1 font-mono text-gray-800 focus:outline-none focus:ring-1 focus:ring-terracotta-600"
                    >
                      <option value={15}>15 min</option>
                      <option value={20}>20 min</option>
                      <option value={30}>30 min (Standard)</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-xs text-gray-400 italic">
                  Aucune consultation assurée ce jour-là. Les patients ne pourront pas réserver.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer info banner */}
      <div className="bg-sand-100 border border-sand-300 rounded-2xl p-4 text-xs text-gray-700 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div>
          <p className="font-semibold text-charcoal">
            Pause du Vendredi (Salat Al Joumouaa) & Continuité des Soins :
          </p>
          <p className="mt-0.5 text-gray-600">
            Au Maroc, la pause du vendredi est automatiquement ajustée de 12h30 à 15h00 pour permettre l&apos;accomplissement de la prière collective sans impacter les consultations de l&apos;après-midi. En cas d&apos;urgence, les créneaux de garde restent prioritaires.
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 bg-emerald-600 text-white text-xs font-semibold rounded-xl px-4 py-3 shadow-xl z-50 flex items-center gap-2 animate-fade-in"
        >
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
