// src/hooks/useOfflineSync.ts
// Detects connectivity changes, syncs pending actions when back online

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getPendingSyncActions,
  markSyncActionSynced,
  markSyncActionFailed,
  SyncAction,
} from '../utils/db';

interface UseOfflineSyncOptions {
  /**
   * Called when the user comes back online with any pending sync actions.
   * Your app should replay these actions against its state.
   */
  onSync?: (actions: SyncAction[]) => Promise<void>;
  onOnline?: () => void;
  onOffline?: () => void;
}

export function useOfflineSync({ onSync, onOnline, onOffline }: UseOfflineSyncOptions = {}) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const syncNow = useCallback(async () => {
    const pending = await getPendingSyncActions();
    setPendingCount(pending.length);
    if (pending.length === 0 || !onSyncRef.current) return;

    setIsSyncing(true);
    try {
      await onSyncRef.current(pending);
      // Mark all as synced
      for (const action of pending) {
        if (action.id !== undefined) await markSyncActionSynced(action.id);
      }
      setPendingCount(0);
    } catch (err) {
      console.error('[useOfflineSync] Sync failed:', err);
      for (const action of pending) {
        if (action.id !== undefined) await markSyncActionFailed(action.id);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      onOnline?.();
      await syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Count pending on mount
    getPendingSyncActions().then((p) => setPendingCount(p.length));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline, syncNow]);

  return { isOnline, isSyncing, pendingCount, syncNow };
}