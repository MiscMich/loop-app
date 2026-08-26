/**
 * Friend Profile Screen
 * Shows friend details with content history and actions
 * Supports Link.Preview for iOS peek and pop
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Alert,
  StyleSheet,
  FlatList,
} from 'react-native';
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
  MessageCircle,
  Share2,
  UserMinus,
  Clock,
  Image as ImageIcon,
  Brush,
  Camera,
  Smile,
  Mic,
  Gamepad2,
  ChevronRight,
} from 'lucide-react-native';

import { useFriendsStore, Friend } from '@/stores/friendsStore';
import { useContentStore, Content } from '@/stores/contentStore';
import { useTheme } from '@/providers/ThemeProvider';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { resolveMoodSymbol } from '@/lib/iconTokens';

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reducedMotion = useReducedMotion();
  const { colors } = useTheme();

  // Get friend from store
  const friends = useFriendsStore((state) => state.friends);
  const removeFriend = useFriendsStore((state) => state.removeFriend);
  const feed = useContentStore((state) => state.feed);

  const friend = useMemo(
    () => friends.find((f) => f.id === id),
    [friends, id]
  );

  // Get content from this friend
  const friendContent = useMemo(
    () => feed.filter((c) => c.senderId === id).slice(0, 10),
    [feed, id]
  );

  const isOnline = useMemo(() => {
    if (!friend?.lastActive) return false;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return new Date(friend.lastActive).getTime() > fiveMinutesAgo;
  }, [friend?.lastActive]);

  const timeAgo = useCallback((dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }, []);

  const handleMessage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to create with pre-selected recipient
    router.push('/create');
  }, []);

  const handleShare = useCallback(async () => {
    if (!friend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Add ${friend.displayName} on Loop! Username: @${friend.username}`,
        title: `Add ${friend.displayName} on Loop`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }, [friend]);

  const handleRemove = useCallback(() => {
    if (!friend) return;
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.displayName}? You won't see their content anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeFriend(friend.id);
            router.back();
          },
        },
      ]
    );
  }, [friend, removeFriend]);

  const getContentTypeIcon = (type: Content['type']) => {
    switch (type) {
      case 'doodle':
        return <Brush size={14} color={colors.text.tertiary} />;
      case 'photo':
        return <Camera size={14} color={colors.text.tertiary} />;
      case 'mood':
        return <Smile size={14} color={colors.text.tertiary} />;
      case 'voice':
        return <Mic size={14} color={colors.text.tertiary} />;
      case 'game':
        return <Gamepad2 size={14} color={colors.text.tertiary} />;
      default:
        return null;
    }
  };

  const renderContentItem = useCallback(
    ({ item, index }: { item: Content; index: number }) => (
      <Pressable
        style={[styles.contentItem, { backgroundColor: colors.background.secondary }]}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/content/${item.id}` as any);
        }}
      >
        <View style={[styles.contentIcon, { backgroundColor: colors.fill }]}>
          {getContentTypeIcon(item.type)}
        </View>
        <View style={styles.contentInfo}>
          <Text style={[styles.contentType, { color: colors.text.DEFAULT }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
          <Text style={[styles.contentTime, { color: colors.text.tertiary }]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.text.tertiary} />
      </Pressable>
    ),
    [colors, timeAgo]
  );

  if (!friend) {
    return (
      <LinearGradient
        colors={[colors.background.DEFAULT, colors.background.secondary]}
        style={styles.container}
      >
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.text.tertiary }]}>
            Friend not found
          </Text>
              <Pressable
                style={[styles.backButton, { backgroundColor: colors.primary.DEFAULT }]}
                onPress={() => router.back()}
              >
                <Text style={[styles.backButtonText, { color: colors.text.inverse }]}>Go Back</Text>
              </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: friend.displayName,
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
          {/* Profile Header */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()}
            style={styles.profileHeader}
          >
            <View style={styles.avatarContainer}>
              <Avatar size="lg" alt={friend.displayName}>
                {friend.avatarUrl ? (
                  <Avatar.Image source={{ uri: friend.avatarUrl }} />
                ) : null}
                <Avatar.Fallback style={{ backgroundColor: colors.primary.DEFAULT }}>
                  <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                    {friend.displayName.charAt(0).toUpperCase()}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              {isOnline ? (
                <View
                  style={[
                    styles.onlineIndicator,
                    { backgroundColor: colors.success.DEFAULT, borderColor: colors.background.pure },
                  ]}
                />
              ) : null}
            </View>

            <Text style={[styles.displayName, { color: colors.text.DEFAULT }]}>
              {friend.displayName}
            </Text>
            <Text style={[styles.username, { color: colors.text.tertiary }]} selectable>
              @{friend.username}
            </Text>

            {/* Status/Mood */}
            {friend.currentMood ? (
              <View style={[styles.moodBadge, { backgroundColor: `${colors.primary.DEFAULT}15` }]}>
                <SafeSymbol
                  name={resolveMoodSymbol(friend.currentMood)}
                  size={18}
                  tintColor={colors.primary.DEFAULT}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.moodLabel, { color: colors.text.secondary }]}>
                  Current Mood
                </Text>
              </View>
            ) : null}

            {/* Online Status */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? colors.success.DEFAULT : colors.text.tertiary },
                ]}
              />
              <Text style={[styles.statusText, { color: colors.text.tertiary }]}>
                {isOnline
                  ? 'Online now'
                  : friend.lastActive
                  ? `Last seen ${timeAgo(friend.lastActive)}`
                  : 'Offline'}
              </Text>
            </View>
          </Animated.View>

          {/* Stats */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(100).springify()}
            style={styles.statsSection}
          >
            <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
              <ImageIcon size={24} color={colors.primary.DEFAULT} />
              <Text style={[styles.statValue, { color: colors.text.DEFAULT }]}>
                {friendContent.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
                Posts Received
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
              <Clock size={24} color={colors.accent.DEFAULT} />
              <Text style={[styles.statValue, { color: colors.text.DEFAULT }]}>
                {friend.addedAt ? timeAgo(friend.addedAt) : '--'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
                Friends Since
              </Text>
            </View>
          </Animated.View>

          {/* Actions */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(200).springify()}
            style={styles.actionsSection}
          >
            <Pressable
              style={[styles.primaryAction, { backgroundColor: colors.primary.DEFAULT }]}
              onPress={handleMessage}
            >
              <MessageCircle size={20} color={colors.text.inverse} />
              <Text style={[styles.primaryActionText, { color: colors.text.inverse }]}>Send Content</Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryAction, { backgroundColor: colors.background.secondary }]}
              onPress={handleShare}
            >
              <Share2 size={20} color={colors.text.secondary} />
              <Text style={[styles.secondaryActionText, { color: colors.text.secondary }]}>
                Share Profile
              </Text>
            </Pressable>
          </Animated.View>

          {/* Recent Content */}
          {friendContent.length > 0 ? (
            <Animated.View
              entering={reducedMotion ? undefined : FadeIn.delay(300)}
              style={styles.contentSection}
            >
              <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
                RECENT CONTENT
              </Text>
              {friendContent.map((item, index) => (
                <View key={item.id}>
                  {renderContentItem({ item, index })}
                </View>
              ))}
            </Animated.View>
          ) : null}

          {/* Danger Zone */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(400).springify()}
            style={styles.dangerSection}
          >
            <Pressable
              style={[styles.removeButton, { backgroundColor: `${colors.error}15` }]}
              onPress={handleRemove}
            >
              <UserMinus size={20} color={colors.error} />
              <Text style={[styles.removeText, { color: colors.error }]}>
                Remove Friend
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
  },
  displayName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 16,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 12,
  },
  moodEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  contentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentInfo: {
    flex: 1,
  },
  contentType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contentTime: {
    fontSize: 14,
  },
  dangerSection: {
    marginTop: 12,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  removeText: {
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
