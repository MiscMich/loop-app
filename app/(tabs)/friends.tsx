/**
 * Friends Screen - Social Connection
 * Uses HeroUI + Tailwind for styling
 * Implements all 4 UI states: Loading, Error, Empty, Ideal
 *
 * Best Practices Applied:
 * - Lucide icons (consistent icon library)
 * - Optimized Zustand selectors (subscribe to primitives only)
 * - useReducedMotion for accessibility
 * - Proper accessibility labels on all interactive elements
 * - SectionList with performance optimizations
 * - LinearGradient for premium backgrounds
 * - Ternary conditional rendering (not &&)
 */

import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Share,
  Alert,
  SectionList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  X,
  ChevronRight,
  Share2,
  Gift,
  Users,
  Mail,
  UserPlus,
  Check,
} from 'lucide-react-native';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import { Avatar, PressableFeedback } from 'heroui-native';
import Animated, {
  FadeInDown,
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useFriendsStore } from '@/stores/friendsStore';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/providers/ThemeProvider';
import { colors as themeColors, gradients, shadows } from '@/lib/theme';
import { resolveMoodSymbol } from '@/lib/iconTokens';
import type { Friend } from '@/stores/friendsStore';
import { FriendCardWithLink } from '@/components/FriendCardWithLink';

// State components
import { useScreenState } from '@/hooks/useScreenState';
import { SkeletonFriendsList } from '@/components/states/loading';
import { NetworkError } from '@/components/states/error';
import { EmptyFriends } from '@/components/states/empty';

const AnimatedPressable = Animated.createAnimatedComponent(PressableFeedback);

// Helper function to check if a friend is online (active within 5 minutes)
const isOnline = (friend: Friend): boolean => {
  if (!friend.lastActive) return false;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return new Date(friend.lastActive).getTime() > fiveMinutesAgo;
};

// ITEM HEIGHT for getItemLayout optimization
const FRIEND_CARD_HEIGHT = 80;
const SECTION_HEADER_HEIGHT = 44;

// Animated Friend Card Component
function FriendCard({
  friend,
  onPress,
  colors,
  reducedMotion,
  index,
}: {
  friend: Friend;
  onPress: () => void;
  colors: any;
  reducedMotion: boolean;
  index: number;
}) {
  const online = isOnline(friend);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!reducedMotion) {
      scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (!reducedMotion) {
      scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    }
  };

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(index * 50).springify()}
      style={animatedStyle}
    >
      <PressableFeedback
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`View ${friend.displayName}'s profile, username ${friend.username}${online ? ', currently online' : ''}`}
        accessibilityHint="Double tap to view friend details"
        style={[
          styles.friendCard,
          {
            backgroundColor: colors.background.secondary,
            shadowColor: themeColors.text.DEFAULT,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          },
        ]}
      >
        {/* Avatar with online indicator */}
        <View style={styles.avatarContainer}>
          <Avatar size="md" alt={friend.displayName}>
            {friend.avatarUrl ? (
              <Avatar.Image source={{ uri: friend.avatarUrl }} />
            ) : null}
            <Avatar.Fallback style={{ backgroundColor: themeColors.primary.DEFAULT }}>
              <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                {friend.displayName.charAt(0).toUpperCase()}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          {online ? (
            <View
              style={[
                styles.onlineIndicator,
                { borderColor: colors.background.secondary, backgroundColor: colors.success.DEFAULT },
              ]}
              accessibilityLabel="Online"
            />
          ) : null}
        </View>

        {/* Friend info */}
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, { color: colors.text.DEFAULT }]}>
            {friend.displayName}
          </Text>
          <Text style={[styles.friendUsername, { color: colors.text.tertiary }]}>
            @{friend.username}
          </Text>
        </View>

        {/* Mood or status */}
        {friend.currentMood ? (
          <View style={[styles.moodBadge, { backgroundColor: `${colors.primary.DEFAULT}1A` }]}>
            <SafeSymbol
              name={resolveMoodSymbol(friend.currentMood)}
              size={18}
              tintColor={colors.primary.DEFAULT}
            />
          </View>
        ) : null}

        {/* Chevron */}
        <ChevronRight size={20} color={colors.text.tertiary} />
      </PressableFeedback>
    </Animated.View>
  );
}

