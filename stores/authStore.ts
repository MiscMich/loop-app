import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { signInWithApple as supabaseSignIn, signOut as supabaseSignOut, updateProfile as supabaseUpdateProfile } from '@/lib/supabase/auth';
import { uploadAvatar } from '@/lib/supabase/storage';
import { ssrSafeStorage, isSSR } from '@/lib/ssrStorage';
import { useContentStore } from './contentStore';
import { useFriendsStore } from './friendsStore';
import { useGameStore } from './gameStore';
import { logger } from '@/lib/logger';
import { track, identify, reset as resetAnalytics, AnalyticsEvent } from '@/lib/analytics';
import type { User as DbUser, UserUpdate } from '@/lib/supabase/types';
import { runtimeConfig } from '@/lib/config';
import { getDemoSnapshot } from '@/lib/demoFixtures';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  email?: string;
  appleId?: string;
  createdAt: string;
  pushToken?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateAvatar: (uri: string) => Promise<string | null>;
  signInWithApple: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setPushToken: (token: string | null) => Promise<void>;
}

// Convert Supabase user to store User type
const convertSupabaseUser = (dbUser: DbUser): User => ({
  id: dbUser.id,
  username: dbUser.username,
  displayName: dbUser.display_name,
  avatarUrl: dbUser.avatar_url ?? undefined,
  bio: dbUser.bio ?? undefined,
  email: dbUser.email ?? undefined,
  appleId: dbUser.apple_id ?? undefined,
  createdAt: dbUser.created_at,
  pushToken: dbUser.push_token ?? undefined,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isOnboarded: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setOnboarded: (isOnboarded) => set({ isOnboarded }),

      signOut: async () => {
        set({ isLoading: true });
        try {
          // Track sign out event before clearing user data
          track(AnalyticsEvent.SIGN_OUT);

          // Sign out from Supabase if configured
          if (isSupabaseConfigured()) {
            await supabaseSignOut();
          }
          set({
            user: null,
            isAuthenticated: false,
            isOnboarded: false,
            isLoading: false,
          });

          // Reset analytics to clear user identity
          resetAnalytics();

          // Clear all stores on sign out to prevent data leakage
          useContentStore.setState({ feed: [], sent: [], currentMood: null });
          useFriendsStore.setState({ friends: [], pendingRequests: [], groups: [], blockedUsers: [], reports: [], error: null });
          useGameStore.setState({ activeGames: [], completedGames: [] });
        } catch (error) {
          logger.error('Sign out error', { action: 'signOut' }, error);
          // Still clear local state even if Supabase sign out fails
          set({
            user: null,
            isAuthenticated: false,
            isOnboarded: false,
            isLoading: false,
          });

          // Reset analytics even on error
          resetAnalytics();

          // Clear all stores on sign out to prevent data leakage
          useContentStore.setState({ feed: [], sent: [], currentMood: null });
          useFriendsStore.setState({ friends: [], pendingRequests: [], groups: [], blockedUsers: [], reports: [], error: null });
          useGameStore.setState({ activeGames: [], completedGames: [] });

          throw error; // Re-throw to allow UI to handle
        }
      },

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return;

        // Update in Supabase if configured
        if (isSupabaseConfigured()) {
          const supabaseUpdates: UserUpdate = {};
          if (updates.displayName) supabaseUpdates.display_name = updates.displayName;
          if (updates.username) supabaseUpdates.username = updates.username;
          if (updates.avatarUrl) supabaseUpdates.avatar_url = updates.avatarUrl;
          if (updates.bio) supabaseUpdates.bio = updates.bio;

          const result = await supabaseUpdateProfile(user.id, supabaseUpdates);
          if (!result) {
            // Supabase update failed - don't update local state to keep sync
            logger.error('Profile update failed - local state not updated', { action: 'updateProfile', userId: user.id });
            throw new Error('Failed to update profile');
          }
        }

        // Update local state only after successful Supabase update (or if not configured)
        set({ user: { ...user, ...updates } });

        // Track profile update
        track(AnalyticsEvent.PROFILE_UPDATED, {
          updatedFields: Object.keys(updates),
        });
      },

      updateAvatar: async (uri: string) => {
        const { user, updateProfile } = get();
        if (!user) return null;

        // Upload to Supabase storage if configured
        const avatarUrl = await uploadAvatar(uri, user.id);

        if (avatarUrl) {
          await updateProfile({ avatarUrl });

          // Track avatar upload
          track(AnalyticsEvent.AVATAR_UPLOADED);
        }

        return avatarUrl;
      },

      signInWithApple: async () => {
        try {
          set({ isLoading: true });

          // Track sign in started
          track(AnalyticsEvent.SIGN_IN_STARTED, { method: 'apple' });

          // Try Supabase auth first
          if (isSupabaseConfigured()) {
            const supabaseUser = await supabaseSignIn();
            if (supabaseUser) {
              const user = convertSupabaseUser(supabaseUser);
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                // Don't set isOnboarded here - let the onboarding flow handle it
              });

              // Track successful sign in and identify user
              track(AnalyticsEvent.SIGN_IN_COMPLETED, { method: 'apple', isNewUser: false });
              identify(user.id, {
                userId: user.id,
                username: user.username,
                displayName: user.displayName,
                email: user.email,
                createdAt: user.createdAt,
              });
              return;
            }
          }

          // Fall back to local-only auth
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });

          const displayName = credential.fullName?.givenName
            ? `${credential.fullName.givenName}${credential.fullName.familyName ? ' ' + credential.fullName.familyName : ''}`
            : 'Loop User';

          const username = credential.email?.split('@')[0] || `user_${credential.user.slice(0, 8)}`;

          const newUser: User = {
            id: credential.user,
            username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            displayName,
            email: credential.email || undefined,
            appleId: credential.user,
            createdAt: new Date().toISOString(),
          };

          set({
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
            // Don't set isOnboarded here - let the onboarding flow handle it
          });

          // Track successful sign in and identify user
          track(AnalyticsEvent.SIGN_IN_COMPLETED, { method: 'apple', isNewUser: true });
          identify(newUser.id, {
            userId: newUser.id,
            username: newUser.username,
            displayName: newUser.displayName,
            email: newUser.email,
            createdAt: newUser.createdAt,
          });
        } catch (error: any) {
          set({ isLoading: false });
          if (error.code === 'ERR_REQUEST_CANCELED') {
            return;
          }
          // Track failed sign in
          track(AnalyticsEvent.SIGN_IN_FAILED, { method: 'apple', error: error.message });
          throw error;
        }
      },

      setPushToken: async (token: string | null) => {
        const { user } = get();
        if (!user) return;

        // Update in Supabase if configured
        if (isSupabaseConfigured() && token) {
          try {
            // Direct Supabase update for push_token
            const updateData: UserUpdate = { push_token: token };
            const { error } = await supabase
              .from('loop_users')
              .update(updateData)
              .eq('id', user.id);

            if (error) {
              logger.error('Failed to save push token to Supabase', { action: 'setPushToken', userId: user.id }, error);
            }
          } catch (error) {
            logger.error('Failed to save push token to Supabase', { action: 'setPushToken', userId: user.id }, error);
          }
        }

        // Update local state
        set({ user: { ...user, pushToken: token || undefined } });
      },

      initializeAuth: async () => {
        if (runtimeConfig.demoMode) {
          const demo = getDemoSnapshot();
          useFriendsStore.setState({
            friends: demo.friends,
            pendingRequests: [],
            groups: [],
            blockedUsers: [],
            reports: [],
            error: null,
          });
          useContentStore.setState({
            feed: demo.feed,
            sent: [],
            currentMood: demo.mood,
            isLoading: false,
          });
          set({
            user: demo.user,
            isAuthenticated: true,
            isOnboarded: true,
            isLoading: false,
          });
          return;
        }

        // Check for existing Supabase session
        if (isSupabaseConfigured()) {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();

            // Handle refresh token errors gracefully
            if (error) {
              const isRefreshTokenError =
                error.message?.includes('Refresh Token') ||
                error.message?.includes('Invalid Refresh Token') ||
                error.message?.includes('refresh_token');

              if (isRefreshTokenError) {
                logger.debug('Invalid refresh token detected, clearing session', { action: 'initializeAuth' });
                // Clear the invalid session silently
                await supabase.auth.signOut({ scope: 'local' });
                // Clear local state and treat as logged out
                set({
                  user: null,
                  isAuthenticated: false,
                  isOnboarded: false,
                  isLoading: false,
                });
                return;
              }

              // Log other errors but continue
              logger.error('Session error', { action: 'initializeAuth' }, error);
            }

            if (session?.user) {
              // Fetch user profile
              const { data: profile } = await supabase
                .from('loop_users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profile) {
                const user = convertSupabaseUser(profile);
                set({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                  isOnboarded: true,
                });

                // Track session restored and identify user
                track(AnalyticsEvent.SESSION_RESTORED);
                identify(user.id, {
                  userId: user.id,
                  username: user.username,
                  displayName: user.displayName,
                  email: user.email,
                  createdAt: user.createdAt,
                });
                return;
              }
            }
          } catch (err: any) {
            // Catch any exceptions (including AuthApiError)
            const isRefreshTokenError =
              err?.message?.includes('Refresh Token') ||
              err?.message?.includes('Invalid Refresh Token') ||
              err?.message?.includes('refresh_token');

            if (isRefreshTokenError) {
              logger.debug('Invalid refresh token detected (exception), clearing session', { action: 'initializeAuth' });
              try {
                // Clear the invalid session silently
                await supabase.auth.signOut({ scope: 'local' });
              } catch (signOutErr) {
                // Ignore sign out errors
                logger.debug('Sign out error ignored', { action: 'initializeAuth' }, signOutErr);
              }
              // Clear local state and treat as logged out
              set({
                user: null,
                isAuthenticated: false,
                isOnboarded: false,
                isLoading: false,
              });
              return;
            }

            logger.error('Initialize auth error', { action: 'initializeAuth' }, err);
          }
        }

        // Use persisted local state
        set({ isLoading: false });
      },
    }),
    {
      name: 'loop-auth-storage',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);

// Auth state listener for Supabase (only on client, not during SSR)
// Store the unsubscribe function for potential cleanup
let authListenerUnsubscribe: (() => void) | null = null;

if (!isSSR && isSupabaseConfigured()) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    logger.debug('Auth state change', { action: 'onAuthStateChange' }, { event });

    switch (event) {
      case 'SIGNED_OUT':
        useAuthStore.getState().setUser(null);
        break;

      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
      case 'USER_UPDATED':
        if (session?.user) {
          // Fetch updated profile
          const { data: profile } = await supabase
            .from('loop_users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            useAuthStore.getState().setUser(convertSupabaseUser(profile));
          }
        }
        break;

      case 'INITIAL_SESSION':
        // Handled by initializeAuth - no action needed
        break;

      default:
        logger.debug('Unhandled auth event', { action: 'onAuthStateChange' }, { event });
    }
  });
  authListenerUnsubscribe = () => subscription.unsubscribe();
}

export { authListenerUnsubscribe };
