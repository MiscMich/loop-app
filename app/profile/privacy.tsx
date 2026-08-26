/**
 * Privacy Settings Screen
 * Control who can see your content and interact with you
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Shield,
  Eye,
  EyeOff,
  Users,
  UserX,
  Search,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { useFriendsStore } from '@/stores/friendsStore';

interface PrivacyToggle {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  color: string;
}

interface PrivacyAction {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  color: string;
  action: () => void;
}

const buildPrivacyToggles = (colors: ReturnType<typeof useTheme>['colors']): PrivacyToggle[] => [
  {
    id: 'showOnlineStatus',
    icon: Eye,
    title: 'Show Online Status',
    subtitle: 'Let friends see when you\'re active',
    color: colors.success.DEFAULT,
  },
  {
    id: 'showLastSeen',
    icon: Clock,
    title: 'Last Seen',
    subtitle: 'Show when you last opened Loop',
    color: colors.accent.DEFAULT,
  },
  {
    id: 'discoverableByUsername',
    icon: Search,
    title: 'Discoverable by Username',
    subtitle: 'Let others find you by your username',
    color: colors.primary.DEFAULT,
  },
];

function PrivacyToggleRow({
  item,
  enabled,
  onToggle,
  index,
}: {
  item: PrivacyToggle;
  enabled: boolean;
  onToggle: (id: string, value: boolean) => void;
  index: number;
}) {
  const { colors } = useTheme();
  const Icon = item.icon;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(200 + index * 50)}
      style={styles.row}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
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
        trackColor={{ false: colors.separator, true: colors.primary.DEFAULT + '80' }}
        thumbColor={enabled ? colors.primary.DEFAULT : colors.text.inverse}
        ios_backgroundColor={colors.separator}
      />
    </Animated.View>
  );
}

function PrivacyActionRow({
  item,
  index,
}: {
  item: PrivacyAction;
  index: number;
}) {
  const { colors } = useTheme();
  const Icon = item.icon;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        item.action();
      }}
    >
      <Animated.View
        entering={FadeInDown.duration(400).delay(400 + index * 50)}
        style={styles.row}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
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
        <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={2} />
      </Animated.View>
    </Pressable>
  );
}

export default function PrivacySettingsScreen() {
  const { colors } = useTheme();
  const blockedUsers = useFriendsStore((state) => state.blockedUsers);
  const privacyToggles = buildPrivacyToggles(colors);

  // Local state for privacy preferences
  // In production, these would be persisted to user settings
  const [preferences, setPreferences] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    discoverableByUsername: true,
  });

  const handleToggle = useCallback((id: string, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [id]: value }));
    // In production: persist to backend
  }, []);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, []);

  const handleViewBlockedUsers = useCallback(() => {
    if (blockedUsers.length === 0) {
      Alert.alert('No Blocked Users', 'You haven\'t blocked anyone yet.');
    } else {
      // Navigate to blocked users list
      Alert.alert(
        'Blocked Users',
        `You have ${blockedUsers.length} blocked user${blockedUsers.length === 1 ? '' : 's'}.`,
        [{ text: 'OK' }]
      );
    }
  }, [blockedUsers]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data, including friends, content, and games will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type "DELETE" to confirm account deletion.',
              [{ text: 'Cancel', style: 'cancel' }]
            );
          },
        },
      ]
    );
  }, []);

  const handleDownloadData = useCallback(() => {
    Alert.alert(
      'Download Your Data',
      'We\'ll prepare a copy of all your Loop data. This may take a few minutes. You\'ll receive a notification when it\'s ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Data',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Request Submitted', 'We\'ll notify you when your data is ready to download.');
          },
        },
      ]
    );
  }, []);

  const privacyActions: PrivacyAction[] = [
    {
      id: 'blockedUsers',
      icon: UserX,
      title: 'Blocked Users',
      subtitle: `${blockedUsers.length} blocked`,
      color: colors.error,
      action: handleViewBlockedUsers,
    },
    {
      id: 'downloadData',
      icon: Shield,
      title: 'Download Your Data',
      subtitle: 'Get a copy of your Loop data',
      color: colors.accent.dark,
      action: handleDownloadData,
    },
  ];

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
            Privacy
          </Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Privacy Info */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={[styles.infoContainer, { backgroundColor: colors.accent.DEFAULT + '15' }]}
          >
            <Shield size={24} color={colors.accent.DEFAULT} strokeWidth={2} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.text.DEFAULT }]}>
                Your privacy matters
              </Text>
              <Text style={[styles.infoSubtitle, { color: colors.text.secondary }]}>
                Loop is built for close friends only. Your content is never shared publicly.
              </Text>
            </View>
          </Animated.View>

          {/* Visibility Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
              VISIBILITY
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
            {privacyToggles.map((item, index) => (
              <React.Fragment key={item.id}>
                <PrivacyToggleRow
                  item={item}
                  enabled={preferences[item.id as keyof typeof preferences]}
                  onToggle={handleToggle}
                  index={index}
                />
                {index < privacyToggles.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Data & Safety Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
              DATA & SAFETY
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
            {privacyActions.map((item, index) => (
              <React.Fragment key={item.id}>
                <PrivacyActionRow item={item} index={index} />
                {index < privacyActions.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Danger Zone */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
              DANGER ZONE
            </Text>
          </View>

          <Pressable onPress={handleDeleteAccount}>
            <Animated.View
              entering={FadeInDown.duration(400).delay(600)}
              style={[styles.card, styles.dangerCard, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${colors.error}15` }]}>
                <UserX size={20} color={colors.error} strokeWidth={2} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: colors.error }]}>
                  Delete Account
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.text.tertiary }]}>
                  Permanently delete your account and all data
                </Text>
              </View>
              <ChevronRight size={18} color={colors.error} strokeWidth={2} />
            </Animated.View>
          </Pressable>

          {/* Privacy Policy Link */}
          <Animated.View
            entering={FadeIn.duration(400).delay(700)}
            style={styles.linkContainer}
          >
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                // Open privacy policy
                Alert.alert('Privacy Policy', 'Opening privacy policy...');
              }}
            >
              <Text style={[styles.linkText, { color: colors.primary.DEFAULT }]}>
                Read our Privacy Policy
              </Text>
            </Pressable>
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  linkContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
