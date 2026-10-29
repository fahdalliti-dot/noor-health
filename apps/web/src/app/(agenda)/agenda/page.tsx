'use client';

import { useEffect, useState, useMemo } from 'react';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/auth';
import { useAgenda, type Appointment } from '@/hooks/use-agenda';
import { AgendaDayView } from '@/components/agenda-day-view';
import { AgendaWeekView } from '@/components/agenda-week-view';
import { NewAppointmentModal } from '@/components/new-appointment-modal';
import { ClinicalInspector } from '@/components/clinical-inspector';
import { CommandPalette } from '@/components/command-palette';
import { WhatsAppReminderModal } from '@/components/whatsapp-reminder-modal';
import { CashDeskModal } from '@/components/cash-desk-modal';
import { PrescriptionModal } from '@/components/prescription-modal';
import { InsuranceClaimModal } from '@/components/insurance-claim-modal';
import { MedicalCertificateModal } from '@/components/medical-certificate-modal';
import { PediatricTrackerModal } from '@/components/pediatric-tracker-modal';
import { DentalOdontogramModal } from '@/components/specialties/dental-odontogram-modal';
import { ObstetricTrackerModal } from '@/components/specialties/obstetric-tracker-modal';
import { TeleconsultRoomModal } from '@/components/teleconsult-room-modal';
import { CmiPaymentModal } from '@/components/cmi-payment-modal';
import { InventoryManagerModal } from '@/components/inventory-manager-modal';
import { PublicBookingLinkModal } from '@/components/public-booking-link-modal';
import Button from '@/components/ui/button';
import {
  getOfflineAppointments,
  saveOfflineAppointments,
  queueOfflineMutation,
} from '@/lib/offline/offline-store';

const TZ = 'Africa/Casablanca';

const DEFAULT_DEMO_USER = {
  id: 'doc-benali-casablanca',
  clinic_id: 'clinic-a',
  role: 'doctor',
  is_clinic_admin: true,
  full_name: 'Dr. Amine Benali',
  email: 'doctor@clinic-a.test',
};

