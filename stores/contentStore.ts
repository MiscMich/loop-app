import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ssrSafeStorage } from '@/lib/ssrStorage';
import { track, AnalyticsEvent } from '@/lib/analytics';

export type ContentType = 'doodle' | 'photo' | 'mood' | 'voice' | 'game';

export interface BaseContent {
  id: string;
  type: ContentType;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  createdAt: string;
  viewedAt?: string;
  reactions: ContentReaction[];
}

export interface DoodleContent extends BaseContent {
  type: 'doodle';
  imageUrl: string;
  paths: string; // Serialized Skia paths
}

export interface PhotoContent extends BaseContent {
  type: 'photo';
  imageUrl: string;
  caption?: string;
}

export interface MoodContent extends BaseContent {
  type: 'mood';
  emoji: string;
  note?: string;
}

export interface VoiceContent extends BaseContent {
  type: 'voice';
  audioUrl: string;
  duration: number; // seconds
  waveform?: number[]; // for visualization
}

export interface GameContent extends BaseContent {
  type: 'game';
  gameType: 'tictactoe';
  gameId: string;
}

export type Content =
  | DoodleContent
  | PhotoContent
  | MoodContent
  | VoiceContent
  | GameContent;

export interface ContentReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

interface ContentState {
  feed: Content[];
  sent: Content[];
  isLoading: boolean;
  currentMood: MoodContent | null;

  // Actions
  setFeed: (content: Content[]) => void;
  addToFeed: (content: Content) => void;
  removeFromFeed: (contentId: string) => void;
  markAsViewed: (contentId: string) => void;
  addReaction: (contentId: string, reaction: ContentReaction) => void;
  removeReaction: (contentId: string, userId: string) => void;
  setSent: (content: Content[]) => void;
  addToSent: (content: Content) => void;
  setCurrentMood: (mood: MoodContent | null) => void;
  setLoading: (loading: boolean) => void;
  getUnviewedCount: () => number;
  getContentById: (id: string) => Content | undefined;
}

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      feed: [],
      sent: [],
      isLoading: false,
      currentMood: null,

      setFeed: (feed) => set({ feed }),

      addToFeed: (content) =>
        set((state) => ({
          feed: [content, ...state.feed].slice(0, 100), // Keep max 100 items in memory
        })),

      removeFromFeed: (contentId) =>
        set((state) => ({
          feed: state.feed.filter((c) => c.id !== contentId),
        })),

      markAsViewed: (contentId) => {
        const content = get().feed.find((c) => c.id === contentId);
        set((state) => ({
          feed: state.feed.map((c) =>
            c.id === contentId
              ? { ...c, viewedAt: new Date().toISOString() }
              : c
          ),
        }));

        // Track content viewed
        if (content && !content.viewedAt) {
          track(AnalyticsEvent.CONTENT_VIEWED, {
            contentType: content.type,
            contentId: content.id,
          });
        }
      },

      addReaction: (contentId, reaction) => {
        const content = get().feed.find((c) => c.id === contentId);
        const isDuplicate = content?.reactions.some(r => r.userId === reaction.userId);

        set((state) => ({
          feed: state.feed.map((c) =>
            c.id === contentId
              ? {
                  ...c,
                  reactions: c.reactions.some(r => r.userId === reaction.userId)
                    ? c.reactions // Don't add duplicate
                    : [...c.reactions, reaction]
                }
              : c
          ),
        }));

        // Track reaction added (if not duplicate)
        if (content && !isDuplicate) {
          track(AnalyticsEvent.CONTENT_REACTION_ADDED, {
            contentType: content.type,
            contentId: content.id,
            emoji: reaction.emoji,
          });
        }
      },

      removeReaction: (contentId, userId) => {
        const content = get().feed.find((c) => c.id === contentId);

        set((state) => ({
          feed: state.feed.map((c) =>
            c.id === contentId
              ? {
                  ...c,
                  reactions: c.reactions.filter((r) => r.userId !== userId),
                }
              : c
          ),
        }));

        // Track reaction removed
        if (content) {
          track(AnalyticsEvent.CONTENT_REACTION_REMOVED, {
            contentType: content.type,
            contentId: content.id,
          });
        }
      },

      setSent: (sent) => set({ sent }),

      addToSent: (content) => {
        set((state) => ({
          sent: [content, ...state.sent],
        }));

        // Track content sent
        track(AnalyticsEvent.CONTENT_SENT, {
          contentType: content.type,
          contentId: content.id,
          recipientId: content.recipientId,
        });
      },

      setCurrentMood: (currentMood) => {
        set({ currentMood });

        // Track mood set if mood is being set (not cleared)
        if (currentMood) {
          track(AnalyticsEvent.MOOD_SET, {
            contentType: 'mood',
            emoji: currentMood.emoji,
          });
        }
      },

      setLoading: (isLoading) => set({ isLoading }),

      getUnviewedCount: () =>
        get().feed.filter((c) => !c.viewedAt).length,

      getContentById: (id) => {
        const { feed, sent } = get();
        return feed.find((c) => c.id === id) || sent.find((c) => c.id === id);
      },
    }),
    {
      name: 'loop-content-storage',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        feed: state.feed.slice(0, 50), // Keep last 50 items cached
        currentMood: state.currentMood,
      }),
    }
  )
);
