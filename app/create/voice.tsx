/**
 * Voice Screen - Two-Step Voice Note Sharing
 *
 * Step 1: Record your voice note (10s max)
 * Step 2: Select which friends to send it to
 *
 * This clarifies the UX: "Who will hear my voice note?"
 */

import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Mic, ArrowLeft, Play, Pause } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AudioModule } from 'expo-audio';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated';

import { VoiceRecorder } from '@/components/VoiceRecorder';
import { FriendSelector } from '@/components/FriendSelector';
import { useContentStore , useAuthStore } from '@/stores';
import { useFriendsStore } from '@/stores/friendsStore';
import { useTheme } from '@/providers/ThemeProvider';
import { colors as themeColors, spacing, typography, borderRadius } from '@/lib/theme';
import { ErrorState, PermissionError, ErrorBanner } from '@/components/states';
import { createScreenLogger, getUserFriendlyMessage, ErrorCodes } from '@/lib/logger';

type Step = 'record' | 'select-friends';

interface SavedVoiceNote {
  uri: string;
  duration: number;
  waveform: number[];
}

// Screen-specific logger
const log = createScreenLogger('VoiceScreen');

export default function VoiceScreen() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion() ?? false;

  // State
  const [step, setStep] = useState<Step>('record');
  const [savedVoiceNote, setSavedVoiceNote] = useState<SavedVoiceNote | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [error, setError] = useState<string | null>(null);

  // Store selectors
  const addToSent = useContentStore((state) => state.addToSent);
  const user = useAuthStore((state) => state.user);
  const friends = useFriendsStore((state) => state.friends);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.getRecordingPermissionsAsync();
      setPermissionStatus(status.granted ? 'granted' : status.canAskAgain ? 'undetermined' : 'denied');
    })();
  }, []);

  // When recording is complete, move to step 2
  const handleRecordComplete = useCallback(
    (uri: string, duration: number, waveform: number[]) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSavedVoiceNote({ uri, duration, waveform });
      setStep('select-friends');
    },
    []
  );

  // Handle friend selection and send
  const handleFriendsSelect = useCallback(async (friendIds: string[]) => {
    if (!savedVoiceNote || !user || friendIds.length === 0) return;

    setIsSending(true);
    setError(null);
    log.action('send_voice_note', { duration: savedVoiceNote.duration, recipientCount: friendIds.length });

    try {
      // Create voice content for each selected friend
      for (const friendId of friendIds) {
        const friend = friends.find((f) => f.id === friendId);
        const voiceContent = {
          id: `voice_${Date.now()}_${friendId}`,
          type: 'voice' as const,
          senderId: user.id,
          senderName: user.displayName,
          senderAvatar: user.avatarUrl,
          recipientId: friendId,
          recipientName: friend?.displayName,
          createdAt: new Date().toISOString(),
          reactions: [],
          audioUrl: savedVoiceNote.uri,
          duration: savedVoiceNote.duration,
          waveform: savedVoiceNote.waveform,
        };

        addToSent(voiceContent);
      }

      log.info('Voice note sent successfully', { duration: savedVoiceNote.duration, recipientCount: friendIds.length });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      log.error('Failed to send voice note', err);
      setError(getUserFriendlyMessage(ErrorCodes.SEND_FAILED));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSending(false);
    }
  }, [savedVoiceNote, user, friends, addToSent]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    if (step === 'select-friends') {
      setStep('record');
      setSavedVoiceNote(null);
    } else {
      router.back();
    }
  }, [step]);

  const handleClose = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, []);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Permission denied state
  if (permissionStatus === 'denied') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.DEFAULT }]}
        edges={['top']}
      >
        <PermissionError permissionType="microphone" />
      </SafeAreaView>
    );
  }

  // Auth check
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}>
        <ErrorState
          type="generic"
          title="Sign In Required"
          message="Please sign in to send voice notes to friends."
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
          accessibilityLabel={step === 'select-friends' ? 'Go back to recording' : 'Close'}
          style={[styles.headerButton, { backgroundColor: colors.background.secondary }]}
        >
          {step === 'select-friends' ? (
            <ArrowLeft size={22} color={colors.text.DEFAULT} />
          ) : (
            <X size={22} color={colors.text.DEFAULT} />
          )}
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: colors.accent.dark }]}>
            <Mic size={16} color={colors.text.inverse} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
            {step === 'record' ? 'Voice Note' : 'Send to Friends'}
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
                step === 'record'
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
                step === 'record'
                  ? colors.text.DEFAULT
                  : colors.text.tertiary,
            },
          ]}
        >
          Record
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
      {step === 'record' ? (
        <Animated.View
          key="record"
          entering={reducedMotion ? undefined : FadeInDown.springify()}
          exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          style={styles.content}
        >
          <VoiceRecorder
            onRecordComplete={handleRecordComplete}
            onCancel={handleClose}
          />
        </Animated.View>
      ) : (
        <Animated.View
          key="select-friends"
          entering={reducedMotion ? undefined : FadeInDown.springify()}
          exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          style={styles.content}
        >
          {/* Show voice note preview */}
          {savedVoiceNote && (
            <View style={styles.voicePreview}>
              <View style={[styles.voiceIcon, { backgroundColor: colors.accent.dark }]}>
                <Mic size={24} color={colors.text.inverse} />
              </View>
              <View style={styles.voiceInfo}>
                <Text style={[styles.voiceTitle, { color: colors.text.DEFAULT }]}>
                  Voice note ready!
                </Text>
                <Text style={[styles.voiceDuration, { color: colors.text.secondary }]}>
                  {formatDuration(savedVoiceNote.duration)} • Tap to preview
                </Text>
              </View>
              {/* Waveform visualization */}
              <View style={styles.waveformContainer}>
                {savedVoiceNote.waveform.slice(0, 20).map((amplitude, index) => (
                  <View
                    key={index}
                    style={[
                      styles.waveformBar,
                      {
                        height: Math.max(4, amplitude * 30),
                        backgroundColor: colors.primary.DEFAULT,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          <FriendSelector
            onSelect={handleFriendsSelect}
            onCancel={handleBack}
            contentType="voice"
            title="Who should hear this?"
            subtitle="They can play your voice note from their widget"
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
              Sending voice note...
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
  voicePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.separator,
    marginBottom: spacing.sm,
  },
  voiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  voiceTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  voiceDuration: {
    fontSize: typography.fontSize.caption1,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
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
