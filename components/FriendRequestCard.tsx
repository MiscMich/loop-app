/**
 * FriendRequestCard - Friend request display with accept/decline
 * Migrated to Uniwind styling
 */

import React from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { useTheme } from '@/providers/ThemeProvider';
import { useFriendsStore, type Friend } from '@/stores/friendsStore';

export interface FriendRequestCardProps {
  friendRequest: Friend;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export function FriendRequestCard({
  friendRequest,
  onAccept,
  onDecline,
  isLoading = false,
}: FriendRequestCardProps) {
  const { colors } = useTheme();
  const canAddMoreFriends = useFriendsStore((s) => s.canAddMoreFriends());

  const getTimeAgoText = () => {
    if (!friendRequest.addedAt) return 'Recently';

    const now = new Date();
    const addedAt = new Date(friendRequest.addedAt);
    const diffMinutes = Math.floor((now.getTime() - addedAt.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <View
      className="flex-row items-center rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: colors.background.DEFAULT,
        shadowColor: colors.text.DEFAULT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Avatar */}
      <View className="mr-3">
        {friendRequest.avatarUrl ? (
          <Image
            source={{ uri: friendRequest.avatarUrl }}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-primary justify-center items-center">
            <Text className="text-xl text-white font-semibold">
              {friendRequest.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text
          className="text-base font-semibold mb-0.5"
          style={{ color: colors.text.DEFAULT }}
        >
          {friendRequest.displayName}
        </Text>
        <Text
          className="text-sm mb-0.5"
          style={{ color: colors.text.secondary }}
        >
          @{friendRequest.username}
        </Text>
        <Text
          className="text-xs"
          style={{ color: colors.text.tertiary }}
        >
          {getTimeAgoText()}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row items-center gap-2">
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
        ) : (
          <>
            <Pressable
              className="w-10 h-10 rounded-full justify-center items-center"
              style={{ backgroundColor: colors.background.secondary }}
              onPress={onDecline}
            >
              <SafeSymbol name="xmark" size={20} tintColor={colors.text.tertiary} />
            </Pressable>
            <Pressable
              className="w-10 h-10 rounded-full justify-center items-center"
              style={{
                backgroundColor: canAddMoreFriends
                  ? colors.accent.DEFAULT
                  : colors.text.tertiary,
                opacity: canAddMoreFriends ? 1 : 0.5,
              }}
              onPress={onAccept}
              disabled={!canAddMoreFriends}
            >
              <SafeSymbol
                name={canAddMoreFriends ? "checkmark" : "lock.fill"}
                size={20}
                tintColor={colors.text.inverse}
              />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

export default FriendRequestCard;
