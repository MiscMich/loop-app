/**
 * Game Screen - Start a Game
 * Migrated to Tailwind + HeroUI with best practices
 *
 * Best Practices Applied:
 * - Lucide icons (consistent icon library)
 * - Optimized Zustand selectors
 * - useReducedMotion for accessibility
 * - Proper accessibility labels on all interactive elements
 * - Ternary conditional rendering (not &&)
 * - FlatList optimizations
 * - Animated components with spring physics
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Gamepad2, Check, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Avatar, PressableFeedback } from 'heroui-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useGameStore, createNewGame , useAuthStore , useFriendsStore } from '@/stores';
import { useTheme } from '@/providers/ThemeProvider';
import { AnimatedButton } from '@/components/ui';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { colors as themeColors } from '@/lib/theme';
import { SkeletonFriendsList, ErrorState, ErrorBanner } from '@/components/states';
import { createScreenLogger, getUserFriendlyMessage, ErrorCodes } from '@/lib/logger';
import type { Friend } from '@/stores/friendsStore';

function FriendItem({
  friend,
  isSelected,
  onSelect,
  index,
  reducedMotion,
}: {
  friend: Friend;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  reducedMotion: boolean;
}) {
  const { colors } = useTheme();
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
      entering={reducedMotion ? undefined : FadeInDown.delay(300 + index * 50).springify()}
      style={animatedStyle}
    >
      <PressableFeedback
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Select ${friend.displayName}`}
        accessibilityHint={`Choose ${friend.displayName} as your opponent`}
        accessibilityState={{ selected: isSelected }}
        style={[
          styles.friendItem,
          {
            backgroundColor: colors.background.secondary,
            borderColor: isSelected ? themeColors.accent.DEFAULT : 'transparent',
            borderWidth: 2,
          },
        ]}
      >
        <Avatar size="md" alt={friend.displayName}>
          {friend.avatarUrl ? (
            <Avatar.Image source={{ uri: friend.avatarUrl }} />
          ) : null}
          <Avatar.Fallback style={{ backgroundColor: themeColors.primary.DEFAULT }}>
            <Text style={[styles.avatarFallback, { color: colors.text.inverse }]}>
              {friend.displayName.charAt(0).toUpperCase()}
            </Text>
          </Avatar.Fallback>
        </Avatar>

        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, { color: colors.text.DEFAULT }]}>
            {friend.displayName}
          </Text>
          <Text style={[styles.friendUsername, { color: colors.text.tertiary }]}>
            @{friend.username}
          </Text>
        </View>

        {isSelected ? (
          <View style={[styles.selectedCheck, { backgroundColor: themeColors.accent.DEFAULT }]}>
            <Check size={18} color={colors.text.inverse} />
          </View>
        ) : null}
      </PressableFeedback>
    </Animated.View>
  );
}

// Screen-specific logger
const log = createScreenLogger('GameScreen');

export default function GameScreen() {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  // ✅ OPTIMIZED: Individual selectors instead of destructuring
  const friends = useFriendsStore((state) => state.friends);
  const isLoading = useFriendsStore((state) => state.isLoading);
  const addGame = useGameStore((state) => state.addGame);
  const user = useAuthStore((state) => state.user);

  // ✅ ACCESSIBILITY: Check for reduced motion preference
  const reducedMotion = useReducedMotion() ?? false;

  // Define all callbacks before any conditional returns
  const handleSelectFriend = useCallback((friend: Friend) => {
    Haptics.selectionAsync();
    setSelectedFriend(friend);
  }, []);

  const handleStartGame = useCallback(() => {
    if (!user || !selectedFriend) return;

    setError(null);
    log.action('start_game', { opponentId: selectedFriend.id, opponentName: selectedFriend.displayName });

    try {
      const newGame = createNewGame(
        user.id,
        user.displayName,
        selectedFriend.id,
        selectedFriend.displayName
      );

      addGame(newGame);

      log.info('Game created successfully', { gameId: newGame.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Game Started!',
        `You've started a game with ${selectedFriend.displayName}. It's your turn!`,
        [
          {
            text: 'Play Now',
            onPress: () => router.replace({ pathname: '/game/[id]', params: { id: newGame.id } } as any),
          },
        ]
      );
    } catch (err) {
      log.error('Failed to start game', err);
      setError(getUserFriendlyMessage(ErrorCodes.UNKNOWN, 'Failed to start game. Please try again.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [user, selectedFriend, addGame]);

  const handleClose = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, []);

  const renderFriend = useCallback(({ item, index }: { item: Friend; index: number }) => (
    <FriendItem
      friend={item}
      isSelected={selectedFriend?.id === item.id}
      onSelect={() => handleSelectFriend(item)}
      index={index}
      reducedMotion={reducedMotion}
    />
  ), [selectedFriend, handleSelectFriend, reducedMotion]);

  const keyExtractor = useCallback((item: Friend) => item.id, []);

  // Show loading skeleton while friends are loading
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}>
        <SkeletonFriendsList count={5} />
      </SafeAreaView>
    );
  }

  // Auth check - must be after all hooks
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}>
        <ErrorState
          type="generic"
          title="Sign In Required"
          message="Please sign in to play games with friends."
          onRetry={() => router.back()}
          retryLabel="Go Back"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.DEFAULT }]}
      edges={['top']}
    >
      {/* Header */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeIn.delay(100)}
        style={styles.header}
      >
        <PressableFeedback
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close game selection"
          accessibilityHint="Go back without starting a game"
          style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
        >
          <X size={22} color={colors.text.DEFAULT} />
        </PressableFeedback>

        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: colors.success.DEFAULT }]}>
            <Gamepad2 size={16} color={colors.text.inverse} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
            Start Game
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Error Banner */}
      {error ? (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
          style={styles.errorBanner}
        />
      ) : null}

      {/* Game Info Card */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(150).springify()}
        style={styles.gameInfoContainer}
      >
        <View
          style={[styles.gameInfoCard, { backgroundColor: colors.background.secondary }]}
          accessibilityRole="text"
          accessibilityLabel="Game: Tic Tac Toe - Challenge a friend to a classic game"
        >
          <View
            style={[
              styles.gameIcon,
              {
                backgroundColor: colors.success.DEFAULT,
                shadowColor: colors.success.DEFAULT,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 8,
              },
            ]}
          >
            <SafeSymbol name="gamecontroller.fill" size={28} tintColor={colors.text.inverse} />
          </View>
          <Text style={[styles.gameTitle, { color: colors.text.DEFAULT }]}>
            Tic Tac Toe
          </Text>
          <Text style={[styles.gameDescription, { color: colors.text.secondary }]}>
            Challenge a friend to a classic game!
          </Text>
        </View>
      </Animated.View>

      {/* Friend Selection */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(200).springify()}
        style={styles.friendsSection}
      >
        <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
          CHOOSE OPPONENT
        </Text>

        {friends.length > 0 ? (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.friendsList}
            contentInsetAdjustmentBehavior="automatic"
            windowSize={5}
            maxToRenderPerBatch={10}
            initialNumToRender={8}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
              <Users size={48} color={colors.text.tertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
              No friends yet
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.text.tertiary }]}>
              Add friends to start playing games
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Start Button */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(250).springify()}
        style={styles.startButtonContainer}
      >
        <AnimatedButton
          title="Start Game"
          icon={Gamepad2}
          variant={selectedFriend ? 'primary' : 'secondary'}
          size="large"
          fullWidth
          disabled={!selectedFriend}
          onPress={handleStartGame}
          style={styles.startButton}
          accessibilityLabel={selectedFriend ? `Start game with ${selectedFriend.displayName}` : 'Select a friend first'}
          accessibilityHint={selectedFriend ? 'Begin the Tic Tac Toe game' : 'Choose an opponent from the list above'}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  gameInfoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  gameInfoCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 23,
  },
  gameIcon: {
    width: 80,
    height: 80,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  friendsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  friendsList: {
    gap: 8,
    paddingBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  avatarFallback: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  startButtonContainer: {
    padding: 16,
  },
  startButton: {
    borderRadius: 23,
  },
});
