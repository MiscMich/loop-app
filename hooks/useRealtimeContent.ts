import { useEffect, useCallback, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { supabase, canQuerySupabase, isSupabaseConfigured, isValidUUID } from '@/lib/supabase';
import { useContentStore, Content, ContentReaction, MoodContent } from '@/stores/contentStore';
import { useAuthStore } from '@/stores/authStore';
import { supabaseRetry } from '@/lib/retry';
import { logger } from '@/lib/logger';
import { sendContentRateLimiter } from '@/lib/rateLimit';
import { addToQueue, getQueueSize } from '@/lib/offlineQueue';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ContentWithSender, ContentInsert, Json } from '@/lib/supabase/types';

// Type for database content with joined sender data
interface DbContentWithSender {
  id: string;
  type: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  viewed_at: string | null;
  data: Json;
  sender_name?: string;
  sender_avatar?: string | null;
  sender?: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

// Convert database content to store format
const convertToStoreContent = (dbContent: DbContentWithSender, reactions: ContentReaction[] = []): Content => {
  const base = {
    id: dbContent.id,
    senderId: dbContent.sender_id,
    senderName: dbContent.sender_name || 'Unknown',
    // Convert null to undefined to match BaseContent interface
    senderAvatar: dbContent.sender_avatar ?? undefined,
    recipientId: dbContent.recipient_id,
    createdAt: dbContent.created_at,
    // Convert null to undefined to match BaseContent interface
    viewedAt: dbContent.viewed_at ?? undefined,
    reactions,
  };

  // Safely extract data, handling both object and primitive Json types
  const data = (typeof dbContent.data === 'object' && dbContent.data !== null)
    ? dbContent.data as Record<string, Json | undefined>
    : {};

  switch (dbContent.type) {
    case 'doodle':
      return { ...base, type: 'doodle', imageUrl: String(data.image_url ?? ''), paths: String(data.paths ?? '') };
    case 'photo':
      return { ...base, type: 'photo', imageUrl: String(data.image_url ?? ''), caption: data.caption ? String(data.caption) : undefined };
    case 'mood':
      return { ...base, type: 'mood', emoji: String(data.emoji ?? '?'), note: data.note ? String(data.note) : undefined };
    case 'voice':
      return {
        ...base,
        type: 'voice',
        audioUrl: String(data.audio_url ?? ''),
        duration: Number(data.duration ?? 0),
        waveform: Array.isArray(data.waveform) ? data.waveform as number[] : undefined
      };
    case 'game':
      return { ...base, type: 'game', gameType: 'tictactoe', gameId: String(data.game_id ?? '') };
    default: {
      // Return a mood content as fallback with proper typing
      const fallbackContent: MoodContent = {
        ...base,
        type: 'mood',
        emoji: '?',
        note: 'Unknown content type'
      };
      return fallbackContent;
    }
  }
};

export function useRealtimeContent() {
  const { user } = useAuthStore();
  const { addToFeed, removeFromFeed, markAsViewed, addReaction, removeReaction, setFeed } = useContentStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch initial feed with AbortController support
  const fetchFeed = useCallback(async (signal?: AbortSignal) => {
    if (!user?.id || !canQuerySupabase(user.id)) return;

    try {
      // Check if request was cancelled
      if (signal?.aborted) return;

      // Use direct query instead of RPC for better type compatibility
      const data = await supabaseRetry<any[]>(async () =>
        await supabase
          .from('loop_content')
          .select(`
            *,
            sender:loop_users!sender_id(display_name, avatar_url)
          `)
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
          .abortSignal(signal as AbortSignal)
      );

      if (signal?.aborted) return;

      // Fetch reactions for all content
      const contentIds = data.map((c: any) => c.id);
      const reactions = await supabaseRetry<any[]>(async () =>
        await supabase
          .from('loop_content_reactions')
          .select('*')
          .in('content_id', contentIds)
          .abortSignal(signal as AbortSignal)
      );

      if (signal?.aborted) return;

      const reactionsMap = reactions.reduce((acc: Record<string, ContentReaction[]>, r: any) => {
        if (!acc[r.content_id]) acc[r.content_id] = [];
        acc[r.content_id].push({
          userId: r.user_id,
          emoji: r.emoji,
          createdAt: r.created_at,
        });
        return acc;
      }, {});

      const feed = data.map((c: any) => convertToStoreContent({
        ...c,
        sender_name: c.sender?.display_name,
        sender_avatar: c.sender?.avatar_url,
      }, reactionsMap[c.id] || []));
      setFeed(feed);
    } catch (err: any) {
      // Don't log aborted requests as errors
      if (err?.name === 'AbortError' || signal?.aborted) return;
      logger.error('Failed to fetch feed after retries', {
        action: 'fetchFeed',
        userId: user?.id,
        metadata: {
          errorCode: err?.code,
          errorMessage: err?.message,
        },
      }, err);
    }
  }, [user?.id, setFeed]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user?.id || !canQuerySupabase(user.id)) return;

    // CREATE ABORT CONTROLLER FIRST
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Create channel for content updates
    const channel = supabase
      .channel(`content:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loop_content',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload: any) => {
          try {
            // Fetch full content with sender details
            const { data: fullContent, error } = await supabase
              .from('loop_content')
              .select(`
                *,
                sender:loop_users!sender_id(display_name, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              logger.error('Failed to fetch new content', { action: 'contentInsertHandler', metadata: { contentId: payload.new.id } }, error);
              return;
            }

            if (fullContent) {
              // fullContent has the joined sender data from the select query
              const contentWithSender: DbContentWithSender = {
                ...fullContent,
                sender_name: fullContent.sender?.display_name,
                sender_avatar: fullContent.sender?.avatar_url,
              };
              const content = convertToStoreContent(contentWithSender);
              addToFeed(content);
            }
          } catch (err) {
            logger.error('Error in content INSERT handler', { action: 'contentInsertHandler' }, err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'loop_content',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload: any) => {
          removeFromFeed(payload.old.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loop_content',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new.viewed_at) {
            markAsViewed(payload.new.id);
          }
        }
      )
      .subscribe();

    // Subscribe to reactions
    const reactionsChannel = supabase
      .channel(`reactions:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loop_content_reactions',
        },
        (payload: any) => {
          addReaction(payload.new.content_id, {
            userId: payload.new.user_id,
            emoji: payload.new.emoji,
            createdAt: payload.new.created_at,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'loop_content_reactions',
        },
        (payload: any) => {
          removeReaction(payload.old.content_id, payload.old.user_id);
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Fetch initial data with cancellation support
    fetchFeed(abortController.signal);

    return () => {
      // Abort any in-flight requests
      abortController.abort();
      channel.unsubscribe();
      reactionsChannel.unsubscribe();
    };
  }, [user?.id, addToFeed, removeFromFeed, markAsViewed, addReaction, removeReaction, fetchFeed]);

  // Public refresh method (no abort signal - user-initiated)
  const refresh = useCallback(() => fetchFeed(undefined), [fetchFeed]);

  return { refresh };
}

// Hook to send content with offline queue support
export function useSendContent() {
  const { user } = useAuthStore();
  const { addToSent } = useContentStore();
  const [queueSize, setQueueSize] = useState(0);

  // Refresh queue size on mount and after sends
  const refreshQueueSize = useCallback(async () => {
    const size = await getQueueSize();
    setQueueSize(size);
  }, []);

  useEffect(() => {
    refreshQueueSize();
  }, [refreshQueueSize]);

  const sendContent = useCallback(async (
    recipientId: string,
    type: Content['type'],
    data: Record<string, any>
  ): Promise<boolean> => {
    if (!user?.id) return false;
    if (!isValidUUID(recipientId)) {
      logger.error('Invalid recipient ID format', { action: 'sendContent', metadata: { recipientId } });
      return false;
    }

    // Rate limit check - max 20 sends per minute
    if (!sendContentRateLimiter.check()) {
      logger.warn('Content send rate limited', {
        action: 'sendContent',
        userId: user.id,
        metadata: {
          remainingMs: sendContentRateLimiter.resetIn(),
        },
      });
      return false;
    }

    // Check network connectivity
    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected && netState.isInternetReachable !== false;

    // If Supabase is configured and online, send to server
    if (isSupabaseConfigured() && isOnline) {
      const insertData: ContentInsert = {
        type,
        sender_id: user.id,
        recipient_id: recipientId,
        data: data as Json,
      };
      const { data: newContent, error } = await supabase
        .from('loop_content')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Network error while sending - queue for later
        if (error.message?.includes('network') || error.code === 'PGRST116') {
          logger.debug('Network error, queuing content', { action: 'sendContent' });
          await addToQueue(recipientId, type, data);
          await refreshQueueSize();

          // Still add to local sent store for optimistic UI
          const queuedContent: DbContentWithSender = {
            id: `queued_${Date.now()}`,
            type,
            sender_id: user.id,
            sender_name: user.displayName,
            sender_avatar: user.avatarUrl,
            recipient_id: recipientId,
            created_at: new Date().toISOString(),
            viewed_at: null,
            data: data as Json,
          };
          addToSent(convertToStoreContent(queuedContent));
          return true; // Return true since it's queued
        }

        logger.error('Send content error', { action: 'sendContent', userId: user.id, metadata: { recipientId, type } }, error);
        return false;
      }

      // Add to local sent store
      const sentContent: DbContentWithSender = {
        ...newContent,
        sender_name: user.displayName,
        sender_avatar: user.avatarUrl,
      };
      addToSent(convertToStoreContent(sentContent));
      return true;
    }

    // Offline or Supabase not configured - queue content
    if (isSupabaseConfigured() && !isOnline) {
      logger.debug('Offline, queuing content', { action: 'sendContent' });
      await addToQueue(recipientId, type, data);
      await refreshQueueSize();
    }

    // Add to local sent store for optimistic UI
    const localContent: DbContentWithSender = {
      id: `local_${Date.now()}`,
      type,
      sender_id: user.id,
      sender_name: user.displayName,
      sender_avatar: user.avatarUrl,
      recipient_id: recipientId,
      created_at: new Date().toISOString(),
      viewed_at: null,
      data: data as Json,
    };
    addToSent(convertToStoreContent(localContent));
    return true;
  }, [user, addToSent, refreshQueueSize]);

  return { sendContent, queueSize, refreshQueueSize };
}
