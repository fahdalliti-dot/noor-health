'use client';

import { useEffect, useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { api } from '@/lib/api';

interface PatientItem {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  cin?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPatient?: (patient: PatientItem) => void;
  onAction?: (action: string) => void;
}

export function CommandPalette({ open, onOpenChange, onSelectPatient, onAction }: Props) {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPatients([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<{ patients: PatientItem[] }>(
        `/patients/search?q=${encodeURIComponent(q.trim())}`,
      );
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error('Command palette search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const actions = [
    { id: 'new_appointment', label: 'Nouveau rendez-vous', shortcut: 'N', icon: '📅' },
    { id: 'today', label: 'Aller à aujourd’hui', shortcut: 'T', icon: '⚡' },
    { id: 'waiting_room', label: 'Voir la salle d’attente', shortcut: 'W', icon: '🪑' },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity" />
        <Dialog.Content
          className="fixed z-50 top-[18%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden p-0"
          aria-label="Palette de commandes"
        >
          <div className="flex items-center px-4 border-b border-slate-100 bg-slate-50/50">
            <span className="text-slate-400 text-sm me-2.5">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un patient (Nom, CIN, Tél) ou une action..."
              className="w-full bg-transparent py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              autoFocus
            />
            <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-300/60">
              ESC
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 text-xs">
            {/* Quick Actions */}
            {!query && (
              <div className="pb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                  Actions rapides
                </span>
                <div className="space-y-0.5 mt-1">
                  {actions.map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        onAction?.(act.id);
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer text-left rtl:text-right"
                    >
                      <span className="flex items-center gap-2">
                        <span>{act.icon}</span>
                        <span>{act.label}</span>
                      </span>
                      <kbd className="font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {act.shortcut}
                      </kbd>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Patients Search Results */}
            {query && (
              <div className="pt-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                  {loading ? 'Recherche...' : `Patients (${patients.length})`}
                </span>
                {patients.length === 0 && !loading ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    Aucun patient trouvé pour &quot;{query}&quot;
                  </div>
                ) : (
                  <div className="space-y-0.5 mt-1">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectPatient?.(p);
                          onOpenChange(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-blue-50/70 text-slate-900 transition-colors cursor-pointer text-left rtl:text-right"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">
                            {p.first_name} {p.last_name}
                          </span>
                          {p.cin && (
                            <span className="font-mono text-slate-400 ms-1.5 text-[11px]">
                              ({p.cin})
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {p.phone || 'Pas de numéro'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CommandPalette;
