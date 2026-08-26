import { renderHook, act } from '@testing-library/react-native';
import { useContentStore, Content, MoodContent, ContentReaction } from '@/stores/contentStore';

// Reset store between tests
beforeEach(() => {
  const { result } = renderHook(() => useContentStore());
  act(() => {
    result.current.setFeed([]);
    result.current.setSent([]);
    result.current.setCurrentMood(null);
    result.current.setLoading(false);
  });
});

const createMockContent = (overrides?: Partial<Content>): Content => ({
  id: 'test-id',
  type: 'mood',
  senderId: 'sender-1',
  senderName: 'Test Sender',
  recipientId: 'recipient-1',
  createdAt: new Date().toISOString(),
  reactions: [],
  emoji: '😊',
  ...overrides,
} as Content);

describe('ContentStore', () => {
  describe('Initial State', () => {
    it('should have empty feed initially', () => {
      const { result } = renderHook(() => useContentStore());
      expect(result.current.feed).toEqual([]);
    });

    it('should have empty sent list initially', () => {
      const { result } = renderHook(() => useContentStore());
      expect(result.current.sent).toEqual([]);
    });

    it('should have null current mood initially', () => {
      const { result } = renderHook(() => useContentStore());
      expect(result.current.currentMood).toBeNull();
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useContentStore());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Feed Management', () => {
    it('should set feed', () => {
      const { result } = renderHook(() => useContentStore());
      const content = [createMockContent({ id: '1' }), createMockContent({ id: '2' })];

      act(() => {
        result.current.setFeed(content);
      });

      expect(result.current.feed).toHaveLength(2);
    });

    it('should add to feed at the beginning', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setFeed([createMockContent({ id: '1' })]);
      });

      act(() => {
        result.current.addToFeed(createMockContent({ id: '2' }));
      });

      expect(result.current.feed[0].id).toBe('2');
      expect(result.current.feed[1].id).toBe('1');
    });

    it('should remove from feed', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setFeed([
          createMockContent({ id: '1' }),
          createMockContent({ id: '2' }),
        ]);
      });

      act(() => {
        result.current.removeFromFeed('1');
      });

      expect(result.current.feed).toHaveLength(1);
      expect(result.current.feed[0].id).toBe('2');
    });
  });

  describe('View Tracking', () => {
    it('should mark content as viewed', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setFeed([createMockContent({ id: '1' })]);
      });

      expect(result.current.feed[0].viewedAt).toBeUndefined();

      act(() => {
        result.current.markAsViewed('1');
      });

      expect(result.current.feed[0].viewedAt).toBeDefined();
    });

    it('should count unviewed content', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setFeed([
          createMockContent({ id: '1' }),
          createMockContent({ id: '2' }),
          createMockContent({ id: '3', viewedAt: new Date().toISOString() } as any),
        ]);
      });

      expect(result.current.getUnviewedCount()).toBe(2);
    });

    it('should return 0 for empty feed', () => {
      const { result } = renderHook(() => useContentStore());
      expect(result.current.getUnviewedCount()).toBe(0);
    });
  });

  describe('Reactions', () => {
    it('should add reaction to content', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setFeed([createMockContent({ id: '1', reactions: [] })]);
      });

      const reaction: ContentReaction = {
        userId: 'user-1',
        emoji: '❤️',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addReaction('1', reaction);
      });

      expect(result.current.feed[0].reactions).toHaveLength(1);
      expect(result.current.feed[0].reactions[0].emoji).toBe('❤️');
    });

    it('should remove reaction from content', () => {
      const { result } = renderHook(() => useContentStore());

      const reactions: ContentReaction[] = [
        { userId: 'user-1', emoji: '❤️', createdAt: new Date().toISOString() },
        { userId: 'user-2', emoji: '😂', createdAt: new Date().toISOString() },
      ];

      act(() => {
        result.current.setFeed([createMockContent({ id: '1', reactions })]);
      });

      act(() => {
        result.current.removeReaction('1', 'user-1');
      });

      expect(result.current.feed[0].reactions).toHaveLength(1);
      expect(result.current.feed[0].reactions[0].userId).toBe('user-2');
    });

    it('should keep only one reaction per user', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setFeed([createMockContent({ id: '1', reactions: [] })]);
      });

      act(() => {
        result.current.addReaction('1', {
          userId: 'user-1',
          emoji: '❤️',
          createdAt: new Date().toISOString(),
        });
        result.current.addReaction('1', {
          userId: 'user-1',
          emoji: '😂',
          createdAt: new Date().toISOString(),
        });
      });

      expect(result.current.feed[0].reactions).toHaveLength(1);
      expect(result.current.feed[0].reactions[0].emoji).toBe('❤️');
    });
  });

  describe('Sent Content', () => {
    it('should set sent content', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setSent([createMockContent({ id: '1' })]);
      });

      expect(result.current.sent).toHaveLength(1);
    });

    it('should add to sent at the beginning', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setSent([createMockContent({ id: '1' })]);
      });

      act(() => {
        result.current.addToSent(createMockContent({ id: '2' }));
      });

      expect(result.current.sent[0].id).toBe('2');
    });
  });

  describe('Current Mood', () => {
    it('should set current mood', () => {
      const { result } = renderHook(() => useContentStore());

      const mood: MoodContent = {
        id: 'mood-1',
        type: 'mood',
        senderId: 'user-1',
        senderName: 'Test User',
        recipientId: 'all',
        createdAt: new Date().toISOString(),
        reactions: [],
        emoji: '😊',
        note: 'Feeling great!',
      };

      act(() => {
        result.current.setCurrentMood(mood);
      });

      expect(result.current.currentMood).toEqual(mood);
      expect(result.current.currentMood?.emoji).toBe('😊');
    });

    it('should clear current mood', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setCurrentMood({
          id: 'mood-1',
          type: 'mood',
          senderId: 'user-1',
          senderName: 'Test User',
          recipientId: 'all',
          createdAt: new Date().toISOString(),
          reactions: [],
          emoji: '😊',
        });
      });

      act(() => {
        result.current.setCurrentMood(null);
      });

      expect(result.current.currentMood).toBeNull();
    });
  });

  describe('getContentById', () => {
    it('should find content in feed', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setFeed([createMockContent({ id: 'feed-1' })]);
      });

      const content = result.current.getContentById('feed-1');
      expect(content).toBeDefined();
      expect(content?.id).toBe('feed-1');
    });

    it('should find content in sent', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setSent([createMockContent({ id: 'sent-1' })]);
      });

      const content = result.current.getContentById('sent-1');
      expect(content).toBeDefined();
      expect(content?.id).toBe('sent-1');
    });

    it('should return undefined for non-existent content', () => {
      const { result } = renderHook(() => useContentStore());

      const content = result.current.getContentById('nonexistent');
      expect(content).toBeUndefined();
    });

    it('should prefer feed over sent for same ID', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setFeed([createMockContent({ id: 'same-id', senderName: 'Feed' })]);
        result.current.setSent([createMockContent({ id: 'same-id', senderName: 'Sent' })]);
      });

      const content = result.current.getContentById('same-id');
      expect(content?.senderName).toBe('Feed');
    });
  });

  describe('Content Types', () => {
    it('should handle doodle content', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.addToFeed({
          id: 'doodle-1',
          type: 'doodle',
          senderId: 'user-1',
          senderName: 'Artist',
          recipientId: 'user-2',
          createdAt: new Date().toISOString(),
          reactions: [],
          imageUrl: 'https://example.com/doodle.png',
          paths: '[]',
        });
      });

      expect(result.current.feed[0].type).toBe('doodle');
    });

    it('should handle photo content', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.addToFeed({
          id: 'photo-1',
          type: 'photo',
          senderId: 'user-1',
          senderName: 'Photographer',
          recipientId: 'user-2',
          createdAt: new Date().toISOString(),
          reactions: [],
          imageUrl: 'https://example.com/photo.jpg',
          caption: 'Nice day!',
        });
      });

      expect(result.current.feed[0].type).toBe('photo');
    });

    it('should handle voice content', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.addToFeed({
          id: 'voice-1',
          type: 'voice',
          senderId: 'user-1',
          senderName: 'Speaker',
          recipientId: 'user-2',
          createdAt: new Date().toISOString(),
          reactions: [],
          audioUrl: 'https://example.com/voice.m4a',
          duration: 5,
        });
      });

      expect(result.current.feed[0].type).toBe('voice');
    });

    it('should handle game content', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.addToFeed({
          id: 'game-1',
          type: 'game',
          senderId: 'user-1',
          senderName: 'Player',
          recipientId: 'user-2',
          createdAt: new Date().toISOString(),
          reactions: [],
          gameType: 'tictactoe',
          gameId: 'game-123',
        });
      });

      expect(result.current.feed[0].type).toBe('game');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty emoji in mood', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setCurrentMood({
          id: 'mood-1',
          type: 'mood',
          senderId: 'user-1',
          senderName: 'Test',
          recipientId: 'all',
          createdAt: new Date().toISOString(),
          reactions: [],
          emoji: '',
        });
      });

      expect(result.current.currentMood?.emoji).toBe('');
    });

    it('should handle very long caption', () => {
      const { result } = renderHook(() => useContentStore());
      const longCaption = 'a'.repeat(500);

      act(() => {
        result.current.addToFeed({
          id: 'photo-1',
          type: 'photo',
          senderId: 'user-1',
          senderName: 'Test',
          recipientId: 'user-2',
          createdAt: new Date().toISOString(),
          reactions: [],
          imageUrl: 'https://example.com/photo.jpg',
          caption: longCaption,
        });
      });

      const content = result.current.feed[0] as any;
      expect(content.caption.length).toBe(500);
    });

    it('should handle special characters in sender name', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.addToFeed(createMockContent({
          id: '1',
          senderName: 'Test 🎉 User @special',
        }));
      });

      expect(result.current.feed[0].senderName).toBe('Test 🎉 User @special');
    });
  });
});
