/**
 * Tooltip & FeatureSpotlight - Contextual hints and onboarding spotlights
 *
 * Features:
 * - Tooltip: Small bubble with arrow pointing to target element
 * - FeatureSpotlight: Full-screen overlay with spotlight on target
 * - Persistence via AsyncStorage (show once only)
 * - Warm Sunrise design system (coral accent, warm white backgrounds)
 * - Spring animations with haptic feedback
 */

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  useWindowDimensions,
  LayoutRectangle,
  ViewStyle,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows, animation } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  /** Unique ID for persistence */
  id: string;
  /** The target element to attach the tooltip to */
  children: ReactNode;
  /** Tooltip content text */
  content: string;
  /** Position relative to target */
  position?: TooltipPosition;
  /** Only show once, then dismiss forever */
  showOnce?: boolean;
  /** Delay before showing (ms) */
  delay?: number;
  /** Custom width for the tooltip bubble */
  maxWidth?: number;
}

interface FeatureSpotlightProps {
  /** Unique ID for persistence */
  id: string;
  /** Spotlight title */
  title: string;
  /** Spotlight description */
  description: string;
  /** Optional icon */
  icon?: SFSymbol;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** The target element to spotlight */
  children: ReactNode;
  /** Only show once */
  showOnce?: boolean;
  /** Button text */
  buttonText?: string;
}

interface TooltipState {
  visible: boolean;
  dismissed: boolean;
}

// =============================================================================
// HOOK: useTooltipState
// =============================================================================

/**
 * Hook to manage tooltip visibility with persistence
 */
