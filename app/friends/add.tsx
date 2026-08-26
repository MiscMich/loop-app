/**
 * Add Friend Screen
 * Tab-based interface for:
 * - Username search
 * - Contact sync with SMS invites
 *
 * Warm Sunrise Design System
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/providers/ThemeProvider';
import { useFriendsStore, type Friend, MAX_FRIENDS } from '@/stores/friendsStore';
import { useAuthStore } from '@/stores/authStore';
import { useContacts } from '@/hooks/useContacts';
import { EmptyState } from '@/components/states/empty';
import { ContactList } from '@/components/ContactList';
import { sendInvite } from '@/lib/smsInvite';
import { colors, typography, spacing, borderRadius, shadows, animation } from '@/lib/theme';
import type { NormalizedContact } from '@/lib/contacts';

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

type TabType = 'search' | 'contacts';

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface SearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

// =============================================================================
// TAB SELECTOR
// =============================================================================

interface TabSelectorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

function TabSelector({ activeTab, onTabChange }: TabSelectorProps) {
  const { colors: themeColors } = useTheme();
  const indicatorPosition = useSharedValue(activeTab === 'search' ? 0 : 1);

  const handleTabPress = (tab: TabType) => {
    Haptics.selectionAsync();
    indicatorPosition.value = withSpring(tab === 'search' ? 0 : 1, animation.springs.snappy);
    onTabChange(tab);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value * 100 }],
  }));

  return (
    <View style={styles.tabContainer}>
      <View
        style={[
          styles.tabBackground,
          { backgroundColor: themeColors.background.secondary },
        ]}
      >
        <Animated.View
          style={[
            styles.tabIndicator,
            { backgroundColor: themeColors.surface?.DEFAULT ?? colors.surface.DEFAULT },
            indicatorStyle,
          ]}
        />
        <Pressable
          style={styles.tab}
          onPress={() => handleTabPress('search')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'search' }}
        >
          <SafeSymbol
            name="magnifyingglass"
            size={18}
            tintColor={
              activeTab === 'search'
                ? themeColors.primary.DEFAULT
                : themeColors.text.tertiary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'search'
                    ? themeColors.primary.DEFAULT
                    : themeColors.text.tertiary,
              },
            ]}
          >
            Search
          </Text>
        </Pressable>
        <Pressable
          style={styles.tab}
          onPress={() => handleTabPress('contacts')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'contacts' }}
        >
          <SafeSymbol
            name="person.2.fill"
            size={18}
            tintColor={
              activeTab === 'contacts'
                ? themeColors.primary.DEFAULT
                : themeColors.text.tertiary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'contacts'
                    ? themeColors.primary.DEFAULT
                    : themeColors.text.tertiary,
              },
            ]}
          >
            Contacts
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AddFriendScreen() {
  const { colors: themeColors } = useTheme();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('search');

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  // Contacts state
  const [invitedContacts, setInvitedContacts] = useState<Set<string>>(new Set());

  // Store access
  const addFriend = useFriendsStore((s) => s.addFriend);
  const canAddMoreFriends = useFriendsStore((s) => s.canAddMoreFriends());
  const friendCount = useFriendsStore((s) => s.getFriendCount());
  const user = useAuthStore((s) => s.user);

  // Contacts hook
  const {
    contacts,
    filteredContacts,
    permissionStatus,
    isLoading: contactsLoading,
    error: contactsError,
    searchQuery: contactSearchQuery,
    setSearchQuery: setContactSearchQuery,
    requestPermission,
    registeredContacts,
    invitableContacts,
  } = useContacts();

  // Pending friend request IDs
  const pendingRequestIds = useMemo(() => {
    const pending = useFriendsStore.getState().pendingRequests;
    return new Set(pending.map((f) => f.id));
  }, []);

  // ==========================================================================
  // USERNAME SEARCH
  // ==========================================================================

  const searchUsersRef = useRef(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('loop_users')
      //   .select('id, username, display_name, avatar_url')
      //   .ilike('username', `%${searchQuery}%`)
      //   .limit(20);
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (searchQuery.length >= 2) {
        setResults([
          {
            id: `user_${searchQuery}`,
            username: searchQuery.toLowerCase(),
            displayName: `${searchQuery.charAt(0).toUpperCase()}${searchQuery.slice(1)}`,
            avatarUrl: undefined,
          },
        ]);
      } else {
        setResults([]);
      }
      setIsSearching(false);
    }, 300)
  );

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    searchUsersRef.current(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsSearching(false);
  }, []);

  const handleSendRequest = useCallback(
    async (searchResult: SearchResult) => {
      if (!canAddMoreFriends) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const friendRequest: Friend = {
        id: searchResult.id,
        username: searchResult.username,
        displayName: searchResult.displayName,
        avatarUrl: searchResult.avatarUrl,
        status: 'pending',
        addedAt: new Date().toISOString(),
      };

      addFriend(friendRequest);
      setSentRequests((prev) => new Set([...prev, searchResult.id]));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [addFriend, canAddMoreFriends]
  );

  // ==========================================================================
  // CONTACT HANDLERS
  // ==========================================================================

  const handleAddFriendFromContact = useCallback(
    async (contact: NormalizedContact) => {
      if (!canAddMoreFriends) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      if (!contact.registeredUserId || !contact.registeredUsername) {
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const friendRequest: Friend = {
        id: contact.registeredUserId,
        username: contact.registeredUsername,
        displayName: contact.name,
        status: 'pending',
        addedAt: new Date().toISOString(),
      };

      addFriend(friendRequest);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [addFriend, canAddMoreFriends]
  );

  const handleInviteContact = useCallback(
    async (contact: NormalizedContact) => {
      const phoneNumber = contact.phoneNumbers[0];
      if (!phoneNumber) return;

      const inviterName = user?.displayName || user?.username || 'A friend';

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await sendInvite({
        phoneNumber,
        inviterName,
        inviterId: user?.id,
      });

      if (result.success) {
        setInvitedContacts((prev) => new Set([...prev, contact.id]));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [user]
  );

  // ==========================================================================
  // RENDER USERNAME SEARCH
  // ==========================================================================

  const renderUserCard = useCallback(
    ({ item, index }: { item: SearchResult; index: number }) => {
      const isSent = sentRequests.has(item.id);

      return (
        <Animated.View
          entering={FadeInDown.delay(index * 100).springify()}
          style={[
            styles.userCard,
            { backgroundColor: themeColors.surface?.DEFAULT ?? colors.surface.DEFAULT },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: themeColors.primary.light },
            ]}
          >
            <Text style={[styles.avatarText, { color: themeColors.text.inverse }]}>
              {item.displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text
              style={[styles.displayName, { color: themeColors.text.DEFAULT }]}
            >
              {item.displayName}
            </Text>
            <Text
              style={[styles.username, { color: themeColors.text.secondary }]}
            >
              @{item.username}
            </Text>
          </View>
          {isSent ? (
            <View style={styles.sentBadge}>
              <SafeSymbol
                name="checkmark"
                size={16}
                tintColor={themeColors.success?.DEFAULT ?? colors.success.DEFAULT}
              />
              <Text
                style={[
                  styles.sentText,
                  { color: themeColors.success?.DEFAULT ?? colors.success.DEFAULT },
                ]}
              >
                Sent
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => handleSendRequest(item)}
              disabled={!canAddMoreFriends}
              style={[
                styles.addButton,
                {
                  backgroundColor: canAddMoreFriends
                    ? themeColors.primary.DEFAULT
                    : themeColors.text.tertiary,
                },
              ]}
              accessibilityLabel={
                canAddMoreFriends
                  ? `Send friend request to ${item.displayName}`
                  : 'Friend limit reached'
              }
              accessibilityRole="button"
            >
              <SafeSymbol
                name={canAddMoreFriends ? 'person.badge.plus' : 'lock.fill'}
                size={18}
                tintColor={themeColors.text.inverse}
              />
            </Pressable>
          )}
        </Animated.View>
      );
    },
    [themeColors, sentRequests, handleSendRequest, canAddMoreFriends]
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themeColors.background.DEFAULT },
      ]}
      edges={['top']}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <SafeSymbol
            name="chevron.left"
            size={24}
            tintColor={themeColors.text.DEFAULT}
          />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: themeColors.text.DEFAULT }]}>
            Add Friend
          </Text>
          <Text
            style={[styles.friendCount, { color: themeColors.text.tertiary }]}
          >
            {friendCount}/{MAX_FRIENDS} friends
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Selector */}
      <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Friend Limit Warning */}
      {!canAddMoreFriends && (
        <View
          style={[
            styles.limitBanner,
            {
              backgroundColor:
                themeColors.accent.light || themeColors.background.secondary,
            },
          ]}
        >
          <SafeSymbol
            name="info.circle.fill"
            size={20}
            tintColor={themeColors.accent.DEFAULT}
          />
          <Text style={[styles.limitText, { color: themeColors.text.DEFAULT }]}>
            You've reached your friend limit ({MAX_FRIENDS}). Loop keeps groups
            intimate!
          </Text>
        </View>
      )}

      {/* Content based on active tab */}
      {activeTab === 'search' ? (
        <>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchInput,
                { backgroundColor: themeColors.background.secondary },
              ]}
            >
              <SafeSymbol
                name="magnifyingglass"
                size={20}
                tintColor={themeColors.text.tertiary}
              />
              <TextInput
                value={query}
                onChangeText={handleSearch}
                placeholder="Search by username..."
                placeholderTextColor={themeColors.text.tertiary}
                style={[styles.input, { color: themeColors.text.DEFAULT }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search for friends by username"
              />
              {query.length > 0 && (
                <Pressable
                  onPress={handleClearSearch}
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                >
                  <SafeSymbol
                    name="xmark.circle.fill"
                    size={20}
                    tintColor={themeColors.text.tertiary}
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* Search Results */}
          {isSearching ? (
            <View style={styles.loading}>
              <ActivityIndicator
                size="large"
                color={themeColors.primary.DEFAULT}
              />
              <Text
                style={[
                  styles.loadingText,
                  { color: themeColors.text.tertiary },
                ]}
              >
                Searching...
              </Text>
            </View>
          ) : results.length === 0 && query.length > 0 ? (
            <EmptyState
              type="search"
              title="No users found"
              message={`No one with username "${query}" found`}
            />
          ) : results.length === 0 ? (
            <View style={styles.hintContainer}>
              <View
                style={[
                  styles.hintIcon,
                  { backgroundColor: themeColors.background.secondary },
                ]}
              >
                <SafeSymbol
                  name="person.badge.plus"
                  size={32}
                  tintColor={themeColors.text.tertiary}
                />
              </View>
              <Text
                style={[styles.hintTitle, { color: themeColors.text.DEFAULT }]}
              >
                Find your friends
              </Text>
              <Text
                style={[
                  styles.hintMessage,
                  { color: themeColors.text.tertiary },
                ]}
              >
                Search by username to send them a friend request
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={renderUserCard}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="automatic"
            />
          )}
        </>
      ) : (
        <>
          {/* Contact Search (only when permission granted) */}
          {permissionStatus === 'granted' && (
            <View style={styles.searchContainer}>
              <View
                style={[
                  styles.searchInput,
                  { backgroundColor: themeColors.background.secondary },
                ]}
              >
                <SafeSymbol
                  name="magnifyingglass"
                  size={20}
                  tintColor={themeColors.text.tertiary}
                />
                <TextInput
                  value={contactSearchQuery}
                  onChangeText={setContactSearchQuery}
                  placeholder="Search contacts..."
                  placeholderTextColor={themeColors.text.tertiary}
                  style={[styles.input, { color: themeColors.text.DEFAULT }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Search contacts"
                />
                {contactSearchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setContactSearchQuery('')}
                    accessibilityLabel="Clear search"
                    accessibilityRole="button"
                  >
                    <SafeSymbol
                      name="xmark.circle.fill"
                      size={20}
                      tintColor={themeColors.text.tertiary}
                    />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Registered contacts info banner */}
          {permissionStatus === 'granted' && registeredContacts.length > 0 && (
            <View
              style={[
                styles.infoBanner,
                { backgroundColor: themeColors.success?.light ?? colors.success.light },
              ]}
            >
              <SafeSymbol
                name="checkmark.circle.fill"
                size={18}
                tintColor={themeColors.success?.DEFAULT ?? colors.success.DEFAULT}
              />
              <Text
                style={[
                  styles.infoText,
                  { color: themeColors.success?.dark ?? colors.success.dark },
                ]}
              >
                {registeredContacts.length} contact
                {registeredContacts.length !== 1 ? 's' : ''} already on Loop
              </Text>
            </View>
          )}

          {/* Contact List */}
          <ContactList
            contacts={contactSearchQuery ? filteredContacts : contacts}
            permissionStatus={permissionStatus}
            isLoading={contactsLoading}
            error={contactsError}
            onRequestPermission={requestPermission}
            onAddFriend={handleAddFriendFromContact}
            onInvite={handleInviteContact}
            invitedIds={invitedContacts}
            pendingIds={pendingRequestIds}
            friendLimitReached={!canAddMoreFriends}
          />
        </>
      )}
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: {
    width: 24,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.semibold,
  },
  friendCount: {
    fontSize: typography.fontSize.caption1,
    marginTop: 2,
  },
  // Tab selector
  tabContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tabBackground: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    width: '50%',
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    zIndex: 1,
  },
  tabText: {
    fontSize: typography.fontSize.subheadline,
    fontWeight: typography.fontWeight.semibold,
  },
  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
  },
  // Banners
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  limitText: {
    flex: 1,
    fontSize: typography.fontSize.subheadline,
    lineHeight: typography.fontSize.subheadline * typography.lineHeight.normal,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.subheadline,
    fontWeight: typography.fontWeight.medium,
  },
  // Loading
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.subheadline,
  },
  // User card (search results)
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  displayName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  username: {
    fontSize: typography.fontSize.subheadline,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sentText: {
    fontSize: typography.fontSize.subheadline,
    fontWeight: typography.fontWeight.medium,
  },
  // Hint state
  hintContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  hintIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  hintTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  hintMessage: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
});
