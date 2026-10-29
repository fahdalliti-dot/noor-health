'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import type { Appointment } from '@/hooks/use-agenda';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onOpenPrescription?: () => void;
  doctorName?: string;
}

export function TeleconsultRoomModal({
  open,
  onOpenChange,
  appointment,
  onOpenPrescription,
  doctorName = 'Dr. Amine Benali',
}: Props) {
  const [micMuted, setMicMuted] = useState(false);
  const [videoDisabled, setVideoDisabled] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [callDuration, setCallDuration] = useState('08:42');

  if (!open || !appointment) return null;

  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Patient';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Top Video Room Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Téléconsultation Sécurisée CNDP</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                  AES-256 WebRTC
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Patient : <strong className="text-white">{patientName}</strong> • {doctorName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md">
              ⏱ {callDuration}
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-white p-1 text-sm rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video Area + Right Clinical Drawer */}
        <div className="flex-1 flex min-h-0">
          {/* Main Video Stage */}
          <div className="flex-1 bg-slate-950 p-4 flex flex-col justify-between relative">
            {/* Patient Remote Video Feed (Simulation) */}
            <div className="flex-1 rounded-xl bg-slate-850 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl font-bold text-slate-300 mb-2">
                {patientName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <span className="text-sm font-semibold text-slate-200">{patientName}</span>
              <span className="text-xs text-emerald-400 font-mono mt-1">● Flux vidéo HD 1080p actif</span>

              {/* Doctor PiP Video (Self view) */}
              <div className="absolute bottom-4 right-4 w-40 h-28 bg-slate-800 rounded-lg border-2 border-slate-700 shadow-lg flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-terracotta-600 text-white flex items-center justify-center font-bold text-xs mb-1">
                  AB
                </div>
                <span className="text-[10px] text-slate-300 font-medium">Vous ({doctorName})</span>
                {videoDisabled && (
                  <span className="text-[9px] text-red-400 font-mono">Caméra coupée</span>
                )}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-3 flex items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setMicMuted(!micMuted)}
                className={`p-3 rounded-full text-sm font-semibold transition cursor-pointer ${
                  micMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title={micMuted ? 'Activer le micro' : 'Couper le micro'}
              >
                {micMuted ? '🔇 Micro coupé' : '🎤 Micro'}
              </button>

              <button
                type="button"
                onClick={() => setVideoDisabled(!videoDisabled)}
                className={`p-3 rounded-full text-sm font-semibold transition cursor-pointer ${
                  videoDisabled ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title={videoDisabled ? 'Activer la caméra' : 'Couper la caméra'}
              >
                {videoDisabled ? '🚫 Caméra coupée' : '📹 Caméra'}
              </button>

              {onOpenPrescription && (
                <button
                  type="button"
                  onClick={onOpenPrescription}
                  className="px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-bold rounded-full flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>💊 Rédiger Ordonnance</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  alert('Téléconsultation terminée avec succès.');
                  onOpenChange(false);
                }}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full transition cursor-pointer"
              >
                📞 Raccrocher
              </button>
            </div>
          </div>

          {/* Right In-Call Clinical Workspace */}
          <div className="w-80 border-l border-slate-800 bg-slate-900 p-4 flex flex-col justify-between text-xs space-y-4">
            <div className="space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Observations en direct
                </span>
                <span className="text-xs font-semibold text-white">Prise de notes clinique</span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Symptômes & Diagnostic téléconsultation :
                </label>
                <textarea
                  rows={8}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Patient rapporte céphalées et sensation d'oppression thoracique à l'effort..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-terracotta-600"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>• Patient : <strong className="text-slate-200">{patientName}</strong></div>
                <div>• Mode : Téléconsultation vidéo</div>
                <div>• Tarif conventionné : <strong className="text-emerald-400">350 DH</strong></div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => alert('Notes de téléconsultation enregistrées au dossier.')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2"
            >
              Enregistrer au Dossier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeleconsultRoomModal;