export function useTooltipState(id: string, showOnce = true) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const checkDismissed = async () => {
      if (showOnce) {
        const key = `tooltip_dismissed_${id}`;
        try {
          const wasDismissed = await AsyncStorage.getItem(key);
          setDismissed(wasDismissed === 'true');
          if (wasDismissed !== 'true') {
            setVisible(true);
          }
        } catch {
          // If storage fails, show the tooltip anyway
          setDismissed(false);
          setVisible(true);
        }
      } else {
        setDismissed(false);
        setVisible(true);
      }
      setLoaded(true);
    };
    checkDismissed();
  }, [id, showOnce]);

  const dismiss = async () => {
    setVisible(false);
    if (showOnce) {
      try {
        await AsyncStorage.setItem(`tooltip_dismissed_${id}`, 'true');
      } catch {
        // Fail silently - tooltip will just show again next time
      }
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const show = () => {
    if (!dismissed || !showOnce) {
      setVisible(true);
    }
  };

  const reset = async () => {
    try {
      await AsyncStorage.removeItem(`tooltip_dismissed_${id}`);
      setDismissed(false);
      setVisible(true);
    } catch {
      // Fail silently
    }
  };

  return {
    visible: loaded && visible && !dismissed,
    dismiss,
    show,
    reset,
    loaded,
  };
}

// =============================================================================
// COMPONENT: Tooltip
// =============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Tooltip - Small bubble with arrow pointing to target element
 */
export function Tooltip({
  id,
  children,
  content,
  position = 'top',
  showOnce = true,
  delay = 500,
  maxWidth = 200,
}: TooltipProps) {
  const { visible, dismiss, loaded } = useTooltipState(id, showOnce);
  const [targetLayout, setTargetLayout] = useState<LayoutRectangle | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  // Delay showing the tooltip
  useEffect(() => {
    if (visible && loaded) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        scale.value = withSpring(1, animation.springs.snappy);
        opacity.value = withTiming(1, { duration: animation.duration.fast });
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
      scale.value = 0.8;
      opacity.value = 0;
    }
  }, [visible, loaded, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleDismiss = () => {
    scale.value = withSpring(0.8, animation.springs.snappy);
    opacity.value = withTiming(0, { duration: animation.duration.fast }, () => {
      runOnJS(dismiss)();
    });
  };

  const handleLayout = (event: { nativeEvent: { layout: LayoutRectangle } }) => {
    setTargetLayout(event.nativeEvent.layout);
  };

  const getTooltipPosition = (): ViewStyle => {
    if (!targetLayout) return {};

    const tooltipOffset = 8;
    const targetCenterX = targetLayout.width / 2;

    switch (position) {
      case 'top':
        return {
          position: 'absolute',
          bottom: targetLayout.height + tooltipOffset,
          left: targetCenterX - maxWidth / 2,
        };
      case 'bottom':
        return {
          position: 'absolute',
          top: targetLayout.height + tooltipOffset,
          left: targetCenterX - maxWidth / 2,
        };
      case 'left':
        return {
          position: 'absolute',
          right: targetLayout.width + tooltipOffset,
          top: 0,
        };
      case 'right':
        return {
          position: 'absolute',
          left: targetLayout.width + tooltipOffset,
          top: 0,
        };
      default:
        return {};
    }
  };

  const getArrowStyle = (): ViewStyle => {
    const arrowSize = 8;
    const baseArrow: ViewStyle = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    switch (position) {
      case 'top':
        return {
          ...baseArrow,
          bottom: -arrowSize,
          alignSelf: 'center',
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: colors.surface.DEFAULT,
        };
      case 'bottom':
        return {
          ...baseArrow,
          top: -arrowSize,
          alignSelf: 'center',
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: colors.surface.DEFAULT,
        };
      case 'left':
        return {
          ...baseArrow,
          right: -arrowSize,
          top: 12,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: colors.surface.DEFAULT,
        };
      case 'right':
        return {
          ...baseArrow,
          left: -arrowSize,
          top: 12,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: colors.surface.DEFAULT,
        };
      default:
        return baseArrow;
    }
  };

  return (
    <View style={styles.tooltipWrapper} onLayout={handleLayout}>
      {children}
      {showTooltip && (
        <AnimatedPressable
          style={[
            styles.tooltipContainer,
            { maxWidth },
            getTooltipPosition(),
            animatedStyle,
          ]}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel={`Tooltip: ${content}. Tap to dismiss.`}
          accessibilityHint="Double tap to dismiss this tooltip"
        >
          <View style={styles.tooltipBubble}>
            <Text style={styles.tooltipText}>{content}</Text>
            <View style={styles.tooltipClose}>
              <SafeSymbol
                name="xmark"
                size={12}
                tintColor={colors.text.tertiary}
              />
            </View>
          </View>
          <View style={getArrowStyle()} />
        </AnimatedPressable>
      )}
    </View>
  );
}

// =============================================================================
// COMPONENT: FeatureSpotlight
// =============================================================================

/**
 * FeatureSpotlight - Full-screen overlay with spotlight on target element
 */
export function FeatureSpotlight({
  id,
  title,
  description,
  icon = 'sparkles' as SFSymbol,
  onDismiss,
  children,
  showOnce = true,
  buttonText = 'Got it',
}: FeatureSpotlightProps) {
  const { visible, dismiss, loaded } = useTooltipState(id, showOnce);
  const [targetLayout, setTargetLayout] = useState<LayoutRectangle | null>(null);
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const targetRef = useRef<View>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && loaded) {
      overlayOpacity.value = withTiming(1, { duration: animation.duration.normal });
      contentScale.value = withSpring(1, animation.springs.responsive);
      contentOpacity.value = withTiming(1, { duration: animation.duration.normal });
    }
  }, [visible, loaded]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
    opacity: contentOpacity.value,
  }));

  const handleDismiss = async () => {
    overlayOpacity.value = withTiming(0, { duration: animation.duration.fast });
    contentScale.value = withSpring(0.9, animation.springs.snappy);
    contentOpacity.value = withTiming(0, { duration: animation.duration.fast });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, animation.duration.fast));
    dismiss();
    onDismiss?.();
  };

  const measureTarget = () => {
    if (targetRef.current) {
      targetRef.current.measureInWindow((x, y, width, height) => {
        setTargetPosition({ x, y });
        setTargetLayout({ x, y, width, height });
      });
    }
  };

  const handleLayout = () => {
    // Small delay to ensure layout is complete
    setTimeout(measureTarget, 100);
  };

  // Calculate spotlight hole position
  const getSpotlightStyle = () => {
    if (!targetLayout) return {};

    const padding = 12;
    return {
      left: targetPosition.x - padding,
      top: targetPosition.y - padding,
      width: targetLayout.width + padding * 2,
      height: targetLayout.height + padding * 2,
      borderRadius: borderRadius.xl,
    };
  };

  // Calculate content card position (below or above spotlight)
  const getContentPosition = () => {
    if (!targetLayout) {
      return { top: screenHeight / 2 - 100 };
    }

    const spotlightBottom = targetPosition.y + targetLayout.height;
    const spaceBelow = screenHeight - spotlightBottom;
    const contentHeight = 180; // Approximate height

    if (spaceBelow > contentHeight + 60) {
      // Position below spotlight
      return { top: spotlightBottom + 24 };
    } else {
      // Position above spotlight
      return { bottom: screenHeight - targetPosition.y + 24 };
    }
  };

  if (!loaded || !visible) {
    return (
      <View ref={targetRef} onLayout={handleLayout}>
        {children}
      </View>
    );
  }

  return (
    <>
      <View ref={targetRef} onLayout={handleLayout}>
        {children}
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleDismiss}
      >
        <Animated.View style={[styles.spotlightOverlay, overlayAnimatedStyle]}>
          {/* Semi-transparent overlay with spotlight hole */}
          <View style={styles.spotlightBackground}>
            {targetLayout && (
              <View style={[styles.spotlightHole, getSpotlightStyle(), { borderWidth: screenWidth }]} />
            )}
          </View>

          {/* Content card */}
          <Animated.View
            style={[
              styles.spotlightContent,
              getContentPosition(),
              contentAnimatedStyle,
            ]}
          >
            {/* Icon */}
            <View style={styles.spotlightIconContainer}>
              <SafeSymbol
                name={icon}
                size={28}
                tintColor={colors.primary.DEFAULT}
              />
            </View>

            {/* Title */}
            <Text style={styles.spotlightTitle}>{title}</Text>

            {/* Description */}
            <Text style={styles.spotlightDescription}>{description}</Text>

            {/* Dismiss button */}
            <Pressable
              style={({ pressed }) => [
                styles.spotlightButton,
                pressed && styles.spotlightButtonPressed,
              ]}
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel={buttonText}
            >
              <Text style={styles.spotlightButtonText}>{buttonText}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Tooltip styles
  tooltipWrapper: {
    position: 'relative',
  },

  tooltipContainer: {
    position: 'absolute',
    zIndex: 1000,
  },

  tooltipBubble: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingRight: spacing.lg + spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
    // React Native shadow (NOT CSS boxShadow!)
    ...shadows.md,
  },

  tooltipText: {
    fontSize: typography.fontSize.footnote,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.DEFAULT,
    lineHeight: typography.fontSize.footnote * typography.lineHeight.normal,
  },

  tooltipClose: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FeatureSpotlight styles
  spotlightOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  spotlightBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 46, 0.75)',
  },

  spotlightHole: {
    position: 'absolute',
    backgroundColor: 'transparent',
    // Create the "hole" effect with a border (borderWidth applied dynamically)
    borderColor: 'rgba(26, 26, 46, 0.75)',
    // Note: This is a simplified approach. For a true spotlight effect,
    // you might want to use a masked view or SVG
  },

  spotlightContent: {
    position: 'absolute',
    left: spacing.screenHorizontal,
    right: spacing.screenHorizontal,
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    alignItems: 'center',
    // React Native shadow
    ...shadows.float,
  },

  spotlightIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  spotlightTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.DEFAULT,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: typography.letterSpacing.tight,
  },

  spotlightDescription: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    marginBottom: spacing.lg,
  },

  spotlightButton: {
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.pill,
    minWidth: 140,
    alignItems: 'center',
    // Coral glow shadow
    ...shadows.primaryGlow,
  },

  spotlightButtonPressed: {
    backgroundColor: colors.primary.dark,
    transform: [{ scale: 0.98 }],
  },

  spotlightButtonText: {
    fontSize: typography.fontSize.callout,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
    letterSpacing: typography.letterSpacing.wide,
  },
});

// =============================================================================
// EXPORTS
// =============================================================================

export default Tooltip;
