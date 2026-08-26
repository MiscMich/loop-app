import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase, isSupabaseConfigured } from '../supabase';
import type { User, UserInsert, UserUpdate } from './types';
import { logger } from '@/lib/logger';
import { signInRateLimiter, searchUsersRateLimiter, RateLimitError } from '@/lib/rateLimit';

// Sign in with Apple and sync to Supabase
export const signInWithApple = async (): Promise<User | null> => {
  // Rate limit check - max 3 attempts per minute
  if (!signInRateLimiter.check()) {
    logger.warn('Sign in rate limited', {
      action: 'signInWithApple',
      metadata: {
        remainingMs: signInRateLimiter.resetIn(),
      },
    });
    throw new Error(RateLimitError.SIGN_IN_RATE_LIMITED);
  }

  try {
    // Get Apple credential
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('No identity token received from Apple');
    }

    // If Supabase is configured, authenticate with it
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        logger.error('Supabase auth error', { action: 'signInWithApple' }, error);
        // Fall back to local-only auth
        return createLocalUser(credential);
      }

      if (data.user) {
        // Create or update user profile
        const displayName = credential.fullName?.givenName
          ? `${credential.fullName.givenName}${credential.fullName.familyName ? ' ' + credential.fullName.familyName : ''}`
          : 'Loop User';

        const username = credential.email?.split('@')[0] || `user_${data.user.id.slice(0, 8)}`;

        const userProfile: UserInsert = {
          id: data.user.id,
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          display_name: displayName,
          email: credential.email || data.user.email || null,
          apple_id: credential.user,
          updated_at: new Date().toISOString(),
        };

        // Upsert user profile
        const { data: profile, error: profileError } = await supabase
          .from('loop_users')
          .upsert(userProfile, { onConflict: 'id' })
          .select()
          .single();

        if (profileError) {
          logger.error('Profile upsert error', {
            action: 'signInWithApple',
            userId: data.user.id,
            metadata: {
              errorCode: profileError.code,
              errorDetails: profileError.details,
              hint: profileError.hint,
            },
          }, profileError);
          // Profile upsert failed, but we can still proceed with local data
          // Log this as a warning since user auth succeeded but profile sync failed
          logger.warn('Proceeding with local user data after profile upsert failure', {
            action: 'signInWithApple',
            userId: data.user.id,
          });
        }

        return profile || convertToUser(userProfile);
      }
    }

    // No Supabase - create local user
    return createLocalUser(credential);
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return null; // User canceled
    }
    throw error;
  }
};

// Create a local-only user from Apple credential
const createLocalUser = (credential: AppleAuthentication.AppleAuthenticationCredential): User => {
  const displayName = credential.fullName?.givenName
    ? `${credential.fullName.givenName}${credential.fullName.familyName ? ' ' + credential.fullName.familyName : ''}`
    : 'Loop User';

  const username = credential.email?.split('@')[0] || `user_${credential.user.slice(0, 8)}`;

  return {
    id: credential.user,
    username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    display_name: displayName,
    avatar_url: null,
    bio: null,
    email: credential.email || null,
    apple_id: credential.user,
    current_mood: null,
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    push_token: null,
  };
};

// Convert partial user data to User type
const convertToUser = (data: Partial<User>): User => ({
  id: data.id || '',
  username: data.username || '',
  display_name: data.display_name || '',
  avatar_url: data.avatar_url || null,
  bio: data.bio || null,
  email: data.email || null,
  apple_id: data.apple_id || null,
  current_mood: data.current_mood || null,
  last_active: data.last_active || null,
  created_at: data.created_at || new Date().toISOString(),
  updated_at: data.updated_at || new Date().toISOString(),
  push_token: data.push_token || null,
});

// Sign out
export const signOut = async (): Promise<void> => {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
};

// Get current session
export const getSession = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    // Handle refresh token errors gracefully
    if (error) {
      const isRefreshTokenError =
        error.message?.includes('Refresh Token') ||
        error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('refresh_token');

      if (isRefreshTokenError) {
        logger.debug('Invalid refresh token in getSession, clearing', { action: 'getSession' });
        // Clear the invalid session
        await supabase.auth.signOut({ scope: 'local' });
        return null;
      }

      logger.error('Get session error', { action: 'getSession' }, error);
      return null;
    }

    return data.session;
  } catch (err: any) {
    // Catch AuthApiError exceptions
    const isRefreshTokenError =
      err?.message?.includes('Refresh Token') ||
      err?.message?.includes('Invalid Refresh Token') ||
      err?.message?.includes('refresh_token');

    if (isRefreshTokenError) {
      logger.debug('Invalid refresh token exception in getSession, clearing', { action: 'getSession' });
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore sign out errors
      }
      return null;
    }

    logger.error('Get session exception', { action: 'getSession' }, err);
    return null;
  }
};

// Get current user from Supabase
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    // Handle refresh token errors
    if (error) {
      const isRefreshTokenError =
        error.message?.includes('Refresh Token') ||
        error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('refresh_token');

      if (isRefreshTokenError) {
        logger.debug('Invalid refresh token in getCurrentUser, clearing', { action: 'getCurrentUser' });
        await supabase.auth.signOut({ scope: 'local' });
        return null;
      }

      logger.error('Get user error', { action: 'getCurrentUser' }, error);
      return null;
    }

    if (!user) return null;

    const { data: profile } = await supabase
      .from('loop_users')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  } catch (err: any) {
    // Catch AuthApiError exceptions
    const isRefreshTokenError =
      err?.message?.includes('Refresh Token') ||
      err?.message?.includes('Invalid Refresh Token') ||
      err?.message?.includes('refresh_token');

    if (isRefreshTokenError) {
      logger.debug('Invalid refresh token exception in getCurrentUser, clearing', { action: 'getCurrentUser' });
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore sign out errors
      }
      return null;
    }

    logger.error('Get current user exception', { action: 'getCurrentUser' }, err);
    return null;
  }
};

// Update user profile
export const updateProfile = async (
  userId: string,
  updates: UserUpdate
): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('loop_users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    logger.error('Update profile error', { action: 'updateProfile', userId }, error);
    return null;
  }

  return data;
};

// Search users by username
export const searchUsers = async (query: string): Promise<User[]> => {
  if (!isSupabaseConfigured() || !query || query.length < 2) {
    return [];
  }

  // Sanitize search input: trim whitespace and limit length to 50 characters
  const sanitizedQuery = query.trim().slice(0, 50);
  if (sanitizedQuery.length < 2) {
    return [];
  }

  // Rate limit check - max 10 searches per 10 seconds
  if (!searchUsersRateLimiter.check()) {
    logger.warn('User search rate limited', {
      action: 'searchUsers',
      metadata: {
        remainingMs: searchUsersRateLimiter.resetIn(),
      },
    });
    return [];
  }

  const { data, error } = await supabase
    .from('loop_users')
    .select('*')
    .ilike('username', `%${sanitizedQuery}%`)
    .limit(20);

  if (error) {
    logger.error('Search users error', { action: 'searchUsers' }, error);
    return [];
  }

  return data || [];
};
