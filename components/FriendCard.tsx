/**
 * FriendCard - Display friend information
 * Uses HeroUI Card + Avatar + PressableFeedback + Tailwind
 */

import { SafeSymbol } from '@/components/ui/SafeSymbol';
import React from 'react';
import { View, Text } from 'react-native';
import { Card, PressableFeedback, Avatar } from 'heroui-native';
import * as Haptics from 'expo-haptics';
import type { Friend } from '@/stores/friendsStore';
import { useTheme } from '@/providers/ThemeProvider';
import { resolveMoodSymbol } from '@/lib/iconTokens';

interface FriendCardProps {
  friend: Friend;
  onPress?: () => void;
  onSendContent?: () => void;
  showActions?: boolean;
}

export function FriendCard({
  friend,
  onPress,
  onSendContent,
  showActions = true,
}: FriendCardProps) {
  const { colors } = useTheme();
  const getLastActiveText = () => {
    if (!friend.lastActive) return 'New friend';

    const now = new Date();
    const lastActive = new Date(friend.lastActive);
    const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / 60000);

    if (diffMinutes < 1) return 'Active now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const isOnline = friend.lastActive &&
    new Date().getTime() - new Date(friend.lastActive).getTime() < 5 * 60 * 1000;

  const handleSendContent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSendContent?.();
  };

  return (
    <PressableFeedback onPress={onPress}>
      <Card className="my-1 rounded-2xl shadow-sm" style={{ backgroundColor: colors.surface.DEFAULT }}>
        <PressableFeedback.Highlight />
        <Card.Body className="flex-row items-center p-4">
          {/* Avatar */}
          <View className="relative">
            <Avatar size="lg" alt={friend.displayName || 'Friend'}>
              {friend.avatarUrl ? (
                <Avatar.Image source={{ uri: friend.avatarUrl }} />
              ) : null}
              <Avatar.Fallback className="bg-primary">
                {friend.displayName?.charAt(0)?.toUpperCase() || '?'}
              </Avatar.Fallback>
            </Avatar>
            {isOnline && (
              <View
                className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2"
                style={{ backgroundColor: colors.success.DEFAULT, borderColor: colors.background.pure }}
              />
            )}
            {friend.currentMood && (
              <View
                className="absolute -top-1 -right-1 rounded-xl p-0.5 shadow-sm"
                style={{ backgroundColor: colors.surface.DEFAULT }}
              >
                <SafeSymbol
                  name={resolveMoodSymbol(friend.currentMood)}
                  size={16}
                  tintColor={colors.primary.DEFAULT}
                />
              </View>
            )}
          </View>

          {/* Info */}
          <View className="flex-1 ml-3.5">
            <Text className="text-base font-semibold" style={{ color: colors.text.DEFAULT }}>
              {friend.displayName}
            </Text>
            <Text className="text-sm mt-0.5" style={{ color: colors.text.secondary }}>
              @{friend.username}
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
              {getLastActiveText()}
            </Text>
          </View>

          {/* Actions */}
          {showActions && (
            <View className="flex-row gap-2">
              <PressableFeedback onPress={handleSendContent}>
                <View
                  className="w-11 h-11 rounded-full justify-center items-center"
                  style={{ backgroundColor: `${colors.error}15` }}
                >
                  <PressableFeedback.Highlight className="rounded-full" />
                  <SafeSymbol name="paperplane.fill" size={20} tintColor={colors.error} />
                </View>
              </PressableFeedback>
            </View>
          )}
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}

interface FriendRequestCardProps {
  friend: Friend;
  onAccept: () => void;
  onDecline: () => void;
}

export function FriendRequestCard({
  friend,
  onAccept,
  onDecline,
}: FriendRequestCardProps) {
  const { colors } = useTheme();
  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAccept();
  };

  const handleDecline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDecline();
  };

  return (
    <Card
      className="my-1 rounded-2xl border"
      style={{
        backgroundColor: `${colors.warning}12`,
        borderColor: `${colors.warning}60`,
      }}
    >
      <Card.Body className="flex-row items-center p-4">
        {/* Avatar */}
        <View className="relative">
          <Avatar size="lg" alt={friend.displayName || 'Friend'}>
            {friend.avatarUrl ? (
              <Avatar.Image source={{ uri: friend.avatarUrl }} />
            ) : null}
            <Avatar.Fallback className="bg-primary">
              {friend.displayName?.charAt(0)?.toUpperCase() || '?'}
            </Avatar.Fallback>
          </Avatar>
        </View>

        {/* Info */}
        <View className="flex-1 ml-3.5">
          <Text className="text-base font-semibold" style={{ color: colors.text.DEFAULT }}>
            {friend.displayName}
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: colors.text.secondary }}>
            @{friend.username}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.warning }}>
            Wants to be friends
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row gap-2">
          <PressableFeedback onPress={handleDecline}>
            <View
              className="w-10 h-10 rounded-full justify-center items-center"
              style={{ backgroundColor: colors.background.secondary }}
            >
              <PressableFeedback.Highlight className="rounded-full" />
              <SafeSymbol name="xmark" size={20} tintColor={colors.text.tertiary} />
            </View>
          </PressableFeedback>
          <PressableFeedback onPress={handleAccept}>
            <View
              className="w-10 h-10 rounded-full justify-center items-center"
              style={{ backgroundColor: colors.success.DEFAULT }}
            >
              <PressableFeedback.Highlight className="rounded-full" />
              <SafeSymbol name="checkmark" size={20} tintColor={colors.text.inverse} />
            </View>
          </PressableFeedback>
        </View>
      </Card.Body>
    </Card>
  );
}

export default FriendCard;
