/**
 * Content Detail Screen
 * Shows full content with reactions and actions
 * Supports Link.Preview for iOS peek and pop
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Share,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Avatar } from 'heroui-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  Trash2,
  Clock,
  Eye,
  Brush,
  Camera,
  Smile,
  Mic,
  Gamepad2,
} from 'lucide-react-native';

import { useContentStore, Content, ContentReaction } from '@/stores/contentStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/providers/ThemeProvider';
import { colors as themeColors } from '@/lib/theme';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import {
  quickReactions,
  resolveMoodSymbol,
  resolveReactionSymbol,
} from '@/lib/iconTokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reducedMotion = useReducedMotion();
  const { colors } = useTheme();

  // Get content from store
  const getContentById = useContentStore((state) => state.getContentById);
  const addReaction = useContentStore((state) => state.addReaction);
  const removeFromFeed = useContentStore((state) => state.removeFromFeed);
  const markAsViewed = useContentStore((state) => state.markAsViewed);
  const user = useAuthStore((state) => state.user);

  const content = useMemo(() => getContentById(id || ''), [id, getContentById]);

  // Mark as viewed on mount
  React.useEffect(() => {
    if (content && !content.viewedAt) {
      markAsViewed(content.id);
    }
  }, [content?.id]);

  const userReaction = useMemo(() => {
    if (!content || !user) return null;
    return content.reactions.find((r) => r.userId === user.id);
  }, [content, user]);

  const timeAgo = useCallback((dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }, []);

  const handleReaction = useCallback(
    async (symbol: string) => {
      if (!content || !user) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const reaction: ContentReaction = {
        userId: user.id,
        emoji: symbol,
        createdAt: new Date().toISOString(),
      };

      // Update local state immediately (optimistic update)
      addReaction(content.id, reaction);

      // Persist to Supabase
      try {
        const { error } = await (supabase
          .from('loop_content_reactions') as any)
          .upsert({
            content_id: content.id,
            user_id: user.id,
            emoji: symbol,
            created_at: new Date().toISOString()
          }, { onConflict: 'content_id,user_id' });

        if (error) {
          if (__DEV__) console.error('Failed to save reaction:', error);
          // Optionally: remove the local reaction on failure
        }
      } catch (err) {
        if (__DEV__) console.error('Error saving reaction:', err);
      }
    },
    [content, user, addReaction]
  );

  const handleShare = useCallback(async () => {
    if (!content) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Check out this ${content.type} from ${content.senderName} on Loop!`,
        title: `${content.senderName}'s ${content.type}`,
      });
    } catch (err) {
      if (__DEV__) console.error('Share error:', err);
    }
  }, [content]);

  const handleDelete = useCallback(() => {
    if (!content) return;
    Alert.alert(
      'Delete Content',
      'Are you sure you want to remove this from your feed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeFromFeed(content.id);
            router.back();
          },
        },
      ]
    );
  }, [content, removeFromFeed]);

  const getContentTypeIcon = () => {
    switch (content?.type) {
      case 'doodle':
        return <Brush size={16} color={colors.text.tertiary} />;
      case 'photo':
        return <Camera size={16} color={colors.text.tertiary} />;
      case 'mood':
        return <Smile size={16} color={colors.text.tertiary} />;
      case 'voice':
        return <Mic size={16} color={colors.text.tertiary} />;
      case 'game':
        return <Gamepad2 size={16} color={colors.text.tertiary} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (!content) return null;

    switch (content.type) {
      case 'doodle':
        return (
          <Image
            source={{ uri: content.imageUrl }}
            style={[styles.contentImage, { backgroundColor: colors.background.secondary }]}
            resizeMode="contain"
          />
        );
      case 'photo':
        return (
          <View>
            <Image
              source={{ uri: content.imageUrl }}
              style={[styles.contentImage, { backgroundColor: colors.background.secondary }]}
              resizeMode="contain"
            />
            {content.caption ? (
              <Text style={[styles.caption, { color: colors.text.DEFAULT }]}>
                {content.caption}
              </Text>
            ) : null}
          </View>
        );
      case 'mood':
        return (
          <View style={[styles.moodContainer, { backgroundColor: `${colors.celebration.gold}1A` }]}>
            <SafeSymbol
              name={resolveMoodSymbol(content.emoji)}
              size={72}
              tintColor={colors.primary.DEFAULT}
              style={{ marginBottom: 12 }}
            />
            {content.note ? (
              <Text style={[styles.moodNote, { color: colors.text.secondary }]}>
                {content.note}
              </Text>
            ) : null}
          </View>
        );
      case 'voice':
        return (
          <View style={[styles.voiceContainer, { backgroundColor: colors.background.secondary }]}>
            <Pressable
              style={[styles.playButton, { backgroundColor: themeColors.primary.DEFAULT }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            >
              <Text style={[styles.playIcon, { color: colors.text.inverse }]}>▶</Text>
            </Pressable>
            <Text style={[styles.duration, { color: colors.text.tertiary }]}>
              {Math.floor(content.duration)}s
            </Text>
            {content.waveform ? (
              <View style={styles.waveform}>
                {content.waveform.slice(0, 40).map((level, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveformBar,
                      {
                        height: Math.max(4, level * 40),
                        backgroundColor: themeColors.primary.DEFAULT,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      case 'game':
        return (
          <View style={[styles.gameContainer, { backgroundColor: `${colors.success.DEFAULT}1A` }]}>
            <Gamepad2 size={64} color={themeColors.success.DEFAULT} />
            <Text style={[styles.gameTitle, { color: colors.text.DEFAULT }]}>
              {content.gameType === 'tictactoe' ? 'Tic Tac Toe' : 'Game'}
            </Text>
            <Pressable
              style={[styles.playGameButton, { backgroundColor: themeColors.success.DEFAULT }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(`/game/${content.gameId}`);
              }}
            >
              <Text style={[styles.playGameText, { color: colors.text.inverse }]}>Play Now</Text>
            </Pressable>
          </View>
        );
      default:
        return null;
    }
  };

  if (!content) {
    return (
      <LinearGradient
        colors={[colors.background.DEFAULT, colors.background.secondary]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.notFound}>
            <Text style={[styles.notFoundText, { color: colors.text.tertiary }]}>
              Content not found
            </Text>
            <Pressable
              style={[styles.backButton, { backgroundColor: themeColors.primary.DEFAULT }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: colors.text.inverse }]}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: content.senderName,
          headerRight: () => (
            <Pressable onPress={handleShare} hitSlop={8}>
              <Share2 size={22} color={colors.primary.DEFAULT} />
            </Pressable>
          ),
        }}
      />

      <LinearGradient
        colors={[colors.background.DEFAULT, colors.background.secondary]}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Sender Info */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()}
            style={styles.senderInfo}
          >
            <Avatar size="lg" alt={content.senderName}>
              {content.senderAvatar ? (
                <Avatar.Image source={{ uri: content.senderAvatar }} />
              ) : null}
              <Avatar.Fallback style={{ backgroundColor: themeColors.primary.DEFAULT }}>
                <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                  {content.senderName.charAt(0).toUpperCase()}
                </Text>
              </Avatar.Fallback>
            </Avatar>

            <View style={styles.senderDetails}>
              <Text style={[styles.senderName, { color: colors.text.DEFAULT }]}>
                {content.senderName}
              </Text>
              <View style={styles.metaRow}>
                {getContentTypeIcon()}
                <Clock size={14} color={colors.text.tertiary} style={{ marginLeft: 8 }} />
                <Text style={[styles.timestamp, { color: colors.text.tertiary }]}>
                  {timeAgo(content.createdAt)}
                </Text>
                {content.viewedAt ? (
                  <>
                    <Eye size={14} color={colors.text.tertiary} style={{ marginLeft: 8 }} />
                    <Text style={[styles.viewedText, { color: colors.text.tertiary }]}>
                      Viewed
                    </Text>
                  </>
                ) : null}
              </View>
            </View>
          </Animated.View>

          {/* Content */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.delay(100)}
            style={[
              styles.contentCard,
              { backgroundColor: colors.background.DEFAULT, shadowColor: colors.text.DEFAULT },
            ]}
          >
            {renderContent()}
          </Animated.View>

          {/* Reactions */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(200).springify()}
            style={styles.reactionsSection}
          >
            <Text style={[styles.reactionsLabel, { color: colors.text.tertiary }]}>
              REACT
            </Text>
            <View style={styles.reactionButtons}>
              {quickReactions.map((reaction) => (
                <Pressable
                  key={reaction.symbol}
                  style={[
                    styles.reactionButton,
                    {
                      backgroundColor:
                        resolveReactionSymbol(userReaction?.emoji) === reaction.symbol
                          ? themeColors.primary.light
                          : colors.background.secondary,
                    },
                  ]}
                  onPress={() => handleReaction(reaction.symbol)}
                  accessibilityLabel={reaction.label}
                >
                  <SafeSymbol
                    name={reaction.symbol}
                    size={20}
                    tintColor={colors.text.DEFAULT}
                  />
                </Pressable>
              ))}
            </View>

            {/* Existing reactions */}
            {content.reactions.length > 0 ? (
              <View style={[styles.existingReactions, { backgroundColor: colors.background.secondary }]}>
                <View style={styles.reactionList}>
                  {[...new Set(content.reactions.map((r) => resolveReactionSymbol(r.emoji)))]
                    .map((symbol, i) => (
                      <SafeSymbol
                        key={`${symbol}-${i}`}
                        name={symbol}
                        size={16}
                        tintColor={colors.text.tertiary}
                        style={{ marginRight: 4 }}
                      />
                    ))}
                </View>
                <Text style={[styles.reactionCount, { color: colors.text.secondary }]}>
                  {content.reactions.length} reaction{content.reactions.length !== 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Actions */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(300).springify()}
            style={styles.actionsSection}
          >
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={handleShare}
            >
              <Share2 size={20} color={colors.text.secondary} />
              <Text style={[styles.actionText, { color: colors.text.secondary }]}>
                Share
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: `${colors.primary.DEFAULT}1A` }]}
              onPress={handleDelete}
            >
              <Trash2 size={20} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>
                Remove
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  senderDetails: {
    flex: 1,
    marginLeft: 16,
  },
  senderName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 14,
    marginLeft: 4,
  },
  viewedText: {
    fontSize: 14,
    marginLeft: 4,
  },
  contentCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 24,
  },
  contentImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
  },
  caption: {
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
  },
  moodContainer: {
    padding: 48,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 96,
    marginBottom: 16,
  },
  moodNote: {
    fontSize: 18,
    textAlign: 'center',
  },
  voiceContainer: {
    padding: 32,
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  playIcon: {
    fontSize: 24,
    marginLeft: 4,
  },
  duration: {
    fontSize: 16,
    marginBottom: 16,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 40,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  gameContainer: {
    padding: 48,
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 24,
  },
  playGameButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
  },
  playGameText: {
    fontSize: 18,
    fontWeight: '600',
  },
  reactionsSection: {
    marginBottom: 24,
  },
  reactionsLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  reactionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 28,
  },
  existingReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginTop: 16,
  },
  reactionList: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reactionListEmoji: {
    fontSize: 20,
    marginRight: -4,
  },
  reactionCount: {
    fontSize: 14,
    marginLeft: 8,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  notFoundText: {
    fontSize: 18,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
