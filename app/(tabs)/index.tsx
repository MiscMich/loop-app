/**
 * Home Screen - Premium Feed Experience
 * Full-width design with lucide icons, optimized performance
 * Implements all 4 UI states: Loading, Error, Empty, Ideal
 */

import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Avatar } from 'heroui-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Home,
  Users,
  Image as ImageIcon,
  Sparkles,
  Plus,
  ChevronRight,
  Pencil,
  Bell,
  Smartphone,
  ArrowRight,
  X,
} from 'lucide-react-native';

import { ContentCardWithLink } from '@/components/ContentCardWithLink';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { useTooltipState } from '@/components/ui/Tooltip';
import { useContentStore } from '@/stores/contentStore';
import { useAuthStore } from '@/stores/authStore';
import { useFriendsStore } from '@/stores/friendsStore';
import { useTheme } from '@/providers/ThemeProvider';
import { colors as themeColors } from '@/lib/theme';
import { resolveMoodSymbol, getMoodLabel } from '@/lib/iconTokens';
import type { Content, ContentReaction } from '@/stores/contentStore';

// State components
import { useScreenState } from '@/hooks/useScreenState';
import { SkeletonFeed } from '@/components/states/loading';
import { NetworkError } from '@/components/states/error';
import { EmptyFeed } from '@/components/states/empty';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Stat card with gradient and lucide icons
function StatCard({
  value,
  label,
  icon: Icon,
  gradientColors,
  onPress,
  index = 0,
}: {
  value: number;
  label: string;
  icon: any;
  gradientColors: readonly [string, string, ...string[]];
  onPress?: () => void;
  index?: number;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}. Tap to view details`}
    >
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(index * 100).springify()}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            borderCurve: 'continuous',
            padding: 20,
            shadowColor: gradientColors[0],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Icon size={24} color="rgba(255,255,255,0.9)" strokeWidth={2} />
            <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
              <ChevronRight size={16} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
            </View>
          </View>
          <Text className="text-4xl font-bold text-white mb-1" style={{ fontVariant: ['tabular-nums'] }}>{value}</Text>
          <Text className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">
            {label}
          </Text>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

// Mood card with animation
function MoodCard({
  emoji,
  note,
  onPress,
  colors,
}: {
  emoji: string;
  note?: string;
  onPress: () => void;
  colors: any;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      style={animatedStyle}
      accessibilityRole="button"
      accessibilityLabel={`Your mood: ${getMoodLabel(emoji)}. ${note || 'Tap to update'}`}
    >
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(300).springify()}
        className="flex-row items-center p-4 rounded-[20px] mb-5"
        style={{
          backgroundColor: colors.background.secondary,
          shadowColor: colors.text.DEFAULT,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <LinearGradient
          colors={colors.primary.gradient}
          className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
        >
          <SafeSymbol
            name={resolveMoodSymbol(emoji)}
            size={28}
            tintColor={colors.text.inverse}
          />
        </LinearGradient>
        <View className="flex-1">
          <Text
            className="text-[11px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: colors.primary.DEFAULT }}
          >
            Your Mood
          </Text>
          <Text
            className="text-base font-medium"
            numberOfLines={1}
            style={{ color: colors.text.DEFAULT }}
          >
            {note || 'Tap to update'}
          </Text>
        </View>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary.DEFAULT + '15' }}
        >
          <Pencil size={18} color={colors.primary.DEFAULT} strokeWidth={2} />
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

// Widget Explainer Card - Explains how content flows to friends
function WidgetExplainerCard({
  onDismiss,
  colors,
}: {
  onDismiss: () => void;
  colors: any;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(400).springify()}
      className="rounded-[20px] mb-5 overflow-hidden"
      style={{
        backgroundColor: colors.background.secondary,
        shadowColor: colors.text.DEFAULT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Header with dismiss */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View className="flex-row items-center">
          <View
            className="w-8 h-8 rounded-lg items-center justify-center mr-2"
            style={{ backgroundColor: colors.primary.DEFAULT }}
          >
            <Smartphone size={16} color={colors.text.inverse} />
          </View>
          <Text
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: colors.primary.DEFAULT }}
          >
            How Widgets Work
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onDismiss();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss explanation"
        >
          <X size={18} color={colors.text.tertiary} />
        </Pressable>
      </View>

      {/* Content */}
      <View className="px-4 pb-4">
        <Text
          className="text-sm leading-5 mb-4"
          style={{ color: colors.text.secondary }}
        >
          When you create content (doodle, photo, mood, voice), you choose which friends receive it.
        </Text>

        {/* Flow visualization */}
        <View className="flex-row items-center justify-center py-3 px-2 rounded-xl mb-3"
          style={{ backgroundColor: colors.background.DEFAULT }}
        >
          <View className="items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mb-1"
              style={{ backgroundColor: colors.primary.light }}
            >
              <SafeSymbol name="paintpalette.fill" size={18} tintColor={colors.primary.DEFAULT} />
            </View>
            <Text className="text-[10px] font-medium" style={{ color: colors.text.tertiary }}>
              You create
            </Text>
          </View>
          <ArrowRight size={20} color={colors.primary.DEFAULT} className="mx-3" />
          <View className="items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mb-1"
              style={{ backgroundColor: colors.accent.light }}
            >
              <Users size={18} color={colors.accent.DEFAULT} />
            </View>
            <Text className="text-[10px] font-medium" style={{ color: colors.text.tertiary }}>
              Pick friends
            </Text>
          </View>
          <ArrowRight size={20} color={colors.primary.DEFAULT} className="mx-3" />
          <View className="items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mb-1"
              style={{ backgroundColor: themeColors.success?.DEFAULT || colors.success.DEFAULT }}
            >
              <Smartphone size={18} color={colors.text.inverse} />
            </View>
            <Text className="text-[10px] font-medium" style={{ color: colors.text.tertiary }}>
              Their widget
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-center gap-2">
          <SafeSymbol name="lightbulb.fill" size={12} tintColor={colors.text.tertiary} />
          <Text className="text-xs" style={{ color: colors.text.tertiary }}>
            Your widget shows content your friends sent to you!
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Floating action button
function CreateFAB({ onPress, colors }: { onPress: () => void; colors: any }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: 100,
          right: 20,
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary.DEFAULT,
          shadowColor: colors.primary.DEFAULT,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
          elevation: 10,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Create new post"
    >
      <Plus size={32} color={colors.text.inverse} strokeWidth={2.5} />
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const reducedMotion = useReducedMotion();
  const navigation = useNavigation();

  // Optimized selectors - subscribe to primitives only
  const feed = useContentStore((state) => state.feed);
  const currentMood = useContentStore((state) => state.currentMood);
  const addReaction = useContentStore((state) => state.addReaction);
  const user = useAuthStore((state) => state.user);
  const friends = useFriendsStore((state) => state.friends);
  const { colors } = useTheme();

  // Widget explainer tooltip - shows on first app use
  const widgetExplainer = useTooltipState('home-widget-explainer', true);

  // Unified screen state management
  const { state } = useScreenState(feed, isLoading, error);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Configure native search bar in header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLargeTitle: true,
      title: 'Home',
      headerSearchBarOptions: {
        placeholder: 'Search posts...',
        hideWhenScrolling: true,
        onChangeText: (event: { nativeEvent: { text: string } }) => {
          setSearchQuery(event.nativeEvent.text);
        },
      },
    });
  }, [navigation]);

  // Sort content by date, newest first, and filter by search query
  const sortedContent = useMemo(() => {
    let filtered = [...feed];

    // Filter by search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        // Search in sender name
        if (item.senderName?.toLowerCase().includes(query)) return true;
        // Search in content type
        if (item.type.toLowerCase().includes(query)) return true;
        // Search in caption for photos
        if (item.type === 'photo' && (item as any).caption?.toLowerCase().includes(query)) return true;
        // Search in note for moods
        if (item.type === 'mood' && (item as any).note?.toLowerCase().includes(query)) return true;
        return false;
      });
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [feed, searchQuery]);

  // Get time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  const handleContentPress = useCallback((content: Content) => {
    Haptics.selectionAsync();
  }, []);

  const handleReaction = useCallback(
    (contentId: string, emoji: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const reaction: ContentReaction = {
        userId: user?.id || 'current-user',
        emoji,
        createdAt: new Date().toISOString(),
      };
      addReaction(contentId, reaction);
    },
    [addReaction, user]
  );

  const handleCreatePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create');
  }, []);

  // Get item layout for FlatList optimization
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 400, // Approximate card height
      offset: 400 * index,
      index,
    }),
    []
  );

  const renderHeader = () => (
    <View className="mb-4">
      {/* Greeting with Avatar */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()}
        className="flex-row justify-between items-start mb-6"
      >
        <View className="flex-1">
          <Text
            className="text-xs font-medium uppercase tracking-[2px] mb-1"
            style={{ color: colors.primary.DEFAULT }}
          >
            {greeting}
          </Text>
          <Text
            className="text-[32px] font-bold"
            style={{ color: colors.text.DEFAULT }}
          >
            {user?.displayName || 'Friend'}
          </Text>
        </View>

        {/* Avatar with notification badge */}
        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="View profile"
        >
          <View className="relative">
            <Avatar
              size="lg"
              alt={user?.displayName || 'Profile'}
              className="border-2"
              style={{ borderColor: colors.primary.light }}
            >
              {user?.avatarUrl ? (
                <Avatar.Image source={{ uri: user.avatarUrl }} />
              ) : null}
              <Avatar.Fallback style={{ backgroundColor: colors.primary.DEFAULT }}>
                <Text className="text-lg font-semibold text-white">
                  {(user?.displayName || 'U').charAt(0).toUpperCase()}
                </Text>
              </Avatar.Fallback>
            </Avatar>
            {/* Notification dot */}
            <View
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary.DEFAULT }}
            >
              <Bell size={10} color={colors.text.inverse} strokeWidth={2.5} />
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Stats */}
      <View className="flex-row gap-4 mb-5">
        <View className="flex-1">
          <StatCard
            value={friends.length}
            label="Friends"
            icon={Users}
            gradientColors={[colors.accent.DEFAULT, colors.accent.light]}
            index={0}
            onPress={() => router.push('/friends')}
          />
        </View>
        <View className="flex-1">
          <StatCard
            value={feed.length}
            label="Posts"
            icon={ImageIcon}
            gradientColors={[colors.primary.DEFAULT, colors.primary.light]}
            index={1}
          />
        </View>
      </View>

      {/* Current Mood Card - proper ternary instead of && */}
      {currentMood ? (
        <MoodCard
          emoji={currentMood.emoji}
          note={currentMood.note}
          onPress={() => router.push('/create/mood')}
          colors={colors}
        />
      ) : null}

      {/* Widget Explainer - Shows on first use to clarify content flow */}
      {widgetExplainer.visible ? (
        <WidgetExplainerCard
          onDismiss={widgetExplainer.dismiss}
          colors={colors}
        />
      ) : null}

      {/* Section Header */}
      {sortedContent.length > 0 ? (
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.delay(400)}
          className="flex-row items-center mb-4"
        >
          <Sparkles size={14} color={colors.text.tertiary} strokeWidth={2} />
          <Text
            className="text-[11px] font-semibold uppercase tracking-wider ml-2"
            style={{ color: colors.text.tertiary }}
          >
            Recent Activity
          </Text>
          <View
            className="h-px flex-1 ml-4"
            style={{ backgroundColor: colors.separator }}
          />
        </Animated.View>
      ) : null}
    </View>
  );

  const renderContent = useCallback(
    ({ item, index }: { item: Content; index: number }) => (
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(index * 50).springify()}
        className="mb-4"
      >
        <ContentCardWithLink
          content={item}
          index={index}
          onReact={(emoji) => handleReaction(item.id, emoji)}
        />
      </Animated.View>
    ),
    [handleReaction, reducedMotion]
  );

  // Render loading skeleton
  const renderLoadingState = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      {renderHeader()}
      <SkeletonFeed count={3} />
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      {renderHeader()}
      <NetworkError onRetry={handleRetry} />
    </View>
  );

  // Render empty state
  const renderEmptyState = () => <EmptyFeed onAction={handleCreatePress} />;

  // Handle different states
  if (state === 'loading') {
    return (
      <LinearGradient
        colors={[colors.background.DEFAULT, colors.background.secondary, colors.background.tertiary]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          {renderLoadingState()}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (state === 'error') {
    return (
      <LinearGradient
        colors={[colors.background.DEFAULT, colors.background.secondary, colors.background.tertiary]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          {renderErrorState()}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background.DEFAULT, colors.background.secondary, colors.background.tertiary]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        <FlatList
          data={sortedContent}
          renderItem={renderContent}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 120,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          // Performance optimizations
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          getItemLayout={getItemLayout}
          initialNumToRender={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.DEFAULT}
            />
          }
        />

        {/* Floating Create Button - proper ternary */}
        {sortedContent.length > 0 ? (
          <CreateFAB onPress={handleCreatePress} colors={colors} />
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}
