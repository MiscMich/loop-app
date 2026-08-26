/**
 * Mood Screen - Two-Step Mood Sharing
 *
 * Step 1: Pick your mood icon
 * Step 2: Select which friends to send it to
 *
 * This clarifies the UX: "Who will see my mood?"
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Smile, ArrowLeft, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated';

import { MoodPicker } from '@/components/MoodPicker';
import { FriendSelector } from '@/components/FriendSelector';
import { ErrorState, ErrorBanner } from '@/components/states';
import { useContentStore , useAuthStore } from '@/stores';
import { createScreenLogger, getUserFriendlyMessage, ErrorCodes } from '@/lib/logger';
import { useFriendsStore } from '@/stores/friendsStore';
import { useTheme } from '@/providers/ThemeProvider';
import { colors as themeColors, spacing, typography, borderRadius } from '@/lib/theme';
import { playSound } from '@/lib/sounds';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { resolveMoodSymbol } from '@/lib/iconTokens';

type Step = 'pick-mood' | 'select-friends';

interface SelectedMood {
  emoji: string;
  note?: string;
}

// Screen-specific logger
const log = createScreenLogger('MoodScreen');

export default function MoodScreen() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion() ?? false;

  // State
  const [step, setStep] = useState<Step>('pick-mood');
  const [selectedMood, setSelectedMood] = useState<SelectedMood | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store selectors
  const addToSent = useContentStore((state) => state.addToSent);
  const setCurrentMood = useContentStore((state) => state.setCurrentMood);
  const user = useAuthStore((state) => state.user);
  const friends = useFriendsStore((state) => state.friends);

  // Handle mood selection (Step 1 -> Step 2)
  const handleMoodSelect = useCallback((emoji: string, note?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSound('pop', 0.4);
    setSelectedMood({ emoji, note });
    setStep('select-friends');
  }, []);

  // Handle friend selection and send (Step 2 -> Done)
  const handleFriendsSelect = useCallback(async (friendIds: string[]) => {
    if (!selectedMood || friendIds.length === 0 || !user) return;

    setIsSending(true);
    setError(null);
    log.action('send_mood', { emoji: selectedMood.emoji, recipientCount: friendIds.length });

    try {
      // Create mood content for each selected friend
      for (const friendId of friendIds) {
        const friend = friends.find((f) => f.id === friendId);
        const moodContent = {
          id: `mood_${Date.now()}_${friendId}`,
          type: 'mood' as const,
          senderId: user.id,
          senderName: user.displayName,
          senderAvatar: user.avatarUrl,
          recipientId: friendId,
          recipientName: friend?.displayName,
          createdAt: new Date().toISOString(),
          reactions: [],
          emoji: selectedMood.emoji,
          note: selectedMood.note,
        };

        addToSent(moodContent);
      }

      // Set as current mood
      setCurrentMood({
        id: `mood_${Date.now()}`,
        type: 'mood' as const,
        senderId: user.id,
        senderName: user.displayName,
        senderAvatar: user.avatarUrl,
        recipientId: friendIds[0],
        createdAt: new Date().toISOString(),
        reactions: [],
        emoji: selectedMood.emoji,
        note: selectedMood.note,
      });

      log.info('Mood sent successfully', { emoji: selectedMood.emoji, recipientCount: friendIds.length });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound('send', 0.5);
      router.back();
    } catch (err) {
      log.error('Failed to send mood', err);
      setError(getUserFriendlyMessage(ErrorCodes.SEND_FAILED));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSending(false);
    }
  }, [selectedMood, user, friends, addToSent, setCurrentMood]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    if (step === 'select-friends') {
      setStep('pick-mood');
    } else {
      router.back();
    }
  }, [step]);

  const handleClose = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, []);

  // Auth check - must be after all hooks
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}>
        <ErrorState
          type="generic"
          title="Sign In Required"
          message="Please sign in to share your mood with friends."
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
          accessibilityLabel={step === 'select-friends' ? 'Go back to mood selection' : 'Close'}
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
            style={[styles.headerIcon, { backgroundColor: themeColors.warning }]}
          >
            <Smile size={16} color={colors.text.inverse} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
            {step === 'pick-mood' ? 'Set Mood' : 'Send to Friends'}
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
                step === 'pick-mood'
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
                step === 'pick-mood'
                  ? colors.text.DEFAULT
                  : colors.text.tertiary,
            },
          ]}
        >
          Pick Mood
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
      {step === 'pick-mood' ? (
        <Animated.View
          key="pick-mood"
          entering={reducedMotion ? undefined : FadeInDown.springify()}
          exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          style={styles.content}
        >
          <MoodPicker onSelect={handleMoodSelect} />
        </Animated.View>
      ) : (
        <Animated.View
          key="select-friends"
          entering={reducedMotion ? undefined : FadeInDown.springify()}
          exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          style={styles.content}
        >
          {/* Show selected mood */}
          {selectedMood && (
            <View style={styles.selectedMoodPreview}>
              <SafeSymbol
                name={resolveMoodSymbol(selectedMood.emoji)}
                size={52}
                tintColor={colors.primary.DEFAULT}
              />
              <Text style={[styles.selectedMoodText, { color: colors.text.secondary }]}>
                {selectedMood.note || 'Your mood is ready to share!'}
              </Text>
            </View>
          )}

          <FriendSelector
            onSelect={handleFriendsSelect}
            onCancel={handleBack}
            contentType="mood"
            title="Who should see this?"
            subtitle="They'll see your mood on their home widget"
            isLoading={isSending}
          />
        </Animated.View>
      )}
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
    gap: 60,
    marginBottom: spacing.md,
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
  selectedMoodPreview: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.separator,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  selectedMoodEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  selectedMoodText: {
    fontSize: typography.fontSize.subheadline,
  },
});
