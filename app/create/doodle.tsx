/**
 * Doodle Screen - Two-Step Doodle Sharing
 *
 * Step 1: Draw your doodle
 * Step 2: Select which friends to send it to
 *
 * This clarifies the UX: "Who will see my doodle?"
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Brush, Fingerprint, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated';

import { DoodleCanvas } from '@/components/DoodleCanvas';
import { FriendSelector } from '@/components/FriendSelector';
import { ErrorState, ErrorBanner } from '@/components/states';
import { useContentStore , useAuthStore } from '@/stores';
import { createScreenLogger, getUserFriendlyMessage, ErrorCodes } from '@/lib/logger';
import { useFriendsStore } from '@/stores/friendsStore';
import { useTheme } from '@/providers/ThemeProvider';
import { colors as themeColors, spacing, typography, borderRadius } from '@/lib/theme';
import { playSound } from '@/lib/sounds';

type Step = 'draw' | 'select-friends';

interface SavedDoodle {
  paths: string;
  imageBase64: string;
}

// Screen-specific logger
const log = createScreenLogger('DoodleScreen');

export default function DoodleScreen() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion() ?? false;

  // State
  const [step, setStep] = useState<Step>('draw');
  const [paths, setPaths] = useState<string>('[]');
  const [savedDoodle, setSavedDoodle] = useState<SavedDoodle | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store selectors
  const addToSent = useContentStore((state) => state.addToSent);
  const user = useAuthStore((state) => state.user);
  const friends = useFriendsStore((state) => state.friends);

  // Save paths as user draws
  const handleSave = useCallback((newPaths: string) => {
    setPaths(newPaths);
  }, []);

  // When user taps checkmark, export and move to step 2
  const handleExport = useCallback(async (imageBase64: string) => {
    setError(null);

    if (paths === '[]') {
      log.warn('Attempted to export empty canvas');
      setError(getUserFriendlyMessage(ErrorCodes.CONTENT_EMPTY, 'Draw something first!'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    log.action('export_doodle', { pathCount: JSON.parse(paths).length });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSound('success', 0.4);
    setSavedDoodle({ paths, imageBase64 });
    setStep('select-friends');
  }, [paths]);

  // Handle friend selection and send
  const handleFriendsSelect = useCallback(async (friendIds: string[]) => {
    if (!savedDoodle || friendIds.length === 0 || !user) return;

    setIsSending(true);
    setError(null);
    log.action('send_doodle', { recipientCount: friendIds.length });

    try {
      // Create doodle content for each selected friend
      for (const friendId of friendIds) {
        const friend = friends.find((f) => f.id === friendId);
        const doodleContent = {
          id: `doodle_${Date.now()}_${friendId}`,
          type: 'doodle' as const,
          senderId: user.id,
          senderName: user.displayName,
          senderAvatar: user.avatarUrl,
          recipientId: friendId,
          recipientName: friend?.displayName,
          createdAt: new Date().toISOString(),
          reactions: [],
          imageUrl: `data:image/png;base64,${savedDoodle.imageBase64}`,
          paths: savedDoodle.paths,
        };

        addToSent(doodleContent);
      }

      log.info('Doodle sent successfully', { recipientCount: friendIds.length });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound('send', 0.5);
      router.back();
    } catch (err) {
      log.error('Failed to send doodle', err);
      setError(getUserFriendlyMessage(ErrorCodes.SEND_FAILED));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSending(false);
    }
  }, [savedDoodle, user, friends, addToSent]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    if (step === 'select-friends') {
      setStep('draw');
      setSavedDoodle(null);
    } else {
      // Check if user has drawn something
      if (paths !== '[]') {
        Alert.alert(
          'Discard doodle?',
          'Your drawing will be lost.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: () => router.back() },
          ]
        );
      } else {
        router.back();
      }
    }
  }, [step, paths]);

  // Auth check - must be after all hooks
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}>
        <ErrorState
          type="generic"
          title="Sign In Required"
          message="Please sign in to share doodles with friends."
          onRetry={() => router.back()}
          retryLabel="Go Back"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.DEFAULT }]}
      edges={['top']}
    >
      {/* Header */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeIn.duration(300)}
        style={styles.header}
      >
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={step === 'select-friends' ? 'Go back to drawing' : 'Close'}
          style={[styles.headerButton, { backgroundColor: colors.background.secondary }]}
        >
          {step === 'select-friends' ? (
            <ArrowLeft size={22} color={colors.text.DEFAULT} />
          ) : (
            <X size={22} color={colors.text.DEFAULT} />
          )}
        </Pressable>

        <View style={styles.headerCenter}>
          <View
            style={[styles.headerIcon, { backgroundColor: themeColors.primary.DEFAULT }]}
          >
            <Brush size={16} color={colors.text.inverse} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
            {step === 'draw' ? 'Draw' : 'Send to Friends'}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View
          style={[
            styles.stepDot,
            {
              backgroundColor:
                step === 'draw'
                  ? colors.primary.DEFAULT
                  : colors.success.DEFAULT,
            },
          ]}
        />
        <View
          style={[
            styles.stepLine,
            {
              backgroundColor:
                step === 'select-friends'
                  ? colors.success.DEFAULT
                  : colors.separator,
            },
          ]}
        />
        <View
          style={[
            styles.stepDot,
            {
              backgroundColor:
                step === 'select-friends'
                  ? colors.primary.DEFAULT
                  : colors.separator,
            },
          ]}
        />
      </View>
      <View style={styles.stepLabels}>
        <Text
          style={[
            styles.stepLabel,
            {
              color:
                step === 'draw'
                  ? colors.text.DEFAULT
                  : colors.text.tertiary,
            },
          ]}
        >
          Draw
        </Text>
        <Text
          style={[
            styles.stepLabel,
            {
              color:
                step === 'select-friends'
                  ? colors.text.DEFAULT
                  : colors.text.tertiary,
            },
          ]}
        >
          Send to Friends
        </Text>
      </View>

      {/* Error Banner */}
      {error ? (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
          style={styles.errorBanner}
        />
      ) : null}

      {/* Step Content */}
      {step === 'draw' ? (
        <Animated.View
          key="draw"
          entering={reducedMotion ? undefined : FadeIn}
          exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          style={styles.content}
        >
          {/* Canvas */}
        <View
          style={[
            styles.canvasContainer,
            { backgroundColor: colors.surface?.DEFAULT || colors.background.pure },
          ]}
        >
            <DoodleCanvas onSave={handleSave} onExport={handleExport} />
          </View>

          {/* Hint */}
          <View style={styles.hintContainer}>
            <View style={[styles.hintIcon, { backgroundColor: themeColors.primary.DEFAULT }]}>
              <Fingerprint size={14} color={colors.text.inverse} />
            </View>
            <Text style={[styles.hintText, { color: colors.text.tertiary }]}>
              Draw with your finger, tap ✓ when done
            </Text>
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          key="select-friends"
          entering={reducedMotion ? undefined : FadeInDown.springify()}
          exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          style={styles.content}
        >
          {/* Show doodle preview */}
          {savedDoodle && (
            <View style={styles.doodlePreview}>
              <Image
                source={{ uri: `data:image/png;base64,${savedDoodle.imageBase64}` }}
                style={[
                  styles.doodleImage,
                  { backgroundColor: colors.surface?.DEFAULT || colors.background.pure },
                ]}
                resizeMode="contain"
              />
              <Text style={[styles.previewText, { color: colors.text.secondary }]}>
                Your doodle is ready to share!
              </Text>
            </View>
          )}

          <FriendSelector
            onSelect={handleFriendsSelect}
            onCancel={handleBack}
            contentType="doodle"
            title="Who should see this?"
            subtitle="Your doodle will appear on their widget"
            isLoading={isSending}
          />
        </Animated.View>
      )}

      {/* Loading Overlay */}
      {isSending ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.loadingOverlay}
        >
          <View style={[styles.loadingCard, { backgroundColor: colors.background.secondary }]}>
            <ActivityIndicator size="large" color={themeColors.primary.DEFAULT} />
            <Text style={[styles.loadingText, { color: colors.text.DEFAULT }]}>
              Sending doodle...
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.semibold,
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 60,
    height: 2,
    marginHorizontal: spacing.xs,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 80,
    marginBottom: spacing.sm,
  },
  stepLabel: {
    fontSize: typography.fontSize.caption1,
    fontWeight: typography.fontWeight.medium,
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
    margin: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  hintIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: typography.fontSize.caption1,
  },
  doodlePreview: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.separator,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  doodleImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  previewText: {
    fontSize: typography.fontSize.subheadline,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
});
