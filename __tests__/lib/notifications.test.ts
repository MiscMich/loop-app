import * as Notifications from 'expo-notifications';
import {
  scheduleLocalNotification,
  scheduleFriendRequestNotification,
  scheduleContentReceivedNotification,
  scheduleGameInviteNotification,
  scheduleGameTurnNotification,
  cancelAllNotifications,
  getNotificationContent,
  NotificationType,
} from '@/lib/notifications';

// The mock is already set up in jest.setup.js - we just need to properly configure it per test
beforeEach(() => {
  jest.clearAllMocks();
  // Set default return value for all tests
  (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');
});

describe('notifications lib', () => {
  describe('scheduleLocalNotification', () => {
    it('should schedule a notification with correct content', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');

      const result = await scheduleLocalNotification({
        title: 'Test Title',
        body: 'Test Body',
        data: { type: 'content_received' as NotificationType },
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          data: { type: 'content_received' },
          sound: true,
        },
        trigger: null, // Immediate
      });
      expect(result).toBe('notification-id');
    });

    it('should allow custom trigger delay', async () => {
      await scheduleLocalNotification({
        title: 'Delayed',
        body: 'Body',
        data: { type: 'friend_request' as NotificationType },
        delaySeconds: 5,
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({
            seconds: 5,
          }),
        })
      );
    });

    it('should handle scheduling errors gracefully', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Failed to schedule')
      );

      const result = await scheduleLocalNotification({
        title: 'Test',
        body: 'Test',
        data: { type: 'friend_request' as NotificationType },
      });

      expect(result).toBeNull();
    });
  });

  describe('scheduleFriendRequestNotification', () => {
    it('should create correct notification for friend request', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-id');

      await scheduleFriendRequestNotification({
        friendId: 'friend-123',
        friendName: 'Jane Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'New Friend Request',
          body: 'Jane Doe wants to be your friend',
          data: {
            type: 'friend_request',
            friendId: 'friend-123',
            friendName: 'Jane Doe',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
          sound: true,
        },
        trigger: null,
      });
    });

    it('should handle missing avatar gracefully', async () => {
      await scheduleFriendRequestNotification({
        friendId: 'friend-123',
        friendName: 'Jane',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            data: expect.objectContaining({
              friendId: 'friend-123',
              avatarUrl: undefined,
            }),
          }),
        })
      );
    });
  });

  describe('scheduleContentReceivedNotification', () => {
    it('should create notification for doodle content', async () => {
      await scheduleContentReceivedNotification({
        contentId: 'content-123',
        contentType: 'doodle',
        senderName: 'Alex',
        senderId: 'sender-123',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'New Doodle',
          body: 'Alex sent you a doodle',
          data: {
            type: 'content_received',
            contentId: 'content-123',
            contentType: 'doodle',
            senderName: 'Alex',
            senderId: 'sender-123',
          },
          sound: true,
        },
        trigger: null,
      });
    });

    it('should create notification for photo content', async () => {
      await scheduleContentReceivedNotification({
        contentId: 'content-456',
        contentType: 'photo',
        senderName: 'Sam',
        senderId: 'sender-456',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'New Photo',
            body: 'Sam sent you a photo',
          }),
        })
      );
    });

    it('should create notification for mood content', async () => {
      await scheduleContentReceivedNotification({
        contentId: 'content-789',
        contentType: 'mood',
        senderName: 'Taylor',
        senderId: 'sender-789',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'New Mood Update',
            body: 'Taylor shared their mood with you',
          }),
        })
      );
    });

    it('should create notification for voice content', async () => {
      await scheduleContentReceivedNotification({
        contentId: 'content-101',
        contentType: 'voice',
        senderName: 'Jordan',
        senderId: 'sender-101',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'New Voice Note',
            body: 'Jordan sent you a voice note',
          }),
        })
      );
    });
  });

  describe('scheduleGameInviteNotification', () => {
    it('should create notification for game invite', async () => {
      await scheduleGameInviteNotification({
        gameId: 'game-123',
        opponentId: 'opponent-123',
        opponentName: 'Chris',
        gameType: 'tictactoe',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Game Invite',
          body: 'Chris wants to play Tic-Tac-Toe with you',
          data: {
            type: 'game_invite',
            gameId: 'game-123',
            opponentId: 'opponent-123',
            opponentName: 'Chris',
            gameType: 'tictactoe',
          },
          sound: true,
        },
        trigger: null,
      });
    });
  });

  describe('scheduleGameTurnNotification', () => {
    it('should create notification for game turn', async () => {
      await scheduleGameTurnNotification({
        gameId: 'game-456',
        opponentId: 'opponent-456',
        opponentName: 'Morgan',
        gameType: 'tictactoe',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: "It's Your Turn!",
          body: 'Morgan made a move in Tic-Tac-Toe',
          data: {
            type: 'game_turn',
            gameId: 'game-456',
            opponentId: 'opponent-456',
            opponentName: 'Morgan',
            gameType: 'tictactoe',
          },
          sound: true,
        },
        trigger: null,
      });
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all scheduled notifications', async () => {
      await cancelAllNotifications();
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('getNotificationContent', () => {
    it('should return correct content for friend_request type', () => {
      const content = getNotificationContent('friend_request', { friendName: 'Alex' });

      expect(content.title).toBe('New Friend Request');
      expect(content.body).toBe('Alex wants to be your friend');
    });

    it('should return correct content for content_received type with doodle', () => {
      const content = getNotificationContent('content_received', {
        senderName: 'Sam',
        contentType: 'doodle',
      });

      expect(content.title).toBe('New Doodle');
      expect(content.body).toBe('Sam sent you a doodle');
    });

    it('should return correct content for game_invite type', () => {
      const content = getNotificationContent('game_invite', { opponentName: 'Jordan' });

      expect(content.title).toBe('Game Invite');
      expect(content.body).toContain('Jordan');
    });

    it('should return correct content for game_turn type', () => {
      const content = getNotificationContent('game_turn', { opponentName: 'Taylor' });

      expect(content.title).toBe("It's Your Turn!");
      expect(content.body).toContain('Taylor');
    });

    it('should handle unknown notification type', () => {
      const content = getNotificationContent('unknown' as NotificationType, {});

      expect(content.title).toBe('Loop');
      expect(content.body).toBe('You have a new notification');
    });
  });
});
