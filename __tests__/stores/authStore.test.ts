import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore, User } from '@/stores/authStore';

// Reset store between tests
beforeEach(() => {
  const { result } = renderHook(() => useAuthStore());
  act(() => {
    result.current.setUser(null);
    result.current.setLoading(false);
    result.current.setOnboarded(false);
  });
});

describe('AuthStore', () => {
  describe('Initial State', () => {
    it('should have null user initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBeNull();
    });

    it('should not be authenticated initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should not be onboarded initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isOnboarded).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user and authenticate when user provided', () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser: User = {
        id: 'test-id',
        username: 'testuser',
        displayName: 'Test User',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear user and deauthenticate when null provided', () => {
      const { result } = renderHook(() => useAuthStore());

      // First set a user
      act(() => {
        result.current.setUser({
          id: 'test-id',
          username: 'testuser',
          displayName: 'Test User',
          createdAt: new Date().toISOString(),
        });
      });

      // Then clear
      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set loading state to false', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setOnboarded', () => {
    it('should set onboarded state to true', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setOnboarded(true);
      });

      expect(result.current.isOnboarded).toBe(true);
    });

    it('should set onboarded state to false', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setOnboarded(true);
        result.current.setOnboarded(false);
      });

      expect(result.current.isOnboarded).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should clear user and authentication state', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Set up authenticated state
      act(() => {
        result.current.setUser({
          id: 'test-id',
          username: 'testuser',
          displayName: 'Test User',
          createdAt: new Date().toISOString(),
        });
        result.current.setOnboarded(true);
      });

      // Sign out
      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isOnboarded).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile fields', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Set up user
      act(() => {
        result.current.setUser({
          id: 'test-id',
          username: 'testuser',
          displayName: 'Test User',
          createdAt: new Date().toISOString(),
        });
      });

      // Update profile
      await act(async () => {
        await result.current.updateProfile({
          displayName: 'Updated Name',
          bio: 'New bio',
        });
      });

      expect(result.current.user?.displayName).toBe('Updated Name');
      expect(result.current.user?.bio).toBe('New bio');
    });

    it('should not update if no user exists', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.updateProfile({
          displayName: 'Updated Name',
        });
      });

      expect(result.current.user).toBeNull();
    });

    it('should preserve existing fields when updating', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: 'test-id',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
        });
      });

      await act(async () => {
        await result.current.updateProfile({
          bio: 'New bio',
        });
      });

      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.user?.username).toBe('testuser');
      expect(result.current.user?.bio).toBe('New bio');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty username gracefully', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: 'test-id',
          username: '',
          displayName: 'Test User',
          createdAt: new Date().toISOString(),
        });
      });

      expect(result.current.user?.username).toBe('');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle special characters in displayName', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: 'test-id',
          username: 'testuser',
          displayName: 'Test User 🎉 @special',
          createdAt: new Date().toISOString(),
        });
      });

      expect(result.current.user?.displayName).toBe('Test User 🎉 @special');
    });

    it('should handle very long bio', async () => {
      const { result } = renderHook(() => useAuthStore());
      const longBio = 'a'.repeat(1000);

      act(() => {
        result.current.setUser({
          id: 'test-id',
          username: 'testuser',
          displayName: 'Test User',
          createdAt: new Date().toISOString(),
        });
      });

      await act(async () => {
        await result.current.updateProfile({ bio: longBio });
      });

      expect(result.current.user?.bio?.length).toBe(1000);
    });
  });
});
