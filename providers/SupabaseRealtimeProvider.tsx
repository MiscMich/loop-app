/**
 * Supabase Realtime Provider
 * Initializes realtime subscriptions when user is authenticated
 * Provides connection status tracking
 */

import React, { useEffect, createContext, useContext } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRealtimeContent } from '@/hooks/useRealtimeContent';
import { useRealtimeFriends } from '@/hooks/useRealtimeFriends';
import { useRealtimeGames } from '@/hooks/useRealtimeGames';
import { useRealtimeStatus, ConnectionStatus as ConnectionStatusType } from '@/hooks/useRealtimeStatus';
import { isSupabaseConfigured } from '@/lib/supabase';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface SupabaseRealtimeProviderProps {
  children: React.ReactNode;
}

interface RealtimeContextValue {
  status: ConnectionStatusType;
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnectedAt: Date | null;
  reconnectAttempts: number;
}

// Context for connection status
const RealtimeContext = createContext<RealtimeContextValue | null>(null);

// Hook to access realtime connection status from anywhere
export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within SupabaseRealtimeProvider');
  }
  return context;
}

// Component that initializes realtime subscriptions
function RealtimeSubscriptions() {
  // Initialize all realtime hooks
  // These hooks internally check for authentication and Supabase configuration
  useRealtimeContent();
  useRealtimeFriends();
  useRealtimeGames();

  return null;
}

export function SupabaseRealtimeProvider({ children }: SupabaseRealtimeProviderProps) {
  // Note: initializeAuth is called in RootLayoutNav (_layout.tsx) - not here to avoid race condition
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const realtimeStatus = useRealtimeStatus();

  return (
    <RealtimeContext.Provider value={realtimeStatus}>
      {/* Connection status banner (only shows when disconnected) */}
      {isAuthenticated && isSupabaseConfigured() && <ConnectionStatus />}

      {/* Only render subscriptions when authenticated and Supabase is configured */}
      {isAuthenticated && isSupabaseConfigured() && <RealtimeSubscriptions />}

      {children}
    </RealtimeContext.Provider>
  );
}
