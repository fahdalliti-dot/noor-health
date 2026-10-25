'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export interface Slot {
  start: string;
  end: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string | null;
  doctor_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  reason: string | null;
  source: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  doctor: { id: string; full_name: string };
}

export interface WorkingHours {
  id: string;
  clinic_id: string;
  doctor_id: string;
  weekday: number;
  start_minutes: number;
  end_minutes: number;
  slot_length_minutes: number;
  is_active: boolean;
}

export interface TimeOff {
  id: string;
  clinic_id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
}

export function useAgenda() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(
    async (params: { from?: string; to?: string; doctor_id?: string; status?: string }) => {
      if (!user) return [];
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (params.from) query.set('from', params.from);
        if (params.to) query.set('to', params.to);
        if (params.doctor_id) query.set('doctor_id', params.doctor_id);
        if (params.status) query.set('status', params.status);

        const res = await api.get<{ appointments: Appointment[] }>(
          `/appointments?${query.toString()}`,
        );
        return res.data.appointments;
      } catch (e: any) {
        setError(e.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const fetchAvailability = useCallback(
    async (doctorId: string, date: string, slotLength = 30) => {
      const res = await api.get<{
        slots: Slot[];
        date: string;
        timezone: string;
      }>(`/doctors/${doctorId}/availability?date=${date}&slot_length=${slotLength}`);
      return res.data;
    },
    [],
  );

  const createAppointment = useCallback(
    async (body: {
      patient_id?: string | null;
      doctor_id: string;
      starts_at: string;
      ends_at: string;
      reason?: string | null;
      source?: string;
      idempotency_key?: string;
    }) => {
      const res = await api.post<{ appointment: Appointment }>('/appointments', body);
      return res.data.appointment;
    },
    [],
  );

  const reschedule = useCallback(
    async (id: string, body: { starts_at?: string; ends_at?: string; reason?: string | null; doctor_id?: string }, ifMatch?: string) => {
      const res = await api.patch<{ appointment: Appointment }>(`/appointments/${id}`, body, {
        'If-Match': ifMatch || '',
      });
      return res.data.appointment;
    },
    [],
  );

  const changeStatus = useCallback(
    async (id: string, body: { status: string; cancel_reason?: string | null }) => {
      const res = await api.post<{ appointment: Appointment }>(`/appointments/${id}/status`, body);
      return res.data.appointment;
    },
    [],
  );

  const fetchWorkingHours = useCallback(
    async (doctorId: string) => {
      const res = await api.get<{ working_hours: WorkingHours[] }>(`/doctors/${doctorId}/working-hours`);
      return res.data.working_hours;
    },
    [],
  );

  const fetchTimeOff = useCallback(
    async (doctorId: string) => {
      const res = await api.get<{ time_off: TimeOff[] }>(`/doctors/${doctorId}/time-off`);
      return res.data.time_off;
    },
    [],
  );

  const createWorkingHours = useCallback(
    async (doctorId: string, body: {
      weekday: number;
      start_minutes: number;
      end_minutes: number;
      slot_length_minutes?: number;
      is_active?: boolean;
    }) => {
      const res = await api.post<{ working_hours: WorkingHours }>(`/doctors/${doctorId}/working-hours`, body);
      return res.data.working_hours;
    },
    [],
  );

  const updateWorkingHours = useCallback(
    async (doctorId: string, whId: string, body: {
      start_minutes?: number;
      end_minutes?: number;
      slot_length_minutes?: number;
      is_active?: boolean;
    }) => {
      const res = await api.patch<{ working_hours: WorkingHours }>(`/doctors/${doctorId}/working-hours/${whId}`, body);
      return res.data.working_hours;
    },
    [],
  );

  const deleteWorkingHours = useCallback(
    async (doctorId: string, whId: string) => {
      await api.delete(`/doctors/${doctorId}/working-hours/${whId}`);
    },
    [],
  );

  const createTimeOff = useCallback(
    async (doctorId: string, body: { start_at: string; end_at: string; reason?: string | null }) => {
      const res = await api.post<{ time_off: TimeOff }>(`/doctors/${doctorId}/time-off`, body);
      return res.data.time_off;
    },
    [],
  );

  const deleteTimeOff = useCallback(
    async (doctorId: string, toId: string) => {
      await api.delete(`/doctors/${doctorId}/time-off/${toId}`);
    },
    [],
  );

  return {
    user,
    loading,
    error,
    fetchAppointments,
    fetchAvailability,
    createAppointment,
    reschedule,
    changeStatus,
    fetchWorkingHours,
    fetchTimeOff,
    createWorkingHours,
    updateWorkingHours,
    deleteWorkingHours,
    createTimeOff,
    deleteTimeOff,
  };
}