function createDemoAppointments(date: Date, userObj: any): Appointment[] {
  const d = DateTime.fromJSDate(date).setZone(TZ);
  const docId = userObj?.id || DEFAULT_DEMO_USER.id;
  const docName = userObj?.full_name || DEFAULT_DEMO_USER.full_name;
  const clinicId = userObj?.clinic_id || DEFAULT_DEMO_USER.clinic_id;

  return [
    {
      id: 'appt-demo-1',
      clinic_id: clinicId,
      patient_id: 'p-1',
      doctor_id: docId,
      starts_at: d.set({ hour: 9, minute: 0, second: 0, millisecond: 0 }).toISO()!,
      ends_at: d.set({ hour: 9, minute: 30, second: 0, millisecond: 0 }).toISO()!,
      status: 'completed',
      reason: 'Consultation de contrôle cardiologie annuelle',
      source: 'staff',
      cancelled_at: null,
      cancel_reason: null,
      created_by: docId,
      created_at: d.toISO()!,
      updated_at: d.toISO()!,
      doctor: { id: docId, full_name: docName },
      patient: { id: 'p-1', first_name: 'Yassine', last_name: 'Mansouri', phone: '+212661234567', cin: 'BE492019' },
    },
    {
      id: 'appt-demo-2',
      clinic_id: clinicId,
      patient_id: 'p-2',
      doctor_id: docId,
      starts_at: d.set({ hour: 9, minute: 30, second: 0, millisecond: 0 }).toISO()!,
      ends_at: d.set({ hour: 10, minute: 0, second: 0, millisecond: 0 }).toISO()!,
      status: 'in_progress',
      reason: 'Consultation & Bilan clinique spécialisé',
      source: 'staff',
      cancelled_at: null,
      cancel_reason: null,
      created_by: docId,
      created_at: d.toISO()!,
      updated_at: d.toISO()!,
      doctor: { id: docId, full_name: docName },
      patient: { id: 'p-2', first_name: 'Fatima Zahra', last_name: 'Alami', phone: '+212662998877', cin: 'BK829104' },
    },
    {
      id: 'appt-demo-3',
      clinic_id: clinicId,
      patient_id: 'p-3',
      doctor_id: docId,
      starts_at: d.set({ hour: 10, minute: 0, second: 0, millisecond: 0 }).toISO()!,
      ends_at: d.set({ hour: 10, minute: 30, second: 0, millisecond: 0 }).toISO()!,
      status: 'arrived',
      reason: 'Suivi de grossesse & contrôle pédiatrique',
      source: 'staff',
      cancelled_at: null,
      cancel_reason: null,
      created_by: docId,
      created_at: d.toISO()!,
      updated_at: d.toISO()!,
      doctor: { id: docId, full_name: docName },
      patient: { id: 'p-3', first_name: 'Khadija', last_name: 'Tazi', phone: '+212663445566', cin: 'A928301' },
    },
    {
      id: 'appt-demo-4',
      clinic_id: clinicId,
      patient_id: 'p-4',
      doctor_id: docId,
      starts_at: d.set({ hour: 10, minute: 30, second: 0, millisecond: 0 }).toISO()!,
      ends_at: d.set({ hour: 11, minute: 0, second: 0, millisecond: 0 }).toISO()!,
      status: 'arrived',
      reason: 'Examen bucco-dentaire & détartrage',
      source: 'staff',
      cancelled_at: null,
      cancel_reason: null,
      created_by: docId,
      created_at: d.toISO()!,
      updated_at: d.toISO()!,
      doctor: { id: docId, full_name: docName },
      patient: { id: 'p-4', first_name: 'Omar', last_name: 'Bennani', phone: '+212664556677', cin: 'C102938' },
    },
    {
      id: 'appt-demo-5',
      clinic_id: clinicId,
      patient_id: 'p-5',
      doctor_id: docId,
      starts_at: d.set({ hour: 11, minute: 30, second: 0, millisecond: 0 }).toISO()!,
      ends_at: d.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).toISO()!,
      status: 'scheduled',
      reason: 'Vaccination PNI & Suivi pédiatrique',
      source: 'whatsapp',
      cancelled_at: null,
      cancel_reason: null,
      created_by: docId,
      created_at: d.toISO()!,
      updated_at: d.toISO()!,
      doctor: { id: docId, full_name: docName },
      patient: { id: 'p-5', first_name: 'Mehdi', last_name: 'Chraibi', phone: '+212665112233', cin: 'D554433' },
    },
    {
      id: 'appt-demo-6',
      clinic_id: clinicId,
      patient_id: 'p-6',
      doctor_id: docId,
      starts_at: d.set({ hour: 14, minute: 30, second: 0, millisecond: 0 }).toISO()!,
      ends_at: d.set({ hour: 15, minute: 0, second: 0, millisecond: 0 }).toISO()!,
      status: 'confirmed',
      reason: 'Échographie obstétrique T2 morphologique',
      source: 'whatsapp',
      cancelled_at: null,
      cancel_reason: null,
      created_by: docId,
      created_at: d.toISO()!,
      updated_at: d.toISO()!,
      doctor: { id: docId, full_name: docName },
      patient: { id: 'p-6', first_name: 'Souad', last_name: 'Berrada', phone: '+212666778899', cin: 'F789012' },
    },
    {
      id: 'appt-demo-7',
      clinic_id: clinicId,
      patient_id: 'p-7',
      doctor_id: docId,
      starts_at: d.set({ hour: 16, minute: 0, second: 0, millisecond: 0 }).toISO()!,
      ends_at: d.set({ hour: 16, minute: 30, second: 0, millisecond: 0 }).toISO()!,
      status: 'scheduled',
      reason: 'Bilan hypertension & renouvellement ordonnance',
      source: 'staff',
      cancelled_at: null,
      cancel_reason: null,
      created_by: docId,
      created_at: d.toISO()!,
      updated_at: d.toISO()!,
      doctor: { id: docId, full_name: docName },
      patient: { id: 'p-7', first_name: 'Tarik', last_name: 'El Fassi', phone: '+212667889900', cin: 'G345678' },
    },
  ];
}

