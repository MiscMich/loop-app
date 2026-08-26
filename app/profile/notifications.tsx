/**
 * Notifications Settings Screen
 * Push notification preferences and controls
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Bell,
  MessageCircle,
  Heart,
  Gamepad2,
  UserPlus,
  Clock,
  ChevronLeft,
  Settings,
  AlertCircle,
} from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { useNotifications, type PermissionStatus } from '@/hooks/useNotifications';

interface NotificationToggle {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  color: string;
}

const buildNotificationToggles = (colors: ReturnType<typeof useTheme>['colors']): NotificationToggle[] => [
  {
    id: 'newContent',
    icon: MessageCircle,
    title: 'New Content',
    subtitle: 'When friends send you doodles, photos, or voice notes',
    color: colors.primary.DEFAULT,
  },
  {
    id: 'reactions',
    icon: Heart,
    title: 'Reactions',
    subtitle: 'When friends react to your content',
    color: colors.accent.DEFAULT,
  },
  {
    id: 'gameInvites',
    icon: Gamepad2,
    title: 'Game Invites',
    subtitle: 'When friends challenge you to a game',
    color: colors.success.DEFAULT,
  },
  {
    id: 'gameTurns',
    icon: Clock,
    title: 'Your Turn',
    subtitle: 'When it\'s your turn in a game',
    color: colors.celebration.gold,
  },
  {
    id: 'friendRequests',
    icon: UserPlus,
    title: 'Friend Requests',
    subtitle: 'When someone wants to be your friend',
    color: colors.accent.dark,
  },
];

function PermissionBanner({
  status,
  canAskAgain,
  onRequestPermission,
}: {
  status: PermissionStatus;
  canAskAgain: boolean;
  onRequestPermission: () => void;
}) {
  const { colors } = useTheme();

  if (status === 'granted') return null;

  const openSettings = () => {
    Haptics.selectionAsync();
    Linking.openSettings();
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
        style={[styles.bannerContainer, { backgroundColor: `${colors.warning}20` }]}
    >
      <AlertCircle size={24} color={colors.warning} strokeWidth={2} />
      <View style={styles.bannerTextContainer}>
        <Text style={[styles.bannerTitle, { color: colors.text.DEFAULT }]}>
          Notifications are {status === 'denied' ? 'disabled' : 'not enabled'}
        </Text>
        <Text style={[styles.bannerSubtitle, { color: colors.text.secondary }]}>
          {status === 'denied' && !canAskAgain
            ? 'Open Settings to enable notifications for Loop'
            : 'Enable notifications to stay connected with friends'}
        </Text>
      </View>
      <Pressable
        onPress={status === 'denied' && !canAskAgain ? openSettings : onRequestPermission}
        style={[styles.bannerButton, { backgroundColor: colors.warning }]}
      >
        <Text style={[styles.bannerButtonText, { color: colors.text.inverse }]}>
          {status === 'denied' && !canAskAgain ? 'Settings' : 'Enable'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function NotificationRow({
  item,
  enabled,
  onToggle,
  disabled,
  index,
}: {
  item: NotificationToggle;
  enabled: boolean;
  onToggle: (id: string, value: boolean) => void;
  disabled: boolean;
  index: number;
}) {
  const { colors } = useTheme();
  const Icon = item.icon;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(200 + index * 50)}
      style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
        <Icon size={20} color={item.color} strokeWidth={2} />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowTitle, { color: colors.text.DEFAULT }]}>
          {item.title}
        </Text>
        <Text style={[styles.rowSubtitle, { color: colors.text.tertiary }]}>
          {item.subtitle}
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={(value) => {
          Haptics.selectionAsync();
          onToggle(item.id, value);
        }}
        disabled={disabled}
        trackColor={{ false: colors.separator, true: colors.primary.DEFAULT + '80' }}
        thumbColor={enabled ? colors.primary.DEFAULT : colors.text.inverse}
        ios_backgroundColor={colors.separator}
      />
    </Animated.View>
  );
}

export default function NotificationsSettingsScreen() {
  const { colors } = useTheme();
  const {
    permissionStatus,
    canAskAgain,
    requestPermissions,
    isLoading,
    error,
  } = useNotifications();

  // Local state for notification preferences
  // In production, these would be persisted to user settings
  const [preferences, setPreferences] = useState({
    newContent: true,
    reactions: true,
    gameInvites: true,
    gameTurns: true,
    friendRequests: true,
  });

  const handleToggle = useCallback((id: string, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [id]: value }));
    // In production: persist to backend
  }, []);

  const handleRequestPermission = useCallback(async () => {
    Haptics.selectionAsync();
    const granted = await requestPermissions();
    if (granted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [requestPermissions]);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, []);

  const isDisabled = permissionStatus !== 'granted';
  const notificationToggles = buildNotificationToggles(colors);

  return (
    <LinearGradient
      colors={[colors.background.DEFAULT, colors.background.secondary, colors.background.tertiary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={colors.text.DEFAULT} strokeWidth={2} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
            Notifications
          </Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Permission Banner */}
          <PermissionBanner
            status={permissionStatus}
            canAskAgain={canAskAgain}
            onRequestPermission={handleRequestPermission}
          />

          {/* Error Message */}
          {error && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={[styles.errorContainer, { backgroundColor: `${colors.error}15` }]}
            >
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </Animated.View>
          )}

          {/* Section Header */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.sectionHeader}
          >
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
              PUSH NOTIFICATIONS
            </Text>
            {isDisabled && (
              <Text style={[styles.disabledHint, { color: colors.text.tertiary }]}>
                Enable notifications above to customize
              </Text>
            )}
          </Animated.View>

          {/* Notification Toggles */}
          <View style={[styles.card, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
            {notificationToggles.map((item, index) => (
              <React.Fragment key={item.id}>
                <NotificationRow
                  item={item}
                  enabled={preferences[item.id as keyof typeof preferences]}
                  onToggle={handleToggle}
                  disabled={isDisabled}
                  index={index}
                />
                {index < notificationToggles.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Info */}
          <Animated.View
            entering={FadeIn.duration(400).delay(500)}
            style={[styles.infoContainer, { backgroundColor: colors.background.secondary }]}
          >
            <Bell size={20} color={colors.text.tertiary} strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              Notifications help you stay connected with friends. You can change these settings anytime.
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  bannerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
  },
  bannerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  bannerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  disabledHint: {
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
});
