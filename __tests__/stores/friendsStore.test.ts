import { renderHook, act } from '@testing-library/react-native';
import { useFriendsStore, Friend, FriendGroup, ReportReason } from '@/stores/friendsStore';

// Reset store between tests
beforeEach(() => {
  const { result } = renderHook(() => useFriendsStore());
  act(() => {
    result.current.setFriends([]);
    result.current.setGroups([]);
    // Clear blocked users by unblocking
    result.current.blockedUsers.forEach(u => result.current.unblockUser(u.id));
  });
});

describe('FriendsStore', () => {
  describe('Initial State', () => {
    it('should have empty friends list initially', () => {
      const { result } = renderHook(() => useFriendsStore());
      expect(result.current.friends).toEqual([]);
    });

    it('should have empty groups list initially', () => {
      const { result } = renderHook(() => useFriendsStore());
      expect(result.current.groups).toEqual([]);
    });

    it('should have empty pending requests initially', () => {
      const { result } = renderHook(() => useFriendsStore());
      expect(result.current.pendingRequests).toEqual([]);
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useFriendsStore());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setFriends', () => {
    it('should separate accepted friends from pending', () => {
      const { result } = renderHook(() => useFriendsStore());

      const friends: Friend[] = [
        {
          id: '1',
          username: 'friend1',
          displayName: 'Friend 1',
          status: 'accepted',
          addedAt: new Date().toISOString(),
        },
        {
          id: '2',
          username: 'friend2',
          displayName: 'Friend 2',
          status: 'pending',
          addedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.setFriends(friends);
      });

      expect(result.current.friends).toHaveLength(1);
      expect(result.current.friends[0].id).toBe('1');
      expect(result.current.pendingRequests).toHaveLength(1);
      expect(result.current.pendingRequests[0].id).toBe('2');
    });
  });

  describe('addFriend', () => {
    it('should add accepted friend to friends list', () => {
      const { result } = renderHook(() => useFriendsStore());

      const friend: Friend = {
        id: '1',
        username: 'friend1',
        displayName: 'Friend 1',
        status: 'accepted',
        addedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addFriend(friend);
      });

      expect(result.current.friends).toHaveLength(1);
      expect(result.current.pendingRequests).toHaveLength(0);
    });

    it('should add pending friend to pending list', () => {
      const { result } = renderHook(() => useFriendsStore());

      const friend: Friend = {
        id: '1',
        username: 'friend1',
        displayName: 'Friend 1',
        status: 'pending',
        addedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addFriend(friend);
      });

      expect(result.current.friends).toHaveLength(0);
      expect(result.current.pendingRequests).toHaveLength(1);
    });
  });

  describe('removeFriend', () => {
    it('should remove friend from friends list', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.addFriend({
          id: '1',
          username: 'friend1',
          displayName: 'Friend 1',
          status: 'accepted',
          addedAt: new Date().toISOString(),
        });
      });

      act(() => {
        result.current.removeFriend('1');
      });

      expect(result.current.friends).toHaveLength(0);
    });

    it('should remove pending request', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.addFriend({
          id: '1',
          username: 'friend1',
          displayName: 'Friend 1',
          status: 'pending',
          addedAt: new Date().toISOString(),
        });
      });

      act(() => {
        result.current.removeFriend('1');
      });

      expect(result.current.pendingRequests).toHaveLength(0);
    });
  });

  describe('acceptRequest', () => {
    it('should move friend from pending to accepted', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.addFriend({
          id: '1',
          username: 'friend1',
          displayName: 'Friend 1',
          status: 'pending',
          addedAt: new Date().toISOString(),
        });
      });

      act(() => {
        result.current.acceptRequest('1');
      });

      expect(result.current.pendingRequests).toHaveLength(0);
      expect(result.current.friends).toHaveLength(1);
      expect(result.current.friends[0].status).toBe('accepted');
    });

    it('should not crash if request not found', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.acceptRequest('nonexistent');
      });

      expect(result.current.friends).toHaveLength(0);
    });
  });

  describe('Groups', () => {
    it('should create a group', () => {
      const { result } = renderHook(() => useFriendsStore());

      const group: FriendGroup = {
        id: '1',
        name: 'Best Friends',
        members: [],
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.createGroup(group);
      });

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].name).toBe('Best Friends');
    });

    it('should add friend to group', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.createGroup({
          id: '1',
          name: 'Best Friends',
          members: [],
          createdAt: new Date().toISOString(),
        });
        result.current.addToGroup('1', 'friend1');
      });

      expect(result.current.groups[0].members).toContain('friend1');
    });

    it('should remove friend from group', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.createGroup({
          id: '1',
          name: 'Best Friends',
          members: ['friend1', 'friend2'],
          createdAt: new Date().toISOString(),
        });
        result.current.removeFromGroup('1', 'friend1');
      });

      expect(result.current.groups[0].members).not.toContain('friend1');
      expect(result.current.groups[0].members).toContain('friend2');
    });
  });

  describe('Block/Report', () => {
    it('should block a user', () => {
      const { result } = renderHook(() => useFriendsStore());

      // Add a friend first
      act(() => {
        result.current.addFriend({
          id: '1',
          username: 'friend1',
          displayName: 'Friend 1',
          status: 'accepted',
          addedAt: new Date().toISOString(),
        });
      });

      act(() => {
        result.current.blockUser({
          id: '1',
          username: 'friend1',
          displayName: 'Friend 1',
        });
      });

      expect(result.current.blockedUsers).toHaveLength(1);
      expect(result.current.friends).toHaveLength(0); // Should be removed from friends
    });

    it('should unblock a user', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.blockUser({
          id: '1',
          username: 'blocked1',
          displayName: 'Blocked User',
        });
      });

      act(() => {
        result.current.unblockUser('1');
      });

      expect(result.current.blockedUsers).toHaveLength(0);
    });

    it('should check if user is blocked', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.blockUser({
          id: '1',
          username: 'blocked1',
          displayName: 'Blocked User',
        });
      });

      expect(result.current.isUserBlocked('1')).toBe(true);
      expect(result.current.isUserBlocked('2')).toBe(false);
    });

    it('should remove blocked user from all groups', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.createGroup({
          id: 'group1',
          name: 'Test Group',
          members: ['1', '2', '3'],
          createdAt: new Date().toISOString(),
        });
        result.current.blockUser({
          id: '1',
          username: 'blocked1',
          displayName: 'Blocked User',
        });
      });

      expect(result.current.groups[0].members).not.toContain('1');
      expect(result.current.groups[0].members).toContain('2');
    });

    it('should report a user', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.reportUser({
          reportedUserId: '1',
          reportedUsername: 'baduser',
          reason: 'harassment' as ReportReason,
          details: 'Test report',
        });
      });

      const reports = result.current.getReports();
      expect(reports).toHaveLength(1);
      expect(reports[0].reason).toBe('harassment');
      expect(reports[0].status).toBe('pending');
    });

    it('should create report with unique ID', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.reportUser({
          reportedUserId: '1',
          reportedUsername: 'user1',
          reason: 'spam' as ReportReason,
        });
        result.current.reportUser({
          reportedUserId: '2',
          reportedUsername: 'user2',
          reason: 'harassment' as ReportReason,
        });
      });

      const reports = result.current.getReports();
      expect(reports[0].id).not.toBe(reports[1].id);
    });
  });

  describe('getFriendById', () => {
    it('should find friend by ID', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.addFriend({
          id: '1',
          username: 'friend1',
          displayName: 'Friend 1',
          status: 'accepted',
          addedAt: new Date().toISOString(),
        });
      });

      const friend = result.current.getFriendById('1');
      expect(friend).toBeDefined();
      expect(friend?.username).toBe('friend1');
    });

    it('should return undefined for non-existent friend', () => {
      const { result } = renderHook(() => useFriendsStore());

      const friend = result.current.getFriendById('nonexistent');
      expect(friend).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle max 5 friends limit check', () => {
      const { result } = renderHook(() => useFriendsStore());

      // Add 5 friends
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.addFriend({
            id: `${i}`,
            username: `friend${i}`,
            displayName: `Friend ${i}`,
            status: 'accepted',
            addedAt: new Date().toISOString(),
          });
        });
      }

      expect(result.current.friends).toHaveLength(5);
    });

    it('should handle updating friend mood', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.addFriend({
          id: '1',
          username: 'friend1',
          displayName: 'Friend 1',
          status: 'accepted',
          addedAt: new Date().toISOString(),
        });
      });

      act(() => {
        result.current.updateFriend('1', { currentMood: '😊' });
      });

      expect(result.current.friends[0].currentMood).toBe('😊');
    });

    it('should handle friend with avatar', () => {
      const { result } = renderHook(() => useFriendsStore());

      act(() => {
        result.current.addFriend({
          id: '1',
          username: 'friend1',
          displayName: 'Friend 1',
          avatarUrl: 'https://example.com/avatar.jpg',
          status: 'accepted',
          addedAt: new Date().toISOString(),
        });
      });

      expect(result.current.friends[0].avatarUrl).toBe('https://example.com/avatar.jpg');
    });
  });
});
