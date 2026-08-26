import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ssrSafeStorage } from '@/lib/ssrStorage';
import { track, AnalyticsEvent } from '@/lib/analytics';
import { logger } from '@/lib/logger';

// Maximum friends allowed at launch (PRD: FRIEND-05)
export const MAX_FRIENDS = 5;

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'pending' | 'accepted';
  addedAt: string;
  lastActive?: string;
  currentMood?: string;
}

export interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  blockedAt: string;
  reason?: string;
}

export interface Report {
  id: string;
  reportedUserId: string;
  reportedUsername: string;
  reason: ReportReason;
  details?: string;
  contentId?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export type ReportReason =
  | 'harassment'
  | 'inappropriate_content'
  | 'spam'
  | 'impersonation'
  | 'other';

export interface FriendGroup {
  id: string;
  name: string;
  members: string[]; // Friend IDs
  createdAt: string;
}

interface FriendsState {
  friends: Friend[];
  groups: FriendGroup[];
  pendingRequests: Friend[];
  blockedUsers: BlockedUser[];
  reports: Report[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  updateFriend: (friendId: string, updates: Partial<Friend>) => void;
  acceptRequest: (friendId: string) => void;
  setGroups: (groups: FriendGroup[]) => void;
  createGroup: (group: FriendGroup) => void;
  addToGroup: (groupId: string, friendId: string) => void;
  removeFromGroup: (groupId: string, friendId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  getFriendById: (id: string) => Friend | undefined;

  // Friend limit helpers
  canAddMoreFriends: () => boolean;
  getFriendCount: () => number;
  getRemainingSlots: () => number;

  // Block/Report actions
  blockUser: (user: { id: string; username: string; displayName: string }, reason?: string) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
  reportUser: (report: Omit<Report, 'id' | 'createdAt' | 'status'>) => void;
  getReports: () => Report[];
}

export const useFriendsStore = create<FriendsState>()(
  persist(
    (set, get) => ({
      friends: [],
      groups: [],
      pendingRequests: [],
      blockedUsers: [],
      reports: [],
      isLoading: false,
      error: null,

      setFriends: (friends) =>
        set({
          friends: friends.filter((f) => f.status === 'accepted'),
          pendingRequests: friends.filter((f) => f.status === 'pending'),
        }),

      addFriend: (friend) => {
        const currentFriendCount = get().friends.length;
        set((state) => ({
          friends:
            friend.status === 'accepted'
              ? [...state.friends, friend]
              : state.friends,
          pendingRequests:
            friend.status === 'pending'
              ? [...state.pendingRequests, friend]
              : state.pendingRequests,
        }));

        // Track friend added or request sent
        if (friend.status === 'accepted') {
          track(AnalyticsEvent.FRIEND_ADDED, {
            friendId: friend.id,
            friendUsername: friend.username,
            totalFriends: currentFriendCount + 1,
          });
        } else if (friend.status === 'pending') {
          track(AnalyticsEvent.FRIEND_REQUEST_SENT, {
            friendId: friend.id,
            friendUsername: friend.username,
          });
        }
      },

      removeFriend: (friendId) => {
        const friend = get().friends.find((f) => f.id === friendId);
        const newFriendCount = get().friends.length - 1;

        set((state) => ({
          friends: state.friends.filter((f) => f.id !== friendId),
          pendingRequests: state.pendingRequests.filter((f) => f.id !== friendId),
        }));

        // Track friend removed
        if (friend) {
          track(AnalyticsEvent.FRIEND_REMOVED, {
            friendId,
            friendUsername: friend.username,
            totalFriends: Math.max(0, newFriendCount),
          });
        }
      },

      updateFriend: (friendId, updates) =>
        set((state) => ({
          friends: state.friends.map((f) =>
            f.id === friendId ? { ...f, ...updates } : f
          ),
        })),

      acceptRequest: (friendId) => {
        const state = get();
        const request = state.pendingRequests.find((f) => f.id === friendId);
        if (!request) return;

        // Check friend limit before accepting
        if (state.friends.length >= MAX_FRIENDS) {
          logger.warn('Cannot accept friend request: friend limit reached', { action: 'acceptRequest', metadata: { friendId, currentCount: state.friends.length, maxFriends: MAX_FRIENDS } });
          set({
            error: `Friend limit reached. You can only have ${MAX_FRIENDS} friends at a time.`,
          });
          return;
        }

        set({
          friends: [...state.friends, { ...request, status: 'accepted' as const }],
          pendingRequests: state.pendingRequests.filter((f) => f.id !== friendId),
          error: null, // Clear any previous error
        });

        // Track friend request accepted
        track(AnalyticsEvent.FRIEND_REQUEST_ACCEPTED, {
          friendId,
          friendUsername: request.username,
          totalFriends: state.friends.length + 1,
        });
      },

      setGroups: (groups) => set({ groups }),

      createGroup: (group) =>
        set((state) => ({
          groups: [...state.groups, group],
        })),

      addToGroup: (groupId, friendId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, members: [...g.members, friendId] }
              : g
          ),
        })),

      removeFromGroup: (groupId, friendId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, members: g.members.filter((m) => m !== friendId) }
              : g
          ),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      getFriendById: (id) => get().friends.find((f) => f.id === id),

      // Friend limit helpers
      canAddMoreFriends: () => get().friends.length < MAX_FRIENDS,
      getFriendCount: () => get().friends.length,
      getRemainingSlots: () => Math.max(0, MAX_FRIENDS - get().friends.length),

      // Block user and remove from friends
      blockUser: (user, reason) => {
        set((state) => {
          const blockedUser: BlockedUser = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            blockedAt: new Date().toISOString(),
            reason,
          };

          return {
            blockedUsers: [...state.blockedUsers, blockedUser],
            friends: state.friends.filter((f) => f.id !== user.id),
            pendingRequests: state.pendingRequests.filter((f) => f.id !== user.id),
            // Also remove from all groups
            groups: state.groups.map((g) => ({
              ...g,
              members: g.members.filter((m) => m !== user.id),
            })),
          };
        });

        // Track user blocked
        track(AnalyticsEvent.USER_BLOCKED, {
          blockedUserId: user.id,
          reason,
        });
      },

      // Unblock user
      unblockUser: (userId) => {
        set((state) => ({
          blockedUsers: state.blockedUsers.filter((u) => u.id !== userId),
        }));

        // Track user unblocked
        track(AnalyticsEvent.USER_UNBLOCKED, {
          unblockedUserId: userId,
        });
      },

      // Check if user is blocked
      isUserBlocked: (userId) =>
        get().blockedUsers.some((u) => u.id === userId),

      // Report a user
      reportUser: (report) => {
        const newReport: Report = {
          ...report,
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          status: 'pending',
        };

        set((state) => ({
          reports: [...state.reports, newReport],
        }));

        // Track user reported
        track(AnalyticsEvent.USER_REPORTED, {
          reportedUserId: report.reportedUserId,
          reason: report.reason,
          hasContentId: !!report.contentId,
        });
      },

      // Get all reports
      getReports: () => get().reports,
    }),
    {
      name: 'loop-friends-storage',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        friends: state.friends,
        groups: state.groups,
        blockedUsers: state.blockedUsers,
        reports: state.reports,
      }),
    }
  )
);
