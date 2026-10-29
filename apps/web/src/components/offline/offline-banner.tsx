'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import Button from '@/components/ui/button';

export function OfflineBanner() {
  const { isOnline, pendingSyncCount, isSyncing, syncNow } = useOnlineStatus();

  // Si tout est en ligne et aucune action en attente, le bandeau reste masqué
  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Statut de connectivité réseau"
      className={`border-b px-4 py-2 text-xs transition-colors duration-200 ${
        !isOnline
          ? 'bg-amber-500/10 border-amber-300 text-amber-900'
          : 'bg-emerald-500/10 border-emerald-300 text-emerald-900'
      }`}
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-bold">Mode Hors-Ligne Sécurisé 🇲🇦</span>
              <span className="text-amber-800 hidden sm:inline">
                • Consultation active sur cache local (DMP 360 & Agenda du jour). Conforme CNDP.
              </span>
            </>
          ) : (
            <>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold">Connexion rétablie</span>
              <span className="text-emerald-800">
                • Prêt à synchroniser les actions enregistrées localement.
              </span>
            </>
          )}

          {pendingSyncCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900">
              {pendingSyncCount} action{pendingSyncCount > 1 ? 's' : ''} en attente
            </span>
          )}
        </div>

        {isOnline && pendingSyncCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={syncNow}
            disabled={isSyncing}
            className="text-xs h-7 border-emerald-400 bg-white hover:bg-emerald-50 text-emerald-800 font-semibold"
          >
            {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant 🔄'}
          </Button>
        )}
      </div>
    </aside>
  );
}

/**
 * Pastille discrète de statut réseau pour la barre de navigation
 */
export function OnlineStatusPill() {
  const { isOnline, pendingSyncCount } = useOnlineStatus();

  return (
    <div
      title={
        isOnline
          ? 'Connecté au serveur de santé Noor'
          : 'Hors-ligne • Données sécurisées en cache local'
      }
      className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
        isOnline
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      />
      <span>{isOnline ? 'En ligne' : 'Cache local'}</span>
      {pendingSyncCount > 0 && (
        <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 rounded-full">
          {pendingSyncCount}
        </span>
      )}
    </div>
  );
}
