/**
 * Widget Setup Screen - Optional Widget Installation Guide
 *
 * PRD Flow: This is step 7 (optional, can skip)
 * - User arrives here AFTER value delivery + optional signup
 * - Widget tutorial is deferrable to later
 * - "Skip for now" is prominent option
 * - Consider deferring to Day 1 push notification
 *
 * Design: Clean step-by-step wizard with animated phone mockup
 * Consistent with Warm Sunrise premium aesthetics
 *
 * Best Practices:
 * - Lucide icons (no emojis)
 * - Optimized Zustand selectors
 * - useReducedMotion for accessibility
 * - Spring physics animations
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import {
  Hand,
  Plus,
  Search,
  Maximize2,
  Check,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Image,
  Music,
  Mail,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PressableFeedback } from 'heroui-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { GradientBackground } from '@/components/ui';
import WidgetPreview from '@/components/widget/WidgetPreview';
import { colors as themeColors } from '@/lib/theme';

interface Step {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const buildSteps = (colors: ReturnType<typeof useTheme>['colors']): Step[] => [
  {
    title: 'Long press your homescreen',
    description: 'Hold on an empty area until the apps wiggle',
    icon: Hand,
    color: colors.primary.DEFAULT,
  },
  {
    title: 'Tap the + button',
    description: 'Find it in the top left corner of your screen',
    icon: Plus,
    color: colors.accent.DEFAULT,
  },
  {
    title: 'Search for Loop',
    description: 'Type "Loop" in the widget search bar',
    icon: Search,
    color: colors.accent.dark,
  },
  {
    title: 'Choose a size',
    description: 'We recommend the Medium widget for the best experience',
    icon: Maximize2,
    color: colors.warning,
  },
  {
    title: 'Add it to your homescreen',
    description: 'Tap "Add Widget" and place it wherever you like',
    icon: Check,
    color: colors.success.DEFAULT,
  },
];

// Animated navigation button
function NavButton({
  onPress,
  isComplete,
  label,
  reducedMotion,
}: {
  onPress: () => void;
  isComplete: boolean;
  label: string;
  reducedMotion: boolean;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View style={[styles.nextButtonWrapper, animatedStyle]}>
      <PressableFeedback
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.nextButton,
          { shadowColor: isComplete ? colors.success.DEFAULT : colors.primary.DEFAULT },
        ]}
      >
        <LinearGradient
          colors={
            isComplete
              ? (colors.success.gradient ?? [colors.success.DEFAULT, colors.success.light])
              : (colors.primary.gradient ?? [colors.primary.DEFAULT, colors.primary.light])
          }
          style={styles.nextButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.nextButtonText, { color: colors.text.inverse }]}>
            {isComplete ? "Done! Let's go" : 'Next'}
          </Text>
          <View style={[styles.nextButtonArrow, { backgroundColor: colors.surface.DEFAULT }]}>
            {isComplete ? (
              <Check size={18} color={colors.success.DEFAULT} strokeWidth={2.5} />
            ) : (
              <ArrowRight size={18} color={colors.primary.DEFAULT} strokeWidth={2.5} />
            )}
          </View>
        </LinearGradient>
      </PressableFeedback>
    </Animated.View>
  );
}

export default function WidgetSetupScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const setOnboarded = useAuthStore((state) => state.setOnboarded);
  const reducedMotion = useReducedMotion() ?? false;

  const steps = buildSteps(colors);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const IconComponent = step.icon;

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      Haptics.selectionAsync();
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOnboarded(true);
    router.replace('/(tabs)');
  }, [setOnboarded]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboarded(true);
    router.replace('/(tabs)');
  }, [setOnboarded]);

  return (
    <GradientBackground preset="sunrise" useSafeArea>
      {/* Header - no step indicator, just skip */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <PressableFeedback
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip widget setup"
          accessibilityHint="You can set up the widget later from settings"
          style={[styles.skipButton, { backgroundColor: colors.surface.glassStrong }]}
        >
          <Text style={[styles.skipText, { color: colors.text.secondary }]}>Skip for now</Text>
        </PressableFeedback>
      </View>

      {/* Title Section */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()}
        style={styles.titleSection}
      >
        <Text style={[styles.title, { color: colors.text.DEFAULT }]} accessibilityRole="header">
          Add the widget
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          See your friends right on your homescreen
        </Text>
      </Animated.View>

      {/* Phone Mockup */}
      <View style={styles.mockupSection}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(150).springify()}
          style={[styles.phoneMockupWrapper, { shadowColor: colors.text.DEFAULT }]}
        >
          <View
            style={[
              styles.phoneMockup,
              { width: screenWidth * 0.55, height: screenWidth * 0.75, backgroundColor: themeColors.neutral[900] },
            ]}
          >
            {/* Phone Notch */}
            <View style={styles.notchArea}>
              <View style={[styles.dynamicIsland, { backgroundColor: themeColors.neutral[900] }]} />
            </View>

            {/* Phone Screen */}
            <View style={[styles.phoneScreen, { backgroundColor: themeColors.neutral[800] }]}>
              {/* App Icons Row */}
              <View style={styles.appIconsRow}>
                <View style={[styles.appIcon, { backgroundColor: themeColors.surface.glassTint }]}>
                  <MessageCircle size={20} color={colors.success.DEFAULT} strokeWidth={2} />
                </View>
                <View style={[styles.appIcon, { backgroundColor: themeColors.surface.glassTint }]}>
                  <Image size={20} color={colors.warning} strokeWidth={2} />
                </View>
                <View style={[styles.appIcon, { backgroundColor: themeColors.surface.glassTint }]}>
                  <Music size={20} color={colors.error} strokeWidth={2} />
                </View>
                <View style={[styles.appIcon, { backgroundColor: themeColors.surface.glassTint }]}>
                  <Mail size={20} color={colors.accent.DEFAULT} strokeWidth={2} />
                </View>
              </View>

              {/* Loop Widget */}
              <View style={[styles.widgetFrame, { shadowColor: colors.text.DEFAULT }]}>
                <WidgetPreview
                  themeId="coral"
                  styleId="standard"
                  size="small"
                  friendName="Alex"
                  symbolName="sparkles"
                  note="New from Alex"
                  unreadCount={1}
                  showBrand={false}
                  style={styles.widgetContent}
                />
              </View>
            </View>

            {/* Home Indicator */}
            <View style={[styles.homeIndicator, { backgroundColor: colors.text.inverse }]} />
          </View>
        </Animated.View>

        {/* Step Badge */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(300).springify()}
          style={[styles.stepBadge, { backgroundColor: step.color, shadowColor: colors.text.DEFAULT }]}
        >
          <IconComponent size={28} color={colors.text.inverse} strokeWidth={2.5} />
        </Animated.View>
      </View>

      {/* Step Info */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInUp.delay(200).springify()}
        style={styles.stepInfoSection}
      >
        <Text style={[styles.stepTitle, { color: colors.text.DEFAULT }]}>{step.title}</Text>
        <Text style={[styles.stepDescription, { color: colors.text.secondary }]}>{step.description}</Text>
      </Animated.View>

      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentStep
                ? { backgroundColor: colors.primary.DEFAULT, width: 24 }
                : { backgroundColor: `${colors.text.tertiary}4D` },
              index < currentStep ? { backgroundColor: colors.success.DEFAULT } : null,
            ]}
          />
        ))}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <View style={styles.navRow}>
          {currentStep > 0 ? (
            <PressableFeedback
              onPress={handlePrevious}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={[styles.backButton, { backgroundColor: colors.surface.glassStrong }]}
            >
              <ArrowLeft size={20} color={colors.text.secondary} strokeWidth={2.5} />
            </PressableFeedback>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}

          <NavButton
            onPress={handleNext}
            isComplete={isLastStep}
            label={isLastStep ? 'Complete setup' : 'Next step'}
            reducedMotion={reducedMotion}
          />
        </View>

        {/* Always show skip option */}
        <PressableFeedback
          onPress={handleComplete}
          accessibilityRole="button"
          accessibilityLabel={isLastStep ? "I'll do this later" : "Already added widget"}
          style={styles.alreadyAddedButton}
        >
          <Text style={[styles.alreadyAddedText, { color: colors.primary.DEFAULT }]}>
            {isLastStep ? "I'll set this up later" : "Already added? Skip to app"}
          </Text>
        </PressableFeedback>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Title
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },

  // Mockup
  mockupSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  phoneMockupWrapper: {
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  phoneMockup: {
    borderRadius: 36,
    borderCurve: 'continuous',
    padding: 8,
    overflow: 'hidden',
  },
  notchArea: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  dynamicIsland: {
    width: 80,
    height: 24,
    borderRadius: 12,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 28,
    padding: 16,
  },
  appIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetFrame: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  widgetContent: {
    alignSelf: 'center',
  },
  homeIndicator: {
    alignSelf: 'center',
    width: 100,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    opacity: 0.3,
  },

  // Step Badge
  stepBadge: {
    position: 'absolute',
    bottom: -20,
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },

  // Step Info
  stepInfoSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Progress Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
  },
  dotCompleted: {
  },

  // Navigation
  navigation: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 52,
  },
  nextButtonWrapper: {
    flex: 1,
  },
  nextButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  nextButtonArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alreadyAddedButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  alreadyAddedText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
