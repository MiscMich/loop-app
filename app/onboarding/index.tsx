/**
 * Onboarding Entry Point - Warm Sunrise Welcome
 *
 * Quick, delightful welcome before redirecting to draw screen.
 * Keeps value-first onboarding while adding a premium 2026 touch.
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/stores/authStore';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { colors, gradients, spacing, typography } from '@/lib/theme';

function FloatingParticle({
  delay,
  x,
  y,
  symbol,
}: {
  delay: number;
  x: number;
  y: number;
  symbol: SFSymbol;
}) {
  const reducedMotion = useReducedMotion();
  const floatY = useSharedValue(0);
  const floatX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.6;
      return;
    }

    opacity.value = withDelay(delay, withTiming(0.7, { duration: 300 }));
    floatY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-14, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    floatX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(10, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
          withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, [delay, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: floatX.value }, { translateY: floatY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.particle, { left: x, top: y }, animatedStyle]}
      accessibilityElementsHidden
    >
      <SafeSymbol name={symbol} size={24} tintColor={colors.text.inverse} />
    </Animated.View>
  );
}

export default function OnboardingEntry() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isOnboarded = useAuthStore((state) => state.isOnboarded);
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (isAuthenticated && isOnboarded) {
      router.replace('/(tabs)');
      return;
    }

    if (isAuthenticated && !isOnboarded) {
      router.replace('/onboarding/widget');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const timer = setTimeout(() => {
      router.replace('/onboarding/draw');
    }, 900);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isOnboarded]);

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.04, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const particles = [
    { delay: 150, x: width * 0.2, y: height * 0.25, symbol: 'sparkles' as SFSymbol },
    { delay: 250, x: width * 0.78, y: height * 0.22, symbol: 'sparkles.circle.fill' as SFSymbol },
    { delay: 200, x: width * 0.16, y: height * 0.58, symbol: 'paintpalette.fill' as SFSymbol },
    { delay: 300, x: width * 0.8, y: height * 0.6, symbol: 'heart.fill' as SFSymbol },
  ];

  return (
    <LinearGradient
      colors={gradients.sunrise}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {!reducedMotion && particles.map((p, i) => (
        <FloatingParticle key={i} delay={p.delay} x={p.x} y={p.y} symbol={p.symbol} />
      ))}

      <View style={styles.center}>
        <Animated.View style={[styles.logo, pulseStyle]}>
          <Text style={styles.logoText}>Loop</Text>
        </Animated.View>
        <Animated.Text
          entering={reducedMotion ? undefined : FadeInUp.delay(100).springify()}
          style={styles.title}
        >
          Welcome back to your circle
        </Animated.Text>
        <Animated.Text
          entering={reducedMotion ? undefined : FadeIn.delay(220)}
          style={styles.subtitle}
        >
          Your first doodle is seconds away
        </Animated.Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  logo: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    marginBottom: spacing.lg,
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  logoText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },
  title: {
    fontSize: typography.fontSize.title1,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.DEFAULT,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  particle: {
    position: 'absolute',
    opacity: 0.85,
  },
});
