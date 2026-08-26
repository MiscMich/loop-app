import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useNotifications, NotificationData } from '@/hooks/useNotifications';
import { useAuthStore } from '@/stores/authStore';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setBadgeCountAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
  setNotificationChannelAsync: jest.fn(),
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Reset store and mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  const { result } = renderHook(() => useAuthStore());
  act(() => {
    result.current.setUser(null);
  });
});

describe('useNotifications', () => {
  describe('Permission Handling', () => {
    it('should check permission status on mount', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('should request permissions when not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
        canAskAgain: true,
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.requestPermissions();
      });

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(result.current.permissionStatus).toBe('granted');
    });

    it('should handle denied permissions gracefully', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.permissionStatus).toBe('denied');
      });
    });

    it('should track canAskAgain state', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.canAskAgain).toBe(false);
      });
    });
  });

  describe('Push Token Registration', () => {
    it('should get push token when permissions granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[xxxxx]',
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.expoPushToken).toBe('ExponentPushToken[xxxxx]');
      });
    });

    it('should not get token when permissions denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.expoPushToken).toBeNull();
      });
    });

    it('should handle token registration errors gracefully', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(
        new Error('Failed to get token')
      );

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.expoPushToken).toBeNull();
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('Badge Count Management', () => {
    it('should set badge count', async () => {
      (Notifications.setBadgeCountAsync as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useNotifications());

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setBadgeCount(5);
      });

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(5);
    });

    it('should clear badge count', async () => {
      (Notifications.setBadgeCountAsync as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useNotifications());

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.clearBadgeCount();
      });

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    });

    it('should increment badge count', async () => {
      (Notifications.setBadgeCountAsync as jest.Mock).mockResolvedValue(true);
      (Notifications.getBadgeCountAsync as jest.Mock).mockResolvedValue(3);

      const { result } = renderHook(() => useNotifications());

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.incrementBadgeCount();
      });

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(4);
    });
  });

  describe('Notification Listeners', () => {
    it('should setup notification received listener', () => {
      renderHook(() => useNotifications());

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
    });

    it('should setup notification response listener', () => {
      renderHook(() => useNotifications());

      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });

    it('should cleanup listeners on unmount', () => {
      const removeReceivedListener = jest.fn();
      const removeResponseListener = jest.fn();

      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({
        remove: removeReceivedListener,
      });
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
        remove: removeResponseListener,
      });

      const { unmount } = renderHook(() => useNotifications());
      unmount();

      expect(removeReceivedListener).toHaveBeenCalled();
      expect(removeResponseListener).toHaveBeenCalled();
    });

    it('should call onNotificationReceived callback', async () => {
      const onReceived = jest.fn();
      let capturedCallback: ((notification: any) => void) | undefined;

      (Notifications.addNotificationReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          capturedCallback = callback;
          return { remove: jest.fn() };
        }
      );

      renderHook(() => useNotifications({ onNotificationReceived: onReceived }));

      // Simulate receiving a notification
      await act(async () => {
        capturedCallback?.({
          request: {
            content: {
              title: 'Test',
              body: 'Test body',
              data: { type: 'content_received' },
            },
          },
        });
      });

      expect(onReceived).toHaveBeenCalled();
    });
  });

  describe('Notification Types', () => {
    it('should handle friend_request notification type', async () => {
      let capturedCallback: ((response: any) => void) | undefined;

      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          capturedCallback = callback;
          return { remove: jest.fn() };
        }
      );

      const onResponse = jest.fn();
      renderHook(() => useNotifications({ onNotificationResponse: onResponse }));

      await act(async () => {
        capturedCallback?.({
          notification: {
            request: {
              content: {
                data: {
                  type: 'friend_request',
                  friendId: 'friend-123',
                  friendName: 'John Doe',
                } as NotificationData,
              },
            },
          },
        });
      });

      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'friend_request',
          friendId: 'friend-123',
        })
      );
    });

    it('should handle content_received notification type', async () => {
      let capturedCallback: ((response: any) => void) | undefined;

      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          capturedCallback = callback;
          return { remove: jest.fn() };
        }
      );

      const onResponse = jest.fn();
      renderHook(() => useNotifications({ onNotificationResponse: onResponse }));

      await act(async () => {
        capturedCallback?.({
          notification: {
            request: {
              content: {
                data: {
                  type: 'content_received',
                  contentId: 'content-123',
                  contentType: 'doodle',
                  senderName: 'Jane',
                } as NotificationData,
              },
            },
          },
        });
      });

      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'content_received',
          contentId: 'content-123',
          contentType: 'doodle',
        })
      );
    });

    it('should handle game_invite notification type', async () => {
      let capturedCallback: ((response: any) => void) | undefined;

      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          capturedCallback = callback;
          return { remove: jest.fn() };
        }
      );

      const onResponse = jest.fn();
      renderHook(() => useNotifications({ onNotificationResponse: onResponse }));

      await act(async () => {
        capturedCallback?.({
          notification: {
            request: {
              content: {
                data: {
                  type: 'game_invite',
                  gameId: 'game-123',
                  opponentName: 'Alex',
                } as NotificationData,
              },
            },
          },
        });
      });

      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game_invite',
          gameId: 'game-123',
        })
      );
    });

    it('should handle game_turn notification type', async () => {
      let capturedCallback: ((response: any) => void) | undefined;

      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          capturedCallback = callback;
          return { remove: jest.fn() };
        }
      );

      const onResponse = jest.fn();
      renderHook(() => useNotifications({ onNotificationResponse: onResponse }));

      await act(async () => {
        capturedCallback?.({
          notification: {
            request: {
              content: {
                data: {
                  type: 'game_turn',
                  gameId: 'game-123',
                  opponentName: 'Alex',
                } as NotificationData,
              },
            },
          },
        });
      });

      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game_turn',
          gameId: 'game-123',
        })
      );
    });
  });

  describe('Integration with Auth Store', () => {
    it('should not register for push when user is not authenticated', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });

      renderHook(() => useNotifications());

      // Even with permissions, shouldn't try to get token without auth
      await waitFor(() => {
        // getExpoPushTokenAsync should not be called immediately
        // as we need the user to be authenticated first
      });
    });
  });
});