// Request Card Component
function RequestCard({
  request,
  onAccept,
  onDecline,
  colors,
  reducedMotion,
  index,
}: {
  request: Friend;
  onAccept: () => void;
  onDecline: () => void;
  colors: any;
  reducedMotion: boolean;
  index: number;
}) {
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(index * 80).springify()}
      style={[
        styles.requestCard,
        {
          backgroundColor: colors.background.secondary,
          shadowColor: themeColors.text.DEFAULT,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        },
      ]}
    >
      <View style={styles.requestHeader}>
        <Avatar size="md" alt={request.displayName}>
          {request.avatarUrl ? (
            <Avatar.Image source={{ uri: request.avatarUrl }} />
          ) : null}
          <Avatar.Fallback style={{ backgroundColor: themeColors.accent.DEFAULT }}>
            <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
              {request.displayName.charAt(0).toUpperCase()}
            </Text>
          </Avatar.Fallback>
        </Avatar>

        <View style={styles.requestInfo}>
          <Text style={[styles.friendName, { color: colors.text.DEFAULT }]}>
            {request.displayName}
          </Text>
          <Text style={[styles.friendUsername, { color: colors.text.tertiary }]}>
            @{request.username}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.requestActions}>
        <PressableFeedback
          onPress={onAccept}
          accessibilityRole="button"
          accessibilityLabel={`Accept friend request from ${request.displayName}`}
          style={[
            styles.acceptButton,
            { backgroundColor: themeColors.primary.DEFAULT },
          ]}
        >
          <Check size={18} color={colors.text.inverse} />
          <Text style={[styles.acceptButtonText, { color: colors.text.inverse }]}>Accept</Text>
        </PressableFeedback>

        <PressableFeedback
          onPress={onDecline}
          accessibilityRole="button"
          accessibilityLabel={`Decline friend request from ${request.displayName}`}
          style={[
            styles.declineButton,
            { backgroundColor: colors.background.tertiary },
          ]}
        >
          <Text style={[styles.declineButtonText, { color: colors.text.tertiary }]}>
            Decline
          </Text>
        </PressableFeedback>
      </View>
    </Animated.View>
  );
}

// Search Bar
function SearchBar({
  value,
  onChangeText,
  onClear,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  colors: any;
}) {
  return (
    <View style={styles.searchContainer}>
      <View style={[styles.searchBar, { backgroundColor: colors.background.secondary }]}>
        <Search size={20} color={colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.DEFAULT }]}
          placeholder="Search friends..."
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel="Search friends"
          accessibilityHint="Type to filter your friends list"
        />
        {value.length > 0 ? (
          <PressableFeedback
            onPress={onClear}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <X size={20} color={colors.text.tertiary} />
          </PressableFeedback>
        ) : null}
      </View>
    </View>
  );
}

// Empty State Component
function EmptyStateLocal({
  icon: IconComponent,
  title,
  description,
  actionLabel,
  onAction,
  colors,
}: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  colors: any;
}) {
  return (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: themeColors.accent.DEFAULT,
            shadowColor: themeColors.accent.DEFAULT,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
          },
        ]}
      >
        <IconComponent size={40} color={colors.text.inverse} />
      </View>

      <Text style={[styles.emptyTitle, { color: colors.text.DEFAULT }]}>
        {title}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.text.tertiary }]}>
        {description}
      </Text>

      {actionLabel && onAction ? (
        <PressableFeedback
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={[
            styles.emptyButton,
            {
              backgroundColor: themeColors.primary.DEFAULT,
              shadowColor: themeColors.primary.DEFAULT,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            },
          ]}
        >
          <UserPlus size={18} color={colors.text.inverse} />
          <Text style={[styles.emptyButtonText, { color: colors.text.inverse }]}>{actionLabel}</Text>
        </PressableFeedback>
      ) : null}
    </View>
  );
}

