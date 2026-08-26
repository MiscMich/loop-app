/**
 * AnimatedBackground - 2026 Sleek Animated Background
 * Flowing gradients, floating orbs, and glassmorphism-ready
 * Inspired by iOS 26 Liquid Glass aesthetic
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  useReducedMotion,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Theme colors from design system
const COLORS = {
  primary: '#FF6B6B',
  primaryLight: '#FF8E8E',
  accent: '#A1A8EA',
  accentDark: '#8289D8',
  success: '#97DC38',
  gold: '#FFB347',
  background: '#FFFBF7',
  backgroundSecondary: '#FFF5EE',
};

interface FloatingOrbProps {
  size: number;
  color: string;
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
}

/**
 * Floating Orb - Soft glowing circle that floats around
 */
function FloatingOrb({ size, color, initialX, initialY, duration, delay }: FloatingOrbProps) {
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (reducedMotion) return;

    // Horizontal floating
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(-30, { duration: duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Vertical floating
    translateY.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(-25, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(25, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Subtle pulsing
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Breathing opacity
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: initialX,
          top: initialY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        // Soft glow effect
        Platform.OS === 'ios' && {
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: size / 3,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Gradient Wave - Animated gradient that shifts colors
 */
function GradientWave() {
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;

    // Slow rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );

    // Subtle breathing
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.gradientWaveContainer, animatedStyle]}>
      <LinearGradient
        colors={[
          'rgba(255, 107, 107, 0.15)',  // Coral
          'rgba(161, 168, 234, 0.15)',  // Lavender
          'rgba(151, 220, 56, 0.1)',    // Lime
          'rgba(255, 179, 71, 0.12)',   // Gold
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientWave}
      />
    </Animated.View>
  );
}

interface AnimatedBackgroundProps {
  variant?: 'default' | 'subtle' | 'vibrant';
  children?: React.ReactNode;
  showOrbs?: boolean;
  showWave?: boolean;
  blur?: boolean;
}

/**
 * AnimatedBackground - Main component
 *
 * @param variant - 'default' | 'subtle' | 'vibrant'
 * @param showOrbs - Show floating orbs (default: true)
 * @param showWave - Show gradient wave (default: true)
 * @param blur - Add blur overlay for glassmorphism (default: false)
 */
export function AnimatedBackground({
  variant = 'default',
  children,
  showOrbs = true,
  showWave = true,
  blur = false,
}: AnimatedBackgroundProps) {
  const reducedMotion = useReducedMotion();

  // Orb configurations based on variant
  const orbConfigs = {
    default: [
      { size: 180, color: COLORS.primary, initialX: -40, initialY: 100, duration: 6000, delay: 0 },
      { size: 140, color: COLORS.accent, initialX: SCREEN_WIDTH - 100, initialY: 200, duration: 7000, delay: 1000 },
      { size: 100, color: COLORS.success, initialX: 60, initialY: SCREEN_HEIGHT - 300, duration: 5500, delay: 500 },
      { size: 120, color: COLORS.gold, initialX: SCREEN_WIDTH - 150, initialY: SCREEN_HEIGHT - 400, duration: 6500, delay: 1500 },
    ],
    subtle: [
      { size: 200, color: COLORS.accent, initialX: -60, initialY: 150, duration: 8000, delay: 0 },
      { size: 160, color: COLORS.primaryLight, initialX: SCREEN_WIDTH - 120, initialY: 300, duration: 9000, delay: 2000 },
    ],
    vibrant: [
      { size: 200, color: COLORS.primary, initialX: -50, initialY: 80, duration: 5000, delay: 0 },
      { size: 160, color: COLORS.accent, initialX: SCREEN_WIDTH - 100, initialY: 150, duration: 5500, delay: 500 },
      { size: 130, color: COLORS.success, initialX: 30, initialY: SCREEN_HEIGHT - 350, duration: 4500, delay: 300 },
      { size: 150, color: COLORS.gold, initialX: SCREEN_WIDTH - 130, initialY: SCREEN_HEIGHT - 450, duration: 5200, delay: 800 },
      { size: 100, color: COLORS.accentDark, initialX: SCREEN_WIDTH / 2 - 50, initialY: SCREEN_HEIGHT / 2, duration: 6000, delay: 1200 },
    ],
  };

  const orbs = orbConfigs[variant];

  // Background gradient colors based on variant
  const gradientColors: readonly [string, string, ...string[]] = {
    default: [COLORS.background, COLORS.backgroundSecondary, '#FFF0E8'] as const,
    subtle: [COLORS.background, '#FFFAF5', COLORS.background] as const,
    vibrant: ['#FFF5EE', '#FFE8E8', '#F0F0FF'] as const,
  }[variant];

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated gradient wave */}
      {showWave && !reducedMotion && <GradientWave />}

      {/* Floating orbs */}
      {showOrbs && !reducedMotion && orbs.map((orb, index) => (
        <FloatingOrb key={index} {...orb} />
      ))}

      {/* Optional blur overlay for glassmorphism */}
      {blur && Platform.OS === 'ios' && (
        <BlurView
          intensity={20}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Content */}
      {children}
    </View>
  );
}

/**
 * AnimatedGradientBorder - Animated border effect
 * Use for cards or buttons that need extra visual flair
 */
export function AnimatedGradientBorder({
  children,
  borderRadius = 24,
  borderWidth = 2,
}: {
  children: React.ReactNode;
  borderRadius?: number;
  borderWidth?: number;
}) {
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;

    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, [reducedMotion]);

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.borderContainer, { borderRadius, padding: borderWidth }]}>
      <Animated.View style={[styles.animatedBorderGradient, animatedGradientStyle]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.accent, COLORS.success, COLORS.gold, COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <View style={[styles.borderContent, { borderRadius: borderRadius - borderWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  gradientWaveContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2,
    height: SCREEN_HEIGHT * 2,
    left: -SCREEN_WIDTH / 2,
    top: -SCREEN_HEIGHT / 2,
  },
  gradientWave: {
    flex: 1,
    borderRadius: SCREEN_WIDTH,
  },
  borderContainer: {
    overflow: 'hidden',
  },
  animatedBorderGradient: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    left: '-50%',
    top: '-50%',
  },
  borderContent: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
});

export default AnimatedBackground;
