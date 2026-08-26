/**
 * Hook to sync offline content queue when connectivity returns
 *
 * Monitors network state and processes queued content with exponential backoff.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import {
  getQueue,
  getQueueSize,
  removeFromQueue,
  incrementRetryCount,
  type QueuedContent,
} from '@/lib/offlineQueue';
import { logger } from '@/lib/logger';

// Exponential backoff delays: 1s, 2s, 4s
const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * Process a single queued item by sending to Supabase
 */
async function processQueueItem(
  item: QueuedContent,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('loop_content').insert({
      type: item.type,
      sender_id: userId,
      recipient_id: item.recipientId,
      data: item.data,
    } as any);

    if (error) {
      logger.error('Failed to sync item', { action: 'processQueueItem', metadata: { itemId: item.id } }, error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Exception syncing item', { action: 'processQueueItem', metadata: { itemId: item.id } }, error);
    return false;
  }
}

/**
 * Process the entire queue with retry logic
 */
async function processQueue(userId: string): Promise<number> {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  if (__DEV__) {
    logger.debug('Processing queue', { action: 'processQueue', metadata: { itemCount: queue.length } });
  }

  let successCount = 0;

  for (const item of queue) {
    const success = await processQueueItem(item, userId);

    if (success) {
      await removeFromQueue(item.id);
      successCount++;
    } else {
      // Increment retry count, will be removed if max exceeded
      const shouldRetry = await incrementRetryCount(item.id);

      if (shouldRetry) {
        // Wait before next item with exponential backoff
        const delay = RETRY_DELAYS[Math.min(item.retryCount, RETRY_DELAYS.length - 1)];
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (__DEV__) {
    logger.debug('Queue processed', { action: 'processQueue', metadata: { syncedCount: successCount } });
  }

  return successCount;
}

/**
 * Hook to automatically sync offline content when network returns
 *
 * @returns Object with queueSize and manual sync function
 */
export function useOfflineSync() {
  const userId = useAuthStore((state) => state.user?.id);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isProcessingRef = useRef(false);

  // Update queue size
  const refreshQueueSize = useCallback(async () => {
    const size = await getQueueSize();
    setQueueSize(size);
    return size;
  }, []);

  // Process queue when online
  const syncQueue = useCallback(async () => {
    if (!userId || !isSupabaseConfigured() || isProcessingRef.current) {
      return;
    }

    const size = await getQueueSize();
    if (size === 0) return;

    isProcessingRef.current = true;
    setIsSyncing(true);

    try {
      await processQueue(userId);
      await refreshQueueSize();
    } finally {
      isProcessingRef.current = false;
      setIsSyncing(false);
    }
  }, [userId, refreshQueueSize]);

  // Monitor network state
  useEffect(() => {
    if (!userId) return;

    // Check initial queue size
    refreshQueueSize();

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        // Network is back - process queue
        syncQueue();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId, syncQueue, refreshQueueSize]);

  return {
    queueSize,
    isSyncing,
    syncQueue,
    refreshQueueSize,
  };
}

/**
 * Global offline sync initializer - call once at app start
 * This processes any queued content from previous sessions
 */
export function initOfflineSync(userId: string | undefined): () => void {
  if (!userId || !isSupabaseConfigured()) {
    return () => {};
  }

  // Process queue on startup
  processQueue(userId).catch((error) => {
    logger.error('Startup sync failed', { action: 'initOfflineSync' }, error);
  });

  // Subscribe to network changes for background sync
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      processQueue(userId).catch((error) => {
        logger.error('Background sync failed', { action: 'initOfflineSync' }, error);
      });
    }
  });

  return unsubscribe;
}
