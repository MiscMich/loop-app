/**
 * ContentCard - Display content from friends
 * Uses HeroUI Card + PressableFeedback + Tailwind
 */

import { SafeSymbol } from '@/components/ui/SafeSymbol';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Card, PressableFeedback, Avatar } from 'heroui-native';
import { SFSymbol } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import {
  quickReactions,
  resolveMoodSymbol,
  resolveReactionSymbol,
  getReactionLabel,
} from '@/lib/iconTokens';
import type {
  Content,
  DoodleContent,
  PhotoContent,
  MoodContent,
  VoiceContent,
  GameContent,
} from '@/stores/contentStore';

interface ContentCardProps {
  content: Content;
  index?: number;
  onPress?: () => void;
  onReact?: (emoji: string) => void;
  onRemoveReaction?: () => void;
  currentUserId?: string;
}

export function ContentCard({
  content,
  onPress,
  onReact,
  onRemoveReaction,
  currentUserId,
}: ContentCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 32;

  const userReaction = currentUserId
    ? content.reactions.find((r) => r.userId === currentUserId)
    : null;

  const timeAgo = useCallback((dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }, []);

  const handleReact = useCallback(
    (symbol: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const userReactionSymbol = resolveReactionSymbol(userReaction?.emoji);
      if (userReactionSymbol === symbol) {
        onRemoveReaction?.();
      } else {
        onReact?.(symbol);
      }
      setShowReactions(false);
    },
    [userReaction, onReact, onRemoveReaction]
  );

  const getContentTypeIcon = (): SFSymbol => {
    switch (content.type) {
      case 'doodle':
        return 'paintbrush';
      case 'photo':
        return 'camera';
      case 'mood':
        return 'face.smiling';
      case 'voice':
        return 'mic';
      case 'game':
        return 'gamecontroller';
      default:
        return 'circle';
    }
  };

  const renderContent = () => {
    switch (content.type) {
      case 'doodle':
        return (
          <Image
            source={{ uri: (content as DoodleContent).imageUrl }}
            className="w-full h-[280px]"
            style={{ backgroundColor: colors.background.secondary }}
            resizeMode="cover"
          />
        );
      case 'photo':
        const photoContent = content as PhotoContent;
        return (
          <View>
            <Image
              source={{ uri: photoContent.imageUrl }}
              className="w-full h-[280px]"
              style={{ backgroundColor: colors.background.secondary }}
              resizeMode="cover"
            />
            {photoContent.caption && (
              <Text className="text-base p-4 pt-3" style={{ color: colors.text.DEFAULT }}>
                {photoContent.caption}
              </Text>
            )}
          </View>
        );
      case 'mood':
        const moodContent = content as MoodContent;
        return (
          <View
            className="flex-1 justify-center items-center p-10"
            style={{ backgroundColor: `${colors.celebration.gold}1A` }}
          >
            <SafeSymbol
              name={resolveMoodSymbol(moodContent.emoji)}
              size={72}
              tintColor={colors.primary.DEFAULT}
              style={{ marginBottom: 12 }}
            />
            {moodContent.note && (
              <Text className="text-base text-center" style={{ color: colors.text.secondary }}>
                {moodContent.note}
              </Text>
            )}
          </View>
        );
      case 'voice':
        const voiceContent = content as VoiceContent;
        return (
          <View
            className="flex-1 justify-center items-center p-8"
            style={{ backgroundColor: colors.background.secondary }}
          >
            <Pressable className="mb-3">
              <SafeSymbol name="play.circle.fill" size={56} tintColor={colors.primary.DEFAULT} />
            </Pressable>
            <Text className="text-sm mb-4" style={{ color: colors.text.tertiary }}>
              {Math.floor(voiceContent.duration)}s
            </Text>
            {voiceContent.waveform && (
              <View className="flex-row items-center gap-0.5 h-10">
                {voiceContent.waveform.slice(0, 30).map((level, i) => (
                  <View
                    key={i}
                    className="w-[3px] bg-primary rounded-sm"
                    style={{ height: Math.max(4, level * 40) }}
                  />
                ))}
              </View>
            )}
          </View>
        );
      case 'game':
        const gameContent = content as GameContent;
        return (
          <View
            className="flex-1 justify-center items-center p-10"
            style={{ backgroundColor: `${colors.success.DEFAULT}14` }}
          >
            <SafeSymbol name="gamecontroller.fill" size={48} tintColor={colors.success.DEFAULT} />
            <Text className="text-xl font-semibold mt-3" style={{ color: colors.text.DEFAULT }}>
              {gameContent.gameType === 'tictactoe' ? 'Tic Tac Toe' : 'Game'}
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.text.tertiary }}>
              Tap to play!
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className="my-2" style={{ width: cardWidth }}>
      <PressableFeedback onPress={onPress}>
        <Card className="overflow-hidden rounded-[20px] shadow-md" style={{ borderCurve: 'continuous' }}>
          <PressableFeedback.Highlight />

          {/* Header */}
          <View className="flex-row items-center p-4 border-b" style={{ borderBottomColor: colors.separator }}>
            <View className="mr-3">
              <Avatar size="md" alt={content.senderName || 'User'}>
                {content.senderAvatar ? (
                  <Avatar.Image source={{ uri: content.senderAvatar }} />
                ) : null}
                <Avatar.Fallback className="bg-primary">
                  {content.senderName?.charAt(0)?.toUpperCase() || '?'}
                </Avatar.Fallback>
              </Avatar>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold" style={{ color: colors.text.DEFAULT }}>
                {content.senderName}
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <SafeSymbol name={getContentTypeIcon()} size={12} tintColor={colors.text.tertiary} />
                <Text className="text-xs" style={{ color: colors.text.tertiary }}>
                  {timeAgo(content.createdAt)}
                </Text>
              </View>
            </View>
            {!content.viewedAt && (
              <View className="w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </View>

          {/* Content */}
          <View className="min-h-[200px]">{renderContent()}</View>

          {/* Footer */}
          <View className="flex-row justify-between items-center p-4 border-t" style={{ borderTopColor: colors.separator }}>
            <View className="flex-row items-center">
              {content.reactions.length > 0 && (
                <>
                  <View className="flex-row mr-1.5">
                    {[...new Set(content.reactions.map((r) => resolveReactionSymbol(r.emoji)))]
                      .slice(0, 3)
                      .map((symbol, i) => (
                        <SafeSymbol
                          key={`${symbol}-${i}`}
                          name={symbol}
                          size={14}
                          tintColor={colors.text.tertiary}
                          style={{ marginRight: -4 }}
                        />
                      ))}
                  </View>
                  <Text className="text-xs" style={{ color: colors.text.tertiary }}>
                    {content.reactions.length}
                  </Text>
                </>
              )}
            </View>

            <Pressable
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: userReaction
                  ? `${colors.primary.DEFAULT}${isDark ? '33' : '1A'}`
                  : colors.background.secondary,
              }}
              onPress={() => setShowReactions(!showReactions)}
              accessibilityLabel={`React with ${getReactionLabel(userReaction?.emoji)}`}
            >
              <SafeSymbol
                name={resolveReactionSymbol(userReaction?.emoji)}
                size={18}
                tintColor={colors.text.DEFAULT}
              />
            </Pressable>
          </View>

          {/* Quick Reactions Popup */}
          {showReactions && (
            <View
              className="absolute bottom-14 right-4 flex-row rounded-3xl p-2 gap-1 shadow-lg"
              style={{ backgroundColor: colors.background.DEFAULT }}
            >
              {quickReactions.map((reaction) => (
                <Pressable
                  key={reaction.symbol}
                  className="w-11 h-11 rounded-full justify-center items-center"
                  style={{
                    backgroundColor:
                      resolveReactionSymbol(userReaction?.emoji) === reaction.symbol
                        ? `${colors.primary.DEFAULT}${isDark ? '33' : '1A'}`
                        : 'transparent',
                  }}
                  onPress={() => handleReact(reaction.symbol)}
                  accessibilityLabel={reaction.label}
                >
                  <SafeSymbol
                    name={reaction.symbol}
                    size={22}
                    tintColor={colors.text.DEFAULT}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </Card>
      </PressableFeedback>
    </View>
  );
}

export default ContentCard;
