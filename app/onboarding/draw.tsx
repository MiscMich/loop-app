/**
 * Draw Screen - Value-First Onboarding Experience
 *
 * PRD Target Flow:
 * 1. Canvas appears IMMEDIATELY (no welcome screen)
 * 2. User draws doodle
 * 3. "Send to friend" -> Enter friend name
 * 4. Celebration! Confetti + haptics
 * 5. Widget preview mockup -> "This is how [friend] will see it"
 * 6. "Save your Loop?" -> Apple Sign In (lazy registration)
 * 7. Widget tutorial (optional, can skip)
 *
 * Goal: Value in <30 seconds (draw + send)
 *
 * Best Practices:
 * - Lucide icons (no emojis)
 * - useReducedMotion for accessibility
 * - Spring physics animations
 * - Proper accessibility labels
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import {
  Check,
  RefreshCw,
  Pencil,
  ArrowRight,
  Send,
  Heart,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PressableFeedback } from 'heroui-native';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

import { DoodleCanvas } from '@/components/DoodleCanvas';
import { GradientBackground } from '@/components/ui';
import WidgetPreview from '@/components/widget/WidgetPreview';
import { useTheme } from '@/providers/ThemeProvider';

// Animated continue button
function ContinueButton({
  onPress,
  disabled,
  reducedMotion,
  label,
  icon: Icon = Send,
}: {
  onPress: () => void;
  disabled: boolean;
  reducedMotion: boolean;
  label: string;
  icon?: React.ComponentType<any>;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const activeColors = (colors.primary.gradient ?? [
    colors.primary.DEFAULT,
    colors.primary.light,
  ]) as readonly [string, string];
  const disabledColors = [
    colors.neutral[300],
    colors.neutral[400],
  ] as readonly [string, string];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View style={[styles.continueButtonWrapper, animatedStyle]}>
      <PressableFeedback
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        isDisabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.continueButton, { shadowColor: colors.primary.DEFAULT }]}
      >
        <LinearGradient
          colors={disabled ? disabledColors : activeColors}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Icon size={20} color={colors.text.inverse} strokeWidth={2.5} />
          <Text style={[styles.continueButtonText, { color: colors.text.inverse }]}>{label}</Text>
          <View style={[styles.continueButtonArrow, { backgroundColor: colors.surface.DEFAULT }]}>
            <ArrowRight size={18} color={disabled ? colors.neutral[500] : colors.primary.DEFAULT} strokeWidth={2.5} />
          </View>
        </LinearGradient>
      </PressableFeedback>
    </Animated.View>
  );
}

// Celebration Modal Component
function CelebrationModal({
  visible,
  friendName,
  onContinue,
  reducedMotion,
}: {
  visible: boolean;
  friendName: string;
  onContinue: () => void;
  reducedMotion: boolean;
}) {
  const { colors } = useTheme();
  const confettiRef = useRef<ConfettiCannon | null>(null);
  const pulseScale = useSharedValue(1);
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    if (visible && !reducedMotion) {
      // Pulse animation for the heart
      pulseScale.value = withSequence(
        withDelay(500, withSpring(1.2, { damping: 8, stiffness: 200 })),
        withSpring(1, { damping: 10, stiffness: 150 })
      );
    }
  }, [visible, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={[styles.modalOverlay, { backgroundColor: `${colors.text.DEFAULT}99` }]}>
        {/* Confetti */}
        {visible && !reducedMotion ? (
          <ConfettiCannon
            ref={confettiRef}
            count={80}
            origin={{ x: screenWidth / 2, y: 0 }}
            autoStart
            fadeOut
            explosionSpeed={400}
            fallSpeed={2500}
            colors={[
              colors.primary.DEFAULT,
              colors.success.DEFAULT,
              colors.accent.DEFAULT,
              colors.warning,
              colors.primary.light,
            ]}
          />
        ) : null}

        <Animated.View
          entering={reducedMotion ? undefined : ZoomIn.springify()}
          style={[styles.modalContent, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}
        >
          {/* Success Icon */}
          <Animated.View style={[styles.celebrationIconWrapper, pulseStyle]}>
            <LinearGradient
              colors={colors.success.gradient ?? [colors.success.DEFAULT, colors.success.light]}
              style={styles.celebrationIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Heart size={48} color={colors.text.inverse} strokeWidth={2.5} fill={colors.text.inverse} />
            </LinearGradient>
          </Animated.View>

          <Animated.Text
            entering={reducedMotion ? undefined : FadeInDown.delay(200).springify()}
            style={[styles.celebrationTitle, { color: colors.text.DEFAULT }]}
          >
            Sent to {friendName}!
          </Animated.Text>

          <Animated.Text
            entering={reducedMotion ? undefined : FadeInDown.delay(300).springify()}
            style={[styles.celebrationSubtitle, { color: colors.text.secondary }]}
          >
            Your doodle is on its way
          </Animated.Text>

          {/* Widget Preview */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(300).springify()}
            style={styles.widgetPreviewContainer}
          >
            <Text style={[styles.widgetPreviewTitle, { color: colors.text.tertiary }]}>
              This is how {friendName} will see it
            </Text>
            <View style={[styles.widgetPreviewCard, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
              <WidgetPreview
                themeId="coral"
                styleId="standard"
                size="medium"
                friendName={friendName}
                symbolName="paintpalette.fill"
                note="New doodle from you"
                unreadCount={1}
              />
            </View>
          </Animated.View>

          {/* Continue to Sign Up CTA */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInUp.delay(600).springify()}
            style={styles.modalButtons}
          >
            <ContinueButton
              onPress={onContinue}
              disabled={false}
              reducedMotion={reducedMotion}
              label="Continue"
              icon={Check}
            />

            <Text style={[styles.signupHint, { color: colors.text.tertiary }]}>
              Sign in to save and send your doodle
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function DrawScreen() {
  const { colors } = useTheme();
  const [doodleData, setDoodleData] = useState<string | null>(null);
  const [friendName, setFriendName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;

  // Called on every stroke - just track the paths
  const handleDoodleChange = useCallback((paths: string) => {
    queueMicrotask(() => {
      setDoodleData(paths);
      try {
        const parsed = JSON.parse(paths);
        setHasDrawn(parsed.length > 0);
      } catch {
        setHasDrawn(false);
      }
    });
  }, []);

  // User taps "Done" to proceed to name input
  const handleDoneTap = useCallback(() => {
    if (!hasDrawn) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowNameInput(true);
  }, [hasDrawn]);

  // User taps "Send to friend" - show celebration
  const handleSendToFriend = useCallback(() => {
    if (!friendName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCelebration(true);
  }, [friendName]);

  // User continues - go to signup (required)
  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCelebration(false);
    router.push({
      pathname: '/onboarding/signup',
      params: {
        doodleData: doodleData || '',
        friendName: friendName.trim(),
      },
    });
  }, [doodleData, friendName]);

  const handleReset = useCallback(() => {
    Haptics.selectionAsync();
    setShowNameInput(false);
    setDoodleData(null);
    setFriendName('');
    setHasDrawn(false);
  }, []);

  return (
    <GradientBackground preset="sunrise" useSafeArea>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Minimal Header - spacer for status bar */}
        <View style={styles.header} />

        {!showNameInput ? (
          <>
            {/* Instructions - minimal, focused */}
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()}
              style={styles.instructionsContainer}
            >
              <Text style={[styles.title, { color: colors.text.DEFAULT }]} accessibilityRole="header">
                Draw something
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                for a friend
              </Text>
            </Animated.View>

            {/* Canvas */}
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(100).springify()}
              style={styles.canvasWrapper}
            >
              <View style={[styles.canvasFrame, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
                <View style={[styles.canvasInner, { backgroundColor: colors.background.secondary }]}>
                  <DoodleCanvas onSave={handleDoodleChange} />
                </View>
                {/* Canvas decoration - corner accent */}
                <View style={[styles.canvasCornerTL, { borderColor: `${colors.primary.DEFAULT}30` }]} />
                <View style={[styles.canvasCornerBR, { borderColor: `${colors.primary.DEFAULT}30` }]} />
              </View>
            </Animated.View>

            {/* Done Button or Hint */}
            <Animated.View
              entering={reducedMotion ? undefined : FadeIn.delay(200)}
              style={styles.hintContainer}
            >
              {hasDrawn ? (
                <PressableFeedback
                  onPress={handleDoneTap}
                  accessibilityRole="button"
                  accessibilityLabel="Done drawing"
                  style={[styles.doneButton, { backgroundColor: colors.primary.DEFAULT, shadowColor: colors.primary.DEFAULT }]}
                >
                  <Check size={18} color={colors.text.inverse} strokeWidth={2.5} />
                  <Text style={[styles.doneButtonText, { color: colors.text.inverse }]}>Done</Text>
                </PressableFeedback>
              ) : (
                <View style={[styles.hintPill, { backgroundColor: colors.surface.glassStrong }]}>
                  <Pencil size={14} color={colors.text.tertiary} strokeWidth={2} />
                  <Text style={[styles.hintText, { color: colors.text.tertiary }]}>Draw with your finger</Text>
                </View>
              )}
            </Animated.View>
          </>
        ) : (
          <View style={styles.nameInputContainer}>
            {/* Name Input State */}
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()}
              style={styles.nameInputContent}
            >
              {/* Success Icon */}
              <View style={[styles.successIconWrapper, { shadowColor: colors.success.DEFAULT }]}>
                <LinearGradient
                  colors={colors.success.gradient ?? [colors.success.DEFAULT, colors.success.light]}
                  style={styles.successIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Check size={40} color={colors.text.inverse} strokeWidth={3} />
                </LinearGradient>
              </View>

              <Text style={[styles.nameInputTitle, { color: colors.text.DEFAULT }]} accessibilityRole="header">
                Nice work!
              </Text>
              <Text style={[styles.nameInputSubtitle, { color: colors.text.secondary }]}>
                Who should see this?
              </Text>

              {/* Friend Name Input */}
              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text.DEFAULT }]}
                    placeholder="Friend's name"
                    placeholderTextColor={colors.text.faint}
                    value={friendName}
                    onChangeText={setFriendName}
                    autoFocus
                    autoCapitalize="words"
                    returnKeyType="send"
                    onSubmitEditing={handleSendToFriend}
                    accessibilityLabel="Friend's name"
                  />
                </View>
                <Text style={[styles.inputHint, { color: colors.text.tertiary }]}>
                  We'll help you invite them later
                </Text>
              </View>

              {/* Send Button */}
              <ContinueButton
                onPress={handleSendToFriend}
                disabled={!friendName.trim()}
                reducedMotion={reducedMotion}
                label="Send to friend"
                icon={Send}
              />

              {/* Draw Again */}
              <PressableFeedback
                onPress={handleReset}
                accessibilityRole="button"
                accessibilityLabel="Draw something else"
                style={styles.resetButton}
              >
                <RefreshCw size={16} color={colors.primary.DEFAULT} strokeWidth={2.5} />
                <Text style={[styles.resetText, { color: colors.primary.DEFAULT }]}>Draw again</Text>
              </PressableFeedback>
            </Animated.View>
          </View>
        )}

        {/* Celebration Modal */}
        <CelebrationModal
          visible={showCelebration}
          friendName={friendName}
          onContinue={handleContinue}
          reducedMotion={reducedMotion}
        />
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header spacer
  header: {
    paddingVertical: 12,
  },

  // Instructions
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '400',
    textAlign: 'center',
  },

  // Canvas
  canvasWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  canvasFrame: {
    flex: 1,
    borderRadius: 28,
    padding: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  canvasInner: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  canvasCornerTL: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  canvasCornerBR: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },

  // Hint
  hintContainer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Name Input State
  nameInputContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  nameInputContent: {
    alignItems: 'center',
  },
  successIconWrapper: {
    marginBottom: 24,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  successIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInputTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  nameInputSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 32,
  },

  // Input
  inputWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  inputContainer: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputHint: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 12,
  },

  // Continue Button
  continueButtonWrapper: {
    width: '100%',
  },
  continueButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  continueButtonArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Reset
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Celebration Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  celebrationIconWrapper: {
    marginBottom: 20,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  celebrationIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  celebrationSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    width: '100%',
    marginTop: 8,
  },
  signupHint: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 16,
  },

  // Widget Preview (shared component)
  widgetPreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  widgetPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  widgetPreviewCard: {
    padding: 12,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
});
