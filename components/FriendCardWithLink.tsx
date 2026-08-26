/**
 * FriendCardWithLink - Friend Card with Link Preview and Context Menu
 * Wraps friend card content with expo-router Link for iOS peek/pop and context menus
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Share,
  Alert,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Link, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Avatar, PressableFeedback } from 'heroui-native';
import { ChevronRight } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useFriendsStore, Friend } from '@/stores/friendsStore';
import { useTheme } from '@/providers/ThemeProvider';
import { colors as themeColors } from '@/lib/theme';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { resolveMoodSymbol } from '@/lib/iconTokens';
import { logger } from '@/lib/logger';

interface FriendCardWithLinkProps {
  friend: Friend;
  index?: number;
  reducedMotion?: boolean;
}

// Helper function to check if a friend is online (active within 5 minutes)
const isOnline = (friend: Friend): boolean => {
  if (!friend.lastActive) return false;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return new Date(friend.lastActive).getTime() > fiveMinutesAgo;
};

export function FriendCardWithLink({
  friend,
  index = 0,
  reducedMotion = false,
}: FriendCardWithLinkProps) {
  const { colors } = useTheme();
  const removeFriend = useFriendsStore((state) => state.removeFriend);
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

  const handleMessage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to create with pre-selected recipient
    router.push('/create');
  }, []);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Add ${friend.displayName} on Loop! Username: @${friend.username}`,
        title: `Add ${friend.displayName} on Loop`,
      });
    } catch (err) {
      logger.error('Share error', { action: 'handleShare', metadata: { friendId: friend.id } }, err);
    }
  }, [friend]);

  const handleRemove = useCallback(() => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeFriend(friend.id);
          },
        },
      ]
    );
  }, [friend, removeFriend]);

  return (
    <Link href={`/friends/${friend.id}` as any} asChild>
      <Pressable>
        <Link.Trigger>
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(index * 50).springify()}
            style={animatedStyle}
          >
            <PressableFeedback
              onPress={() => router.push(`/friends/${friend.id}` as any)}
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
        </Link.Trigger>
        <Link.Preview />
        <Link.Menu>
          <Link.MenuAction
            title="Send Content"
            icon="message.fill"
            onPress={handleMessage}
          />
          <Link.MenuAction
            title="Share Profile"
            icon="square.and.arrow.up"
            onPress={handleShare}
          />
          <Link.MenuAction
            title="Remove Friend"
            icon="person.badge.minus"
            destructive
            onPress={handleRemove}
          />
        </Link.Menu>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
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
});

export default FriendCardWithLink;
