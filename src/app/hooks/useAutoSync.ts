import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { useHabits } from '../store/HabitContext';
import { pullCloudDataToLocal } from '../services/cloudSync';

// Maximum time to allow a sync to run (15 seconds)
const SYNC_TIMEOUT_MS = 15000;

export const useAutoSync = () => {
  const { user, isConfigured } = useAuth();
  const { replaceState } = useHabits();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncedUserIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isConfigured || !user) {
      syncedUserIdRef.current = null;
      setIsSyncing(false);
      setSyncError(null);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    if (syncedUserIdRef.current === user.id) {
      return;
    }

    let cancelled = false;
    syncedUserIdRef.current = user.id;

    const performSync = async () => {
      setIsSyncing(true);
      setSyncError(null);

      // Set a timeout to prevent sync from being stuck forever
      timeoutRef.current = setTimeout(() => {
        if (!cancelled) {
          cancelled = true;
          setIsSyncing(false);
          setSyncError('Sync timeout: took too long to complete');
          console.warn('Auto-sync timed out after', SYNC_TIMEOUT_MS, 'ms');
        }
      }, SYNC_TIMEOUT_MS);

      try {
        const cloudData = await pullCloudDataToLocal(user.id);

        if (cancelled) return;

        // Update local state with cloud data
        replaceState({
          habits: cloudData.habits,
          dailyTasks: cloudData.dailyTasks,
          books: cloudData.books,
        });

        console.log('✓ Auto-sync completed on login');
      } catch (err) {
        if (cancelled) return;

        const errorMsg = err instanceof Error ? err.message : 'Sync failed';
        setSyncError(errorMsg);
        console.error('Auto-sync error:', errorMsg);
      } finally {
        if (cancelled) return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsSyncing(false);
      }
    };

    performSync();
 
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user?.id, isConfigured, replaceState]);

  return { isSyncing, syncError };
};
