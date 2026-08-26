/**
 * FriendSelector - Select recipients for content
 *
 * This is a CRITICAL UX component that answers:
 * "Who will see what I'm creating?"
 *
 * Used in: doodle, photo, mood, voice note flows
 *
 * Features:
 * - Multi-select friends
 * - "Send to All" quick action
 * - Visual feedback on selection
 * - Shows friend avatars and names
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/providers/ThemeProvider';
import { useFriendsStore, Friend } from '@/stores/friendsStore';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/theme';

interface FriendSelectorProps {
  /** Called when user confirms selection */
  onSelect: (friendIds: string[]) => void;
  /** Called when user cancels */
  onCancel?: () => void;
  /** Pre-selected friend IDs */
  initialSelection?: string[];
  /** Allow multiple selection */
  multiSelect?: boolean;
  /** Title shown at top */
  title?: string;
  /** Subtitle/instruction */
  subtitle?: string;
  /** Show loading state */
  isLoading?: boolean;
  /** Content type being sent (for messaging) */
  contentType?: 'doodle' | 'photo' | 'mood' | 'voice' | 'game';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Individual friend selection card
 */
function FriendCard({
  friend,
  isSelected,
  onToggle,
  index,
}: {
  friend: Friend;
  isSelected: boolean;
  onToggle: () => void;
  index: number;
}) {
  const { colors: themeColors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      entering={FadeInDown.delay(50 * index).springify()}
      style={[animatedStyle]}
    >
      <View
        style={[
          styles.friendCard,
          {
            backgroundColor: isSelected
              ? themeColors.primary.DEFAULT + '15'
              : themeColors.surface.DEFAULT,
            borderColor: isSelected
              ? themeColors.primary.DEFAULT
              : 'transparent',
            borderWidth: 2,
            shadowColor: themeColors.text.DEFAULT,
          },
        ]}
      >
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: isSelected
                ? themeColors.primary.DEFAULT
                : themeColors.primary.light,
            },
          ]}
        >
          {friend.avatarUrl ? (
            <Animated.Image
              source={{ uri: friend.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={[styles.avatarText, { color: themeColors.text.inverse }]}>
              {friend.displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          )}
        </View>

        {/* Name */}
        <View style={styles.friendInfo}>
          <Text
            style={[
              styles.friendName,
              { color: themeColors.text.DEFAULT },
            ]}
            numberOfLines={1}
          >
            {friend.displayName}
          </Text>
          <Text
            style={[
              styles.friendUsername,
              { color: themeColors.text.tertiary },
            ]}
            numberOfLines={1}
          >
            @{friend.username}
          </Text>
        </View>

        {/* Selection indicator */}
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: isSelected
                ? themeColors.primary.DEFAULT
                : themeColors.background.secondary,
              borderColor: isSelected
                ? themeColors.primary.DEFAULT
                : themeColors.separator,
            },
          ]}
        >
          {isSelected && (
            <SafeSymbol name="checkmark" size={16} tintColor={themeColors.text.inverse} />
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

/**
 * Main FriendSelector component
 */
export function FriendSelector({
  onSelect,
  onCancel,
  initialSelection = [],
  multiSelect = true,
  title = 'Send to...',
  subtitle = 'Choose who will see this',
  isLoading = false,
  contentType,
}: FriendSelectorProps) {
  const { colors: themeColors } = useTheme();
  const friends = useFriendsStore((s) => s.friends);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelection)
  );

  const toggleFriend = useCallback((friendId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) {
        next.delete(friendId);
      } else {
        if (!multiSelect) {
          next.clear();
        }
        next.add(friendId);
      }
      return next;
    });
  }, [multiSelect]);

  const selectAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIds(new Set(friends.map((f) => f.id)));
  }, [friends]);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(Array.from(selectedIds));
  };

  const getContentTypeSymbol = (): SFSymbol => {
    switch (contentType) {
      case 'doodle': return 'paintpalette.fill';
      case 'photo': return 'photo.fill';
      case 'mood': return 'face.smiling';
      case 'voice': return 'mic.fill';
      case 'game': return 'gamecontroller.fill';
      default: return 'sparkles';
    }
  };

  // Empty state - no friends
  if (friends.length === 0 && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background.DEFAULT }]}>
        <Animated.View
          entering={FadeIn}
          style={styles.emptyState}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: themeColors.primary.light },
            ]}
          >
            <SafeSymbol name="person.2.fill" size={32} tintColor={themeColors.primary.DEFAULT} />
          </View>
          <Text style={[styles.emptyTitle, { color: themeColors.text.DEFAULT }]}>
            No Friends Yet
          </Text>
          <Text style={[styles.emptyMessage, { color: themeColors.text.secondary }]}>
            Add friends first to share your {contentType || 'content'} with them!
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.DEFAULT }]}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.springify()}
        style={styles.header}
      >
        <SafeSymbol
          name={getContentTypeSymbol()}
          size={32}
          tintColor={themeColors.primary.DEFAULT}
          style={{ marginBottom: spacing.sm }}
        />
        <Text style={[styles.title, { color: themeColors.text.DEFAULT }]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
          {subtitle}
        </Text>
      </Animated.View>

      {/* Quick Actions */}
      {multiSelect && friends.length > 1 && (
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.quickActions}
        >
          <Pressable
            onPress={selectAll}
            style={[
              styles.quickAction,
              { backgroundColor: themeColors.background.secondary },
            ]}
          >
            <SafeSymbol
              name="person.2.fill"
              size={18}
              tintColor={themeColors.primary.DEFAULT}
            />
            <Text
              style={[
                styles.quickActionText,
                { color: themeColors.primary.DEFAULT },
              ]}
            >
              Send to All ({friends.length})
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Friend List */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={themeColors.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {friends.map((friend, index) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              isSelected={selectedIds.has(friend.id)}
              onToggle={() => toggleFriend(friend.id)}
              index={index}
            />
          ))}
        </ScrollView>
      )}

      {/* Bottom Actions */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={styles.actions}
      >
        {onCancel && (
          <Pressable
            onPress={onCancel}
            style={[
              styles.cancelButton,
              { borderColor: themeColors.separator },
            ]}
          >
            <Text
              style={[
                styles.cancelText,
                { color: themeColors.text.secondary },
              ]}
            >
              Cancel
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleConfirm}
          disabled={selectedIds.size === 0}
          style={[
            styles.confirmButton,
            {
              opacity: selectedIds.size === 0 ? 0.5 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary.DEFAULT, colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGradient}
          >
            <Text style={[styles.confirmText, { color: themeColors.text.inverse }]}>
              {selectedIds.size === 0
                ? 'Select Friends'
                : `Send to ${selectedIds.size} Friend${selectedIds.size > 1 ? 's' : ''}`}
            </Text>
            <SafeSymbol name="paperplane.fill" size={18} tintColor={themeColors.text.inverse} />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  quickActionText: {
    fontSize: typography.fontSize.subheadline,
    fontWeight: typography.fontWeight.semibold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
  },
  friendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  friendName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: typography.fontSize.caption1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  confirmButton: {
    flex: 2,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  confirmText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * 1.4,
  },
});

export default FriendSelector;