// Add Friend Section
function AddFriendSection({
  inviteCode,
  onShare,
  colors,
  reducedMotion,
}: {
  inviteCode: string;
  onShare: () => void;
  colors: any;
  reducedMotion: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ScrollView
      style={styles.addFriendScroll}
      contentContainerStyle={styles.addFriendContent}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Invite Card */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()}
      >
        <LinearGradient
          colors={[themeColors.primary.DEFAULT, themeColors.primary.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.inviteCard,
            {
              shadowColor: themeColors.primary.DEFAULT,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            },
          ]}
        >
          <View style={styles.inviteHeader}>
            <View style={styles.inviteIconContainer}>
              <Gift size={24} color={colors.text.inverse} />
            </View>
            <View style={styles.inviteHeaderText}>
              <Text style={[styles.inviteTitle, { color: colors.text.inverse }]}>Invite Friends</Text>
              <Text style={styles.inviteSubtitle}>Share your code to connect</Text>
            </View>
          </View>

          {/* Invite Code */}
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCodeLabel}>Your Invite Code</Text>
            <Text
              style={[styles.inviteCodeValue, { color: colors.text.inverse }]}
              accessibilityLabel={`Your invite code is ${inviteCode.split('').join(' ')}`}
            >
              {inviteCode}
            </Text>
          </View>

          <PressableFeedback
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="Share invite link"
            style={styles.shareButton}
          >
            <Share2 size={18} color={colors.text.inverse} />
            <Text style={[styles.shareButtonText, { color: colors.text.inverse }]}>Share Invite Link</Text>
          </PressableFeedback>
        </LinearGradient>
      </Animated.View>

      {/* Search by Username */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(100).springify()}
      >
        <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
          Search by Username
        </Text>

        <View style={[styles.usernameSearch, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.atSymbol, { color: colors.text.tertiary }]}>@</Text>
          <TextInput
            style={[styles.usernameInput, { color: colors.text.DEFAULT }]}
            placeholder="username"
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search by username"
            accessibilityHint="Enter a username to find friends"
          />
          {searchQuery.length > 0 ? (
            <PressableFeedback
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              accessibilityRole="button"
              accessibilityLabel="Search for user"
              style={[styles.searchSubmit, { backgroundColor: themeColors.primary.DEFAULT }]}
            >
              <Text style={[styles.searchSubmitText, { color: colors.text.inverse }]}>Search</Text>
            </PressableFeedback>
          ) : null}
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(200).springify()}
      >
        <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
          Other Options
        </Text>

        <PressableFeedback
          accessibilityRole="button"
          accessibilityLabel="Find friends from contacts"
          accessibilityHint="Connect with friends who use Loop"
          style={[
            styles.contactsButton,
            { backgroundColor: colors.background.secondary },
          ]}
          onPress={() => Haptics.selectionAsync()}
        >
          <View style={[styles.contactsIcon, { backgroundColor: themeColors.accent.DEFAULT + '20' }]}>
            <Users size={20} color={themeColors.accent.DEFAULT} />
          </View>
          <View style={styles.contactsText}>
            <Text style={[styles.contactsTitle, { color: colors.text.DEFAULT }]}>
              Find from Contacts
            </Text>
            <Text style={[styles.contactsSubtitle, { color: colors.text.tertiary }]}>
              Connect with friends who use Loop
            </Text>
          </View>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </PressableFeedback>
      </Animated.View>
    </ScrollView>
  );
}

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<string>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // ✅ OPTIMIZED: Individual selectors instead of destructuring
  const friends = useFriendsStore((state) => state.friends);
  const pendingRequests = useFriendsStore((state) => state.pendingRequests);
  const acceptRequest = useFriendsStore((state) => state.acceptRequest);
  const removeFriend = useFriendsStore((state) => state.removeFriend);
  const user = useAuthStore((state) => state.user);
  const { colors } = useTheme();

  // ✅ ACCESSIBILITY: Check for reduced motion preference
  const reducedMotion = useReducedMotion() ?? false;

  // Unified screen state management
  const { state } = useScreenState(friends, isLoading, error);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Configure native search bar in header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLargeTitle: true,
      title: 'Friends',
      headerSearchBarOptions: {
        placeholder: 'Search friends...',
        hideWhenScrolling: true,
        onChangeText: (event: { nativeEvent: { text: string } }) => {
          setSearchQuery(event.nativeEvent.text);
        },
      },
    });
  }, [navigation]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 600);
  }, []);

  // Filter friends by search query - using toSorted for immutability
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(
      (friend) =>
        friend.displayName.toLowerCase().includes(query) ||
        friend.username.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  // Group friends by online status - using toSorted
  const groupedFriends = useMemo(() => {
    const online = filteredFriends.filter((f) => isOnline(f));
    const offline = filteredFriends.filter((f) => !isOnline(f));

    const sections: { title: string; data: Friend[] }[] = [];
    if (online.length > 0) {
      sections.push({
        title: 'Online Now',
        data: online.slice().sort((a, b) => a.displayName.localeCompare(b.displayName)),
      });
    }
    if (offline.length > 0) {
      sections.push({
        title: 'All Friends',
        data: offline.slice().sort((a, b) => a.displayName.localeCompare(b.displayName)),
      });
    }
    return sections;
  }, [filteredFriends]);

  const handleShareLink = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const inviteCode = user?.id?.slice(0, 8) || 'LOOP123';
      await Share.share({
        message: `Join me on Loop! Add me with code: ${inviteCode}.`,
        title: 'Join me on Loop!',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }, [user]);

  const handleAcceptRequest = useCallback(
    (requestId: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      acceptRequest(requestId);
    },
    [acceptRequest]
  );

  const handleDeclineRequest = useCallback(
    (requestId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      removeFriend(requestId);
    },
    [removeFriend]
  );

  const handleRemoveFriend = useCallback(
    (friendId: string, friendName: string) => {
      Alert.alert(
        'Remove Friend',
        `Are you sure you want to remove ${friendName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              removeFriend(friendId);
            },
          },
        ]
      );
    },
    [removeFriend]
  );

  // ✅ PERFORMANCE: getItemLayout for SectionList optimization
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: FRIEND_CARD_HEIGHT,
      offset: FRIEND_CARD_HEIGHT * index,
      index,
    }),
    []
  );

  const renderFriendItem = useCallback(
    ({ item, index }: { item: Friend; index: number }) => (
      <FriendCardWithLink
        friend={item}
        index={index}
        reducedMotion={reducedMotion}
      />
    ),
    [reducedMotion]
  );

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View
        style={[styles.sectionHeader, { backgroundColor: colors.background.DEFAULT }]}
        accessibilityRole="header"
      >
        <Text style={[styles.sectionHeaderText, { color: colors.text.tertiary }]}>
          {title}
        </Text>
        <View style={[styles.sectionLine, { backgroundColor: colors.separator }]} />
      </View>
    ),
    [colors]
  );

  const keyExtractor = useCallback((item: Friend) => item.id, []);

  const inviteCode = user?.id?.slice(0, 8) || 'LOOP123';

  return (
    <LinearGradient
      colors={gradients.sunrise}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text
                style={[styles.headerLabel, { color: themeColors.primary.DEFAULT }]}
                accessibilityRole="header"
              >
                Your Circle
              </Text>
              <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
                Friends
              </Text>
            </View>

            {/* Share Button */}
            <PressableFeedback
              onPress={handleShareLink}
              accessibilityRole="button"
              accessibilityLabel="Share invite link"
              style={[
                styles.shareIconButton,
                {
                  backgroundColor: `${colors.primary.DEFAULT}1A`,
                  shadowColor: themeColors.primary.DEFAULT,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 3,
                },
              ]}
            >
              <Share2 size={22} color={themeColors.primary.DEFAULT} />
            </PressableFeedback>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['friends', 'requests', 'add'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const count =
                tab === 'friends'
                  ? friends.length
                  : tab === 'requests'
                  ? pendingRequests.length
                  : undefined;
              const label = tab === 'friends' ? 'Friends' : tab === 'requests' ? 'Requests' : 'Add';

              return (
                <PressableFeedback
                  key={tab}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab(tab);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${label} tab${count !== undefined ? `, ${count} items` : ''}`}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: isActive
                        ? themeColors.primary.DEFAULT
                        : colors.background.secondary,
                      shadowColor: isActive ? themeColors.primary.DEFAULT : 'transparent',
                      shadowOffset: { width: 0, height: isActive ? 4 : 0 },
                      shadowOpacity: isActive ? 0.3 : 0,
                      shadowRadius: isActive ? 8 : 0,
                      elevation: isActive ? 4 : 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: isActive ? colors.text.inverse : colors.text.secondary },
                    ]}
                  >
                    {label}
                  </Text>
                  {count !== undefined && count > 0 ? (
                    <View
                      style={[
                        styles.tabBadge,
                        {
                          backgroundColor: isActive
                            ? 'rgba(255,255,255,0.3)'
                            : themeColors.primary.DEFAULT,
                        },
                      ]}
                    >
                      <Text style={[styles.tabBadgeText, { color: colors.text.inverse }]}>{count}</Text>
                    </View>
                  ) : null}
                </PressableFeedback>
              );
            })}
          </View>
        </Animated.View>

        {/* Tab Content */}
        {activeTab === 'friends' ? (
          <>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery('')}
              colors={colors}
            />

            {state === 'loading' ? (
              <View style={styles.loadingContainer}>
                <SkeletonFriendsList count={5} />
              </View>
            ) : state === 'error' ? (
              <View style={styles.errorContainer}>
                <NetworkError onRetry={handleRetry} />
              </View>
            ) : friends.length > 0 ? (
              <SectionList
                sections={groupedFriends}
                renderItem={renderFriendItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                // ✅ PERFORMANCE: SectionList optimizations
                windowSize={5}
                maxToRenderPerBatch={10}
                removeClippedSubviews={true}
                initialNumToRender={8}
                getItemLayout={getItemLayout}
              />
            ) : (
              <EmptyFriends onAction={() => setActiveTab('add')} />
            )}
          </>
        ) : null}

        {activeTab === 'requests' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.requestsContent}
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="automatic"
          >
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request, index) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  colors={colors}
                  reducedMotion={reducedMotion}
                  index={index}
                  onAccept={() => handleAcceptRequest(request.id)}
                  onDecline={() => handleDeclineRequest(request.id)}
                />
              ))
            ) : (
              <EmptyStateLocal
                icon={Mail}
                title="No pending requests"
                description="When someone adds you, their request will appear here."
                colors={colors}
              />
            )}
          </ScrollView>
        ) : null}

        {activeTab === 'add' ? (
          <AddFriendSection
            inviteCode={inviteCode}
            onShare={handleShareLink}
            colors={colors}
            reducedMotion={reducedMotion}
          />
        ) : null}

        {/* Floating Action Button - Add Friend */}
        <PressableFeedback
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setActiveTab('add');
          }}
          style={[styles.fab, { bottom: 90 + insets.bottom }]}
          accessibilityLabel="Add friend"
          accessibilityHint="Tap to add a new friend"
        >
          <LinearGradient
            colors={[themeColors.primary.DEFAULT, themeColors.primary.dark]}
            style={styles.fabGradient}
          >
            <SafeSymbol name="person.badge.plus" size={24} tintColor={colors.text.inverse} />
          </LinearGradient>
        </PressableFeedback>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  shareIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLine: {
    height: 1,
    flex: 1,
    marginLeft: 12,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
  },
  moodBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  moodEmoji: {
    fontSize: 20,
  },
  requestCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  declineButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  requestsContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addFriendScroll: {
    flex: 1,
  },
  addFriendContent: {
    padding: 20,
    paddingBottom: 100,
  },
  inviteCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  inviteHeaderText: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  inviteSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  inviteCodeBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inviteCodeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  inviteCodeValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    borderRadius: 16,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  usernameSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  atSymbol: {
    fontSize: 16,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    fontSize: 16,
  },
  searchSubmit: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchSubmitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  contactsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactsText: {
    flex: 1,
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactsSubtitle: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: themeColors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
