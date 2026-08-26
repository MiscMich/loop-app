/**
 * Profile Screen - Premium User Profile
 * Uses HeroUI + Lucide icons with optimized performance
 * Implements all 4 UI states: Loading, Error, Empty, Ideal
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Avatar, Card } from 'heroui-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  User,
  Bell,
  Shield,
  Sun,
  Moon,
  Smartphone,
  Palette,
  HelpCircle,
  MessageSquare,
  Star,
  LogOut,
  ChevronRight,
  Send,
  Users,
  Gamepad2,
  Settings,
  Edit3,
} from 'lucide-react-native';

import { useAuthStore } from '@/stores/authStore';
import { useContentStore } from '@/stores/contentStore';
import { useFriendsStore } from '@/stores/friendsStore';
import { useGameStore } from '@/stores/gameStore';
import { useTheme } from '@/providers/ThemeProvider';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { resolveMoodSymbol } from '@/lib/iconTokens';

// State components
import { useScreenState } from '@/hooks/useScreenState';
import { SkeletonProfile } from '@/components/states/loading';
import { NetworkError } from '@/components/states/error';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SettingsItem {
  icon: any;
  title: string;
  subtitle?: string;
  action?: () => void;
  showChevron?: boolean;
  color?: string;
}

function StatCard({
  value,
  label,
  icon: Icon,
  gradientColors,
  index = 0,
}: {
  value: number;
  label: string;
  icon: any;
  gradientColors: readonly [string, string, ...string[]];
  index?: number;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => Haptics.selectionAsync()}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      style={animatedStyle}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
    >
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(200 + index * 100).springify()}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, { shadowColor: colors.text.DEFAULT }]}
        >
          <Icon size={18} color={colors.text.inverse} strokeWidth={2} />
          <Text style={[styles.statValue, { color: colors.text.inverse }]}>{value}</Text>
          <Text style={[styles.statLabel, { color: colors.text.inverse, opacity: 0.8 }]}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

function SettingsRow({
  item,
  isLast,
  index = 0,
}: {
  item: SettingsItem;
  isLast: boolean;
  index?: number;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const Icon = item.icon;

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.selectionAsync();
        item.action?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      disabled={!item.action}
      style={animatedStyle}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.subtitle || ''}`}
    >
      <View style={styles.settingsRow}>
        <View
          style={[
            styles.settingsIcon,
            { backgroundColor: item.color ? `${item.color}15` : colors.background.secondary },
          ]}
        >
          <Icon size={20} color={item.color || colors.text.DEFAULT} strokeWidth={2} />
        </View>
        <View style={styles.settingsText}>
          <Text style={[styles.settingsTitle, { color: item.color || colors.text.DEFAULT }]}>
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text style={[styles.settingsSubtitle, { color: colors.text.tertiary }]}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
        {item.showChevron ? (
          <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={2} />
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

export default function ProfileScreen() {
  // Optimized selectors - subscribe to primitives only
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const sent = useContentStore((state) => state.sent);
  const currentMood = useContentStore((state) => state.currentMood);
  const friends = useFriendsStore((state) => state.friends);
  const activeGames = useGameStore((state) => state.activeGames);
  const completedGames = useGameStore((state) => state.completedGames);

  const { themeMode, setThemeMode, isDark, colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const gamesCount = activeGames.length + completedGames.length;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Unified screen state management
  const { state } = useScreenState(user, isLoading, error);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 400);
  }, []);

  const getThemeModeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  const cycleThemeMode = useCallback(() => {
    Haptics.selectionAsync();
    const nextMode =
      themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    setThemeMode(nextMode);
  }, [themeMode, setThemeMode]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          try {
            await signOut();
          } catch (error) {
            console.error('Sign out error:', error);
            // Still navigate even if signOut fails - local state is cleared
          }
          router.replace('/onboarding');
        },
      },
    ]);
  }, [signOut]);

  const handleEditProfile = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/profile/edit');
  }, []);

  const handleDemoOnlyAction = useCallback((feature: string) => {
    Haptics.selectionAsync();
    Alert.alert('Demo edition', `${feature} is not connected in this public demo.`);
  }, []);

  const handleNotifications = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/profile/notifications');
  }, []);

  const handlePrivacy = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/profile/privacy');
  }, []);

  const handleWidgetSetup = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/profile/widget-setup');
  }, []);

  const handleWidgetTheme = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/profile/widget-theme');
  }, []);

  const handleRateApp = useCallback(async () => {
    Haptics.selectionAsync();
    try {
      // Dynamically import to avoid crash when native module isn't available
      const StoreReview = await import('expo-store-review');
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
      } else {
        Alert.alert('Demo edition', 'Store reviews are not available for this public demo.');
      }
    } catch {
      Alert.alert('Demo edition', 'Store reviews are not available for this public demo.');
    }
  }, []);

  const accountSettings: SettingsItem[] = [
    {
      icon: User,
      title: 'Edit Profile',
      subtitle: 'Username, photo, bio',
      showChevron: true,
      action: handleEditProfile,
      color: colors.primary.DEFAULT,
    },
    {
      icon: Bell,
      title: 'Notifications',
      subtitle: 'Push notification settings',
      showChevron: true,
      action: handleNotifications,
      color: colors.accent.DEFAULT,
    },
    {
      icon: Shield,
      title: 'Privacy',
      subtitle: 'Who can see your content',
      showChevron: true,
      action: handlePrivacy,
      color: colors.accent.dark,
    },
    {
      icon: isDark ? Moon : Sun,
      title: 'Appearance',
      subtitle: getThemeModeLabel(),
      action: cycleThemeMode,
      color: colors.celebration.gold,
    },
  ];

  const widgetSettings: SettingsItem[] = [
    {
      icon: Smartphone,
      title: 'Widget Setup',
      subtitle: 'Add Loop to your homescreen',
      showChevron: true,
      action: handleWidgetSetup,
      color: colors.success.DEFAULT,
    },
    {
      icon: Palette,
      title: 'Widget Theme',
      subtitle: 'Customize appearance',
      showChevron: true,
      action: handleWidgetTheme,
      color: colors.primary.DEFAULT,
    },
  ];

  const supportSettings: SettingsItem[] = [
    {
      icon: HelpCircle,
      title: 'Help Center',
      showChevron: true,
      action: () => handleDemoOnlyAction('Help Center'),
    },
    {
      icon: MessageSquare,
      title: 'Send Feedback',
      showChevron: true,
      action: () => handleDemoOnlyAction('Feedback'),
    },
    {
      icon: Star,
      title: 'Rate Loop',
      showChevron: true,
      action: handleRateApp,
      color: colors.celebration.gold,
    },
  ];

  // Loading state
  if (state === 'loading') {
    return (
      <LinearGradient
        colors={[colors.background.DEFAULT, colors.background.secondary, colors.background.tertiary]}
        style={styles.container}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Text style={[styles.headerLabel, { color: colors.primary.DEFAULT }]}>
              YOUR SPACE
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
              Profile
            </Text>
          </View>
          <SkeletonProfile />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <LinearGradient
        colors={[colors.background.DEFAULT, colors.background.secondary, colors.background.tertiary]}
        style={styles.container}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Text style={[styles.headerLabel, { color: colors.primary.DEFAULT }]}>
              YOUR SPACE
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
              Profile
            </Text>
          </View>
          <View style={styles.errorContainer}>
            <NetworkError onRetry={handleRetry} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
    colors={[colors.background.DEFAULT, colors.background.secondary, colors.background.tertiary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Header */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(0)}
            style={styles.header}
          >
            <Text style={[styles.headerLabel, { color: colors.primary.DEFAULT }]}>
              YOUR SPACE
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
              Profile
            </Text>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(100)}
            style={styles.profileCardContainer}
          >
            <LinearGradient
              colors={[colors.primary.DEFAULT, colors.primary.light]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.profileCard, { shadowColor: colors.primary.DEFAULT }]}
            >
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <Avatar
                  size="lg"
                  alt={user?.displayName || 'Profile'}
                  style={styles.avatar}
                >
                  {user?.avatarUrl ? (
                    <Avatar.Image source={{ uri: user.avatarUrl }} />
                  ) : null}
                  <Avatar.Fallback style={styles.avatarFallback}>
                    <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                      {(user?.displayName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
                {currentMood ? (
                  <View
                    style={[
                      styles.moodBadge,
                      { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT },
                    ]}
                  >
                    <SafeSymbol
                      name={resolveMoodSymbol(currentMood.emoji)}
                      size={18}
                      tintColor={colors.primary.DEFAULT}
                    />
                  </View>
                ) : null}
              </View>

              {/* User Info */}
              <Text style={[styles.userName, { color: colors.text.inverse }]}>
                {user?.displayName || 'Set up profile'}
              </Text>
              <Text style={[styles.userHandle, { color: colors.text.inverse, opacity: 0.8 }]} selectable>
                {user?.username ? `@${user.username}` : 'Add a username'}
              </Text>

              {/* Edit Button */}
              <Pressable
                onPress={handleEditProfile}
                style={styles.editButton}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Edit3 size={14} color={colors.text.inverse} strokeWidth={2} />
                <Text style={[styles.editButtonText, { color: colors.text.inverse }]}>Edit Profile</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>

          {/* Stats */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(200)}
            style={styles.statsContainer}
          >
            <StatCard
              value={sent.length}
              label="Sent"
              icon={Send}
              gradientColors={[colors.primary.DEFAULT, colors.primary.light]}
              index={0}
            />
            <StatCard
              value={friends.length}
              label="Friends"
              icon={Users}
              gradientColors={[colors.accent.DEFAULT, colors.accent.light]}
              index={1}
            />
            <StatCard
              value={gamesCount}
              label="Games"
              icon={Gamepad2}
              gradientColors={colors.success.gradient}
              index={2}
            />
          </Animated.View>

          {/* Account Settings */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(300)}
            style={styles.sectionContainer}
          >
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
              ACCOUNT
            </Text>
            <View style={[styles.settingsCard, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
              {accountSettings.map((item, index) => (
                <View key={index}>
                  <SettingsRow
                    item={item}
                    isLast={index === accountSettings.length - 1}
                    index={index}
                  />
                  {index < accountSettings.length - 1 ? (
                    <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                  ) : null}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Widget Settings */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(400)}
            style={styles.sectionContainer}
          >
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
              WIDGETS
            </Text>
            <View style={[styles.settingsCard, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
              {widgetSettings.map((item, index) => (
                <View key={index}>
                  <SettingsRow
                    item={item}
                    isLast={index === widgetSettings.length - 1}
                    index={index}
                  />
                  {index < widgetSettings.length - 1 ? (
                    <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                  ) : null}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Support Settings */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(500)}
            style={styles.sectionContainer}
          >
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
              SUPPORT
            </Text>
            <View style={[styles.settingsCard, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
              {supportSettings.map((item, index) => (
                <View key={index}>
                  <SettingsRow
                    item={item}
                    isLast={index === supportSettings.length - 1}
                    index={index}
                  />
                  {index < supportSettings.length - 1 ? (
                    <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                  ) : null}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Sign Out */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(600)}
            style={styles.sectionContainer}
          >
            <View style={[styles.settingsCard, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
              <SettingsRow
                item={{
                  icon: LogOut,
                  title: 'Sign Out',
                  action: handleSignOut,
                  color: colors.error,
                }}
                isLast
              />
            </View>
          </Animated.View>

          {/* Version */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(400).delay(700)}
            style={styles.versionContainer}
          >
            <Text style={[styles.versionText, { color: colors.text.tertiary }]}>
              Loop v1.0.0
            </Text>
            <Text style={[styles.versionSubtext, { color: colors.text.tertiary }]}>
              Made with ❤️ for friends
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  profileCardContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  profileCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  moodBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  moodEmoji: {
    fontSize: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  userHandle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderCurve: 'continuous',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});
