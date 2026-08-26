import { useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured, canQuerySupabase, isValidUUID } from '@/lib/supabase';
import { useFriendsStore, Friend } from '@/stores/friendsStore';
import { useAuthStore } from '@/stores/authStore';
import { supabaseRetry } from '@/lib/retry';
import { logger } from '@/lib/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Convert database friend to store format
const convertToStoreFriend = (dbFriend: any): Friend => ({
  id: dbFriend.id,
  username: dbFriend.username,
  displayName: dbFriend.display_name,
  avatarUrl: dbFriend.avatar_url,
  status: dbFriend.status,
  addedAt: dbFriend.added_at || dbFriend.created_at,
  lastActive: dbFriend.last_active,
  currentMood: dbFriend.current_mood,
});

export function useRealtimeFriends() {
  const { user } = useAuthStore();
  const { setFriends, addFriend, removeFriend, updateFriend, acceptRequest } = useFriendsStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch friends list with AbortController support
  const fetchFriends = useCallback(async (signal?: AbortSignal) => {
    if (!user?.id || !canQuerySupabase(user.id)) return;

    try {
      // Check if request was cancelled
      if (signal?.aborted) return;

      // Fetch friendships with user details
      const friendships = await supabaseRetry<any[]>(async () =>
        await supabase
          .from('loop_friendships')
          .select(`
            *,
            friend:loop_users!friend_id(*),
            requester:loop_users!user_id(*)
          `)
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .abortSignal(signal as AbortSignal)
      );

      if (signal?.aborted) return;

      const friends = friendships.map((f: any) => {
        // Determine which user is the friend (not current user)
        const friendData = f.user_id === user.id ? f.friend : f.requester;
        return convertToStoreFriend({
          ...friendData,
          status: f.status,
          added_at: f.created_at,
        });
      });
      setFriends(friends);
    } catch (err: any) {
      // Don't log aborted requests as errors
      if (err?.name === 'AbortError' || signal?.aborted) return;
      logger.error('Failed to fetch friends after retries', { action: 'fetchFriends', userId: user?.id }, err);
    }
  }, [user?.id, setFriends]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user?.id || !canQuerySupabase(user.id)) return;

    // CREATE ABORT CONTROLLER FIRST
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Create channel for friendship updates
    const channel = supabase
      .channel(`friendships:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loop_friendships',
        },
        async (payload: any) => {
          try {
            // Check if this friendship involves current user
            const isRelevant = payload.new.user_id === user.id || payload.new.friend_id === user.id;
            if (!isRelevant) return;

            // Get friend's user details
            const friendId = payload.new.user_id === user.id
              ? payload.new.friend_id
              : payload.new.user_id;

            const { data: friendUser, error } = await supabase
              .from('loop_users')
              .select('*')
              .eq('id', friendId)
              .single();

            if (error) {
              logger.error('Failed to fetch friend user', { action: 'friendshipInsertHandler', metadata: { friendId } }, error);
              return;
            }

            if (friendUser) {
              const friend = convertToStoreFriend({
                ...(friendUser as any),
                status: payload.new.status,
                added_at: payload.new.created_at,
              });
              addFriend(friend);
            }
          } catch (err) {
            logger.error('Error in friendship INSERT handler', { action: 'friendshipInsertHandler' }, err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loop_friendships',
        },
        async (payload: any) => {
          try {
            const isRelevant = payload.new.user_id === user.id || payload.new.friend_id === user.id;
            if (!isRelevant) return;

            const friendId = payload.new.user_id === user.id
              ? payload.new.friend_id
              : payload.new.user_id;

            if (payload.new.status === 'accepted' && payload.old?.status === 'pending') {
              acceptRequest(friendId);
            } else if (payload.new.status === 'blocked') {
              removeFriend(friendId);
            }
          } catch (err) {
            logger.error('Error in friendship UPDATE handler', { action: 'friendshipUpdateHandler' }, err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'loop_friendships',
        },
        (payload: any) => {
          const friendId = payload.old.user_id === user.id
            ? payload.old.friend_id
            : payload.old.user_id;
          removeFriend(friendId);
        }
      )
      .subscribe();

    // Subscribe to friend user updates (mood, last_active)
    const usersChannel = supabase
      .channel(`friend-users:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
        },
        (payload: any) => {
          // Update friend's mood/last_active if they're a friend
          updateFriend(payload.new.id, {
            currentMood: payload.new.current_mood,
            lastActive: payload.new.last_active,
            avatarUrl: payload.new.avatar_url,
            displayName: payload.new.display_name,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Fetch initial data with cancellation support
    fetchFriends(abortController.signal);

    return () => {
      // Abort any in-flight requests
      abortController.abort();
      channel.unsubscribe();
      usersChannel.unsubscribe();
    };
  }, [user?.id, setFriends, addFriend, removeFriend, updateFriend, acceptRequest, fetchFriends]);

  // Public refresh method (no abort signal - user-initiated)
  const refresh = useCallback(() => fetchFriends(undefined), [fetchFriends]);

  return { refresh };
}

// Hook to manage friend requests
export function useFriendRequests() {
  const { user } = useAuthStore();

  const sendFriendRequest = useCallback(async (friendId: string): Promise<boolean> => {
    if (!user?.id || !canQuerySupabase(user.id)) return false;
    if (!isValidUUID(friendId)) {
      logger.error('Invalid friend ID format', { action: 'sendFriendRequest', metadata: { friendId } });
      return false;
    }

    const { error } = await supabase
      .from('loop_friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      } as any);

    if (error) {
      logger.error('Send friend request error', { action: 'sendFriendRequest', userId: user.id, metadata: { friendId } }, error);
      return false;
    }

    return true;
  }, [user?.id]);

  const acceptFriendRequest = useCallback(async (friendId: string): Promise<boolean> => {
    if (!user?.id || !canQuerySupabase(user.id)) return false;
    if (!isValidUUID(friendId)) {
      logger.error('Invalid friend ID format', { action: 'acceptFriendRequest', metadata: { friendId } });
      return false;
    }

    const { error } = await (supabase
      .from('loop_friendships') as any)
      .update({ status: 'accepted' })
      .or(`and(user_id.eq.${friendId},friend_id.eq.${user.id}),and(user_id.eq.${user.id},friend_id.eq.${friendId})`);

    if (error) {
      logger.error('Accept friend request error', { action: 'acceptFriendRequest', userId: user.id, metadata: { friendId } }, error);
      return false;
    }

    return true;
  }, [user?.id]);

  const removeFriendship = useCallback(async (friendId: string): Promise<boolean> => {
    if (!user?.id || !canQuerySupabase(user.id)) return false;
    if (!isValidUUID(friendId)) {
      logger.error('Invalid friend ID format', { action: 'removeFriendship', metadata: { friendId } });
      return false;
    }

    const { error } = await supabase
      .from('loop_friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (error) {
      logger.error('Remove friendship error', { action: 'removeFriendship', userId: user.id, metadata: { friendId } }, error);
      return false;
    }

    return true;
  }, [user?.id]);

  return { sendFriendRequest, acceptFriendRequest, removeFriendship };
}
