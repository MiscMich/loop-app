import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { logger } from '@/lib/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface UseRealtimeStatusReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnectedAt: Date | null;
  reconnectAttempts: number;
}

/**
 * Hook to track Supabase realtime connection status
 *
 * Monitors connection state and provides UI-friendly booleans.
 * Automatically attempts reconnection on disconnect.
 *
 * @returns Connection status and helper booleans
 */
export function useRealtimeStatus(): UseRealtimeStatusReturn {
  const { user, isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isReconnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const MAX_RECONNECT_ATTEMPTS = 10;

  // Cleanup reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (isReconnectingRef.current || !isSupabaseConfigured() || !isAuthenticated) {
      return;
    }

    // Check max reconnect attempts limit
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnect attempts reached', { action: 'attemptReconnect', metadata: { attempts: reconnectAttemptsRef.current } });
      setStatus('disconnected');
      isReconnectingRef.current = false;
      return;
    }

    isReconnectingRef.current = true;
    setStatus('reconnecting');

    // Increment ref for immediate use, then sync to state
    reconnectAttemptsRef.current += 1;
    setReconnectAttempts(reconnectAttemptsRef.current);

    // Exponential backoff: 2s, 4s, 8s, 16s, max 30s (use ref value)
    const backoffDelay = Math.min(2000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

    reconnectTimeoutRef.current = setTimeout(() => {
      // Try to resubscribe by creating a new channel
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Create new status channel
      const channel = supabase
        .channel(`status:${user?.id || 'anonymous'}:${Date.now()}`)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setStatus('connected');
            setLastConnectedAt(new Date());
            setReconnectAttempts(0);
            reconnectAttemptsRef.current = 0;
            isReconnectingRef.current = false;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setStatus('disconnected');
            isReconnectingRef.current = false;
            // Try again
            attemptReconnect();
          }
        });

      channelRef.current = channel;
    }, backoffDelay);
  }, [isAuthenticated, user?.id]); // Removed reconnectAttempts from deps since we use ref

  // Main effect to setup realtime status monitoring
  useEffect(() => {
    // Skip if not configured or not authenticated
    if (!isSupabaseConfigured() || !isAuthenticated) {
      setStatus('disconnected');
      return;
    }

    // Create a dedicated status channel to monitor connection
    const channel = supabase
      .channel(`status:${user?.id || 'anonymous'}`)
      .subscribe((channelStatus) => {
        switch (channelStatus) {
          case 'SUBSCRIBED':
            setStatus('connected');
            setLastConnectedAt(new Date());
            setReconnectAttempts(0);
            reconnectAttemptsRef.current = 0;
            isReconnectingRef.current = false;
            clearReconnectTimeout();
            break;

          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
            setStatus('disconnected');
            attemptReconnect();
            break;

          case 'CLOSED':
            setStatus('disconnected');
            attemptReconnect();
            break;
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      clearReconnectTimeout();
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      isReconnectingRef.current = false;
    };
  }, [isAuthenticated, user?.id, attemptReconnect, clearReconnectTimeout]);

  return {
    status,
    isConnected: status === 'connected',
    isReconnecting: status === 'reconnecting',
    lastConnectedAt,
    reconnectAttempts,
  };
}
