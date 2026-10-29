'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getOfflineMutations,
  syncOfflineQueue,
  getLastSyncTime,
} from '@/lib/offline/offline-store';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const refreshState = useCallback(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    setPendingSyncCount(getOfflineMutations().length);
    setLastSync(getLastSyncTime());
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncOfflineQueue();
    } finally {
      setIsSyncing(false);
      refreshState();
    }
  }, [isSyncing, refreshState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    refreshState();

    const handleOnline = () => {
      setIsOnline(true);
      setPendingSyncCount(getOfflineMutations().length);
      setLastSync(getLastSyncTime());
      // Auto-synchronisation automatique au retour d'internet
      syncOfflineQueue().then(() => refreshState());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPendingSyncCount(getOfflineMutations().length);
      setLastSync(getLastSyncTime());
    };

    const handleQueueChange = () => {
      refreshState();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('noor-offline-queue-updated', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('noor-offline-queue-updated', handleQueueChange);
    };
  }, [refreshState]);

  return {
    isOnline,
    pendingSyncCount,
    isSyncing,
    syncNow,
    lastSyncTime: lastSync,
  };
}