export default function AgendaPage() {
  const { user } = useAuth();
  const activeUser = user || DEFAULT_DEMO_USER;
  const {
    fetchAppointments,
    changeStatus,
  } = useAgenda();

  const [view, setView] = useState<'day' | 'week'>('day');
  const [cursor, setCursor] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const cached = getOfflineAppointments();
    if (cached && cached.length > 0) return cached;
    return createDemoAppointments(new Date(), DEFAULT_DEMO_USER);
  });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Phase 2, 3, 4 Modal States
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [cashDeskOpen, setCashDeskOpen] = useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [insuranceClaimOpen, setInsuranceClaimOpen] = useState(false);

  // Advanced Waves (Specialty, Teleconsult, CMI, Inventory)
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [pediatricOpen, setPediatricOpen] = useState(false);
  const [dentalOpen, setDentalOpen] = useState(false);
  const [obstetricOpen, setObstetricOpen] = useState(false);
  const [teleconsultOpen, setTeleconsultOpen] = useState(false);
  const [cmiPaymentOpen, setCmiPaymentOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [bookingLinkOpen, setBookingLinkOpen] = useState(false);

  const isDoctor = activeUser.role === 'doctor';
  const isSecretary = activeUser.role === 'secretary';
  const doctorId = isDoctor ? activeUser.id : undefined;

  async function load() {
    setLoading(true);
    try {
      const start = DateTime.fromJSDate(cursor).setZone(TZ).startOf(view === 'day' ? 'day' : 'week').toISO();
      const end = DateTime.fromJSDate(cursor).setZone(TZ).endOf(view === 'day' ? 'day' : 'week').toISO();
      let list: Appointment[] = [];
      if (user) {
        try {
          list = await fetchAppointments({
            from: start!,
            to: end!,
            doctor_id: doctorId,
          });
        } catch {
          list = [];
        }
      }
      const resolvedList = list && list.length > 0 ? list : createDemoAppointments(cursor, activeUser);
      setAppointments(resolvedList);
      saveOfflineAppointments(resolvedList);

      // Keep inspector sync if an appointment was selected
      if (selectedAppt) {
        const refreshed = resolvedList.find((a) => a.id === selectedAppt.id);
        if (refreshed) setSelectedAppt(refreshed);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Real-time desk sync (30-second heartbeat)
    const interval = setInterval(() => {
      load();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, view, user?.id, user?.role]);

  // Real-time waiting room queue
  const waitingRoomPatients = useMemo(() => {
    return appointments.filter((a) => a.status === 'arrived');
  }, [appointments]);

  function shift(delta: number) {
    setCursor((c) => {
      const d = DateTime.fromJSDate(c).setZone(TZ);
      return d.plus({ [view === 'day' ? 'days' : 'weeks']: delta }).toJSDate();
    });
  }

  function title() {
    const d = DateTime.fromJSDate(cursor).setZone(TZ);
    if (view === 'day') return d.toFormat('cccc d LLLL yyyy');
    const start = d.startOf('week');
    return `Semaine du ${start.toFormat('dd LLL')} – ${start.plus({ days: 6 }).toFormat('dd LLL yyyy')}`;
  }

  function handleSlotClick(slot: any) {
    setSelectedSlot(slot);
    setModalOpen(true);
  }

  async function handleCreate() {
    await load();
    setModalOpen(false);
    setToast('Rendez-vous créé avec succès');
    setTimeout(() => setToast(null), 3000);
  }

  async function handleStatusChange(newStatus: string, reason?: string | null) {
    if (!selectedAppt) return;
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (isOffline) {
      queueOfflineMutation('UPDATE_APPOINTMENT_STATUS', {
        id: selectedAppt.id,
        status: newStatus,
        cancel_reason: reason,
      });

      const updated = appointments.map((a) =>
        a.id === selectedAppt.id
          ? {
              ...a,
              status: newStatus,
              cancel_reason: reason || a.cancel_reason,
              cancelled_at: newStatus === 'cancelled' ? new Date().toISOString() : a.cancelled_at,
            }
          : a
      );
      setAppointments(updated);
      saveOfflineAppointments(updated);
      const target = updated.find((a) => a.id === selectedAppt.id);
      if (target) setSelectedAppt(target);

      setToast(`Statut mis à jour (Hors-ligne 🇲🇦) : ${newStatus}`);
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      await changeStatus(selectedAppt.id, { status: newStatus, cancel_reason: reason });
      await load();
      setToast(`Statut mis à jour : ${newStatus}`);
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Center Workbench (Agenda + Toolbar + Waiting Room Queue) */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {/* Waiting Room Real-Time Strip */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" aria-hidden="true" />
              <span className="font-semibold text-amber-900">Salle d&apos;attente : </span>
              <span className="font-bold text-amber-800">
                {waitingRoomPatients.length} patient{waitingRoomPatients.length > 1 ? 's' : ''}
              </span>
            </div>

            {waitingRoomPatients.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <AnimatePresence>
                  {waitingRoomPatients.map((p) => {
                    const pName = p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : 'Patient';
                    const pStart = DateTime.fromISO(p.starts_at).setZone(TZ);
                    const waitMinutes = Math.max(0, Math.floor(DateTime.now().setZone(TZ).diff(pStart, 'minutes').minutes));
                    const isLongWait = waitMinutes >= 30;
                    const isMediumWait = waitMinutes >= 15 && waitMinutes < 30;

                    return (
                      <motion.button
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedAppt(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isLongWait
                            ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold animate-pulse'
                            : isMediumWait
                            ? 'bg-amber-100/90 border-amber-300 text-amber-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <span>🪑 {pName}</span>
                        <span className="font-mono text-[10px] opacity-80">
                          ({waitMinutes}m)
                        </span>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer shadow-2xs"
            >
              <span>🔍</span>
              <span className="text-[11px]">Rechercher...</span>
              <kbd className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 rounded">⌘K</kbd>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shrink-0 shadow-xs">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => shift(-1)}>
              ‹
            </Button>
            <h2 className="text-sm font-bold text-slate-900 px-2 min-w-[200px] text-center capitalize flex items-center justify-center gap-1.5">
              <span>{title()}</span>
              {loading && (
                <span className="inline-block w-2 h-2 rounded-full bg-terracotta-500 animate-ping" title="Synchronisation..." />
              )}
            </h2>
            <Button variant="outline" size="sm" onClick={() => shift(1)}>
              ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(new Date())}
              className="ms-1 text-xs"
            >
              Aujourd&apos;hui
            </Button>
          </div>

          {/* Right: Quick Clinical Desk Tools & View Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Desk Action Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setInventoryOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold cursor-pointer border border-slate-200 shadow-2xs hover:text-slate-900 transition"
                title="Consommables et stocks du cabinet"
              >
                <span>📦</span>
                <span>Stocks</span>
              </button>

              <button
                type="button"
                onClick={() => setBookingLinkOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 rounded-md text-xs font-semibold border border-terracotta-200 shadow-2xs transition cursor-pointer"
                title="Lien public et QR Code de prise de rendez-vous en ligne"
              >
                <span>🌐</span>
                <span>Lien RDV Public</span>
              </button>

              <button
                type="button"
                onClick={() => setCashDeskOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs transition"
                title="Journal des règlements et clôture de caisse du jour"
              >
                <span>💰</span>
                <span>Caisse du Jour</span>
              </button>
            </div>

            <div className="relative inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs font-medium">
              <button
                type="button"
                onClick={() => setView('day')}
                className={`relative px-3 py-1 rounded-md transition-colors cursor-pointer z-10 ${
                  view === 'day' ? 'text-terracotta-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {view === 'day' && (
                  <motion.div
                    layoutId="activeAgendaViewTab"
                    className="absolute inset-0 bg-white rounded-md shadow-2xs -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                Jour
              </button>
              <button
                type="button"
                onClick={() => setView('week')}
                className={`relative px-3 py-1 rounded-md transition-colors cursor-pointer z-10 ${
                  view === 'week' ? 'text-terracotta-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {view === 'week' && (
                  <motion.div
                    layoutId="activeAgendaViewTab"
                    className="absolute inset-0 bg-white rounded-md shadow-2xs -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                Semaine
              </button>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSelectedSlot(null);
                setModalOpen(true);
              }}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold"
            >
              + Nouveau RDV
            </Button>
          </div>
        </div>

        {/* Timeline View */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {appointments.length === 0 && loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              Chargement des consultations...
            </div>
          ) : view === 'day' ? (
            <AgendaDayView
              date={cursor}
              timezone={TZ}
              slotMinutes={30}
              appointments={appointments}
              onSlotClick={handleSlotClick}
              onAppointmentClick={(appt) => setSelectedAppt(appt)}
              doctorId={doctorId}
              selectedApptId={selectedAppt?.id}
            />
          ) : (
            <AgendaWeekView
              weekStart={DateTime.fromJSDate(cursor).setZone(TZ).startOf('week').toJSDate()}
              timezone={TZ}
              slotMinutes={30}
              appointments={appointments}
              doctors={[] as any[]}
              onSlotClick={(_docId, slot) => {
                setSelectedSlot(slot);
                setModalOpen(true);
              }}
              onAppointmentClick={(appt) => setSelectedAppt(appt)}
            />
          )}
        </div>
      </div>

      {/* Right Contextual Inspector (Zero-Modal Workflow) */}
      <AnimatePresence>
        {selectedAppt && (
          <ClinicalInspector
            key={selectedAppt.id}
            appointment={selectedAppt}
            onClose={() => setSelectedAppt(null)}
            timezone={TZ}
            isDoctor={isDoctor}
            isSecretary={isSecretary}
            doctorId={doctorId}
            onStatusChange={handleStatusChange}
            onOpenWhatsApp={() => setWhatsAppOpen(true)}
            onOpenCashDesk={() => setCashDeskOpen(true)}
            onOpenPrescription={() => setPrescriptionOpen(true)}
            onOpenInsuranceClaim={() => setInsuranceClaimOpen(true)}
            onOpenCertificate={() => setCertificateOpen(true)}
            onOpenPediatric={() => setPediatricOpen(true)}
            onOpenDental={() => setDentalOpen(true)}
            onOpenObstetric={() => setObstetricOpen(true)}
            onOpenTeleconsult={() => setTeleconsultOpen(true)}
            onOpenCmiPayment={() => setCmiPaymentOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Global Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelectPatient={(p) => {
          setSelectedSlot(null);
          setModalOpen(true);
        }}
        onAction={(act) => {
          if (act === 'today') setCursor(new Date());
          if (act === 'new_appointment') setModalOpen(true);
        }}
      />

      {/* New Appointment Modal */}
      <NewAppointmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        doctorId={doctorId || user?.id || ''}
        doctorName={user?.full_name || ''}
        timezone={TZ}
        defaultSlot={selectedSlot || undefined}
        defaultDate={cursor}
        onSuccess={handleCreate}
      />

      {/* Phase 2: WhatsApp / SMS Reminder Modal */}
      <WhatsAppReminderModal
        open={whatsAppOpen}
        onOpenChange={setWhatsAppOpen}
        appointment={selectedAppt}
        timezone={TZ}
        onReminderSent={load}
      />

      {/* Phase 2: Cash & Cheque Register Modal */}
      <CashDeskModal
        open={cashDeskOpen}
        onOpenChange={setCashDeskOpen}
        timezone={TZ}
        clinicName={`Cabinet ${activeUser.full_name}`}
      />

      {/* Phase 3: Digital Prescription Pad Modal */}
      <PrescriptionModal
        open={prescriptionOpen}
        onOpenChange={setPrescriptionOpen}
        appointment={selectedAppt}
        timezone={TZ}
      />

      {/* Phase 4: AMO / Mutuelle Insurance Claim Modal */}
      <InsuranceClaimModal
        open={insuranceClaimOpen}
        onOpenChange={setInsuranceClaimOpen}
        appointment={selectedAppt}
        timezone={TZ}
      />

      {/* Wave 1: Legal Moroccan Medical Certificate Modal */}
      <MedicalCertificateModal
        open={certificateOpen}
        onOpenChange={setCertificateOpen}
        appointment={selectedAppt}
        timezone={TZ}
      />

      {/* Wave 1: Pediatric Growth & Moroccan PNI Immunization Tracker */}
      <PediatricTrackerModal
        open={pediatricOpen}
        onOpenChange={setPediatricOpen}
        appointment={selectedAppt}
      />

      {/* Specialty Pack: Dental 2D Odontogram & Quote Generator */}
      <DentalOdontogramModal
        open={dentalOpen}
        onOpenChange={setDentalOpen}
        appointment={selectedAppt}
      />

      {/* Specialty Pack: Obstetric & Ultrasound Trimester Tracker */}
      <ObstetricTrackerModal
        open={obstetricOpen}
        onOpenChange={setObstetricOpen}
        appointment={selectedAppt}
      />

      {/* Wave 3: Encrypted WebRTC Teleconsultation Room */}
      <TeleconsultRoomModal
        open={teleconsultOpen}
        onOpenChange={setTeleconsultOpen}
        appointment={selectedAppt}
        onOpenPrescription={() => setPrescriptionOpen(true)}
      />

      {/* Wave 3: Moroccan CMI Online Bank Card Gateway */}
      <CmiPaymentModal
        open={cmiPaymentOpen}
        onOpenChange={setCmiPaymentOpen}
        patientName={selectedAppt?.patient ? `${selectedAppt.patient.first_name} ${selectedAppt.patient.last_name}` : 'Patient'}
      />

      {/* Wave 4: Clinic Medical Supplies & Consumables Inventory */}
      <InventoryManagerModal
        open={inventoryOpen}
        onOpenChange={setInventoryOpen}
        clinicName={`Cabinet ${activeUser.full_name}`}
      />

      {/* Wave 4: Public Booking Link & Share Modal */}
      <PublicBookingLinkModal
        open={bookingLinkOpen}
        onOpenChange={setBookingLinkOpen}
        doctorName={activeUser.full_name}
        doctorSlug="dr-amine-benali"
      />

      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg px-4 py-2.5 shadow-lg z-50 flex items-center gap-2"
        >
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
