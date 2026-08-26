/**
 * LoopLogo - Programmatic Logo Component
 * 2026 iOS Liquid Glass inspired design
 * Two intertwined rings forming an infinity-like loop
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Path,
  G,
  Filter,
  FeGaussianBlur,
  FeOffset,
  FeMerge,
  FeMergeNode,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Design system colors
const COLORS = {
  primary: '#FF6B6B',
  primaryLight: '#FF8E8E',
  accent: '#A1A8EA',
  accentDark: '#8289D8',
  success: '#97DC38',
  white: '#FFFFFF',
  warmWhite: '#FFFBF7',
};

interface LoopLogoProps {
  size?: number;
  variant?: 'default' | 'monochrome' | 'gradient' | 'glass';
  animated?: boolean;
  color?: string;
}

/**
 * LoopLogo - Main logo component
 *
 * Variants:
 * - default: Coral to lavender gradient
 * - monochrome: Single color (customizable)
 * - gradient: Full rainbow gradient
 * - glass: iOS 26 Liquid Glass style with transparency
 */
export function LoopLogo({
  size = 100,
  variant = 'default',
  animated = false,
  color = COLORS.primary,
}: LoopLogoProps) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animated && !reducedMotion;

  // Animation values
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (!shouldAnimate) return;

    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, [shouldAnimate]);

  // The logo is two interlocking rings forming an infinity/loop shape
  const strokeWidth = size * 0.12;
  const ringRadius = size * 0.28;
  const centerY = size / 2;
  const leftCenterX = size * 0.35;
  const rightCenterX = size * 0.65;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Primary gradient (Coral to Lavender) */}
          <LinearGradient id="gradientDefault" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.primary} />
            <Stop offset="50%" stopColor={COLORS.primaryLight} />
            <Stop offset="100%" stopColor={COLORS.accent} />
          </LinearGradient>

          {/* Full spectrum gradient */}
          <LinearGradient id="gradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.primary} />
            <Stop offset="25%" stopColor={COLORS.accent} />
            <Stop offset="50%" stopColor={COLORS.success} />
            <Stop offset="75%" stopColor="#FFB347" />
            <Stop offset="100%" stopColor={COLORS.primary} />
          </LinearGradient>

          {/* Glass effect gradient */}
          <LinearGradient id="gradientGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <Stop offset="50%" stopColor="rgba(255, 255, 255, 0.6)" />
            <Stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
          </LinearGradient>

          {/* Inner glow for glass effect */}
          <LinearGradient id="innerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={COLORS.accent} stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {/* Background circle for glass variant */}
        {variant === 'glass' && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 2}
            fill="url(#gradientGlass)"
          />
        )}

        {/* Left ring */}
        <Circle
          cx={leftCenterX}
          cy={centerY}
          r={ringRadius}
          fill="none"
          stroke={getStrokeColor(variant, color)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={variant === 'glass' ? 0.9 : 1}
        />

        {/* Right ring */}
        <Circle
          cx={rightCenterX}
          cy={centerY}
          r={ringRadius}
          fill="none"
          stroke={getStrokeColor(variant, color)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={variant === 'glass' ? 0.9 : 1}
        />

        {/* Intersection overlay for depth (glass variant) */}
        {variant === 'glass' && (
          <>
            {/* Specular highlight - top */}
            <Path
              d={`M ${size * 0.3} ${size * 0.25}
                  Q ${size * 0.5} ${size * 0.15}, ${size * 0.7} ${size * 0.25}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth={strokeWidth * 0.3}
              strokeLinecap="round"
            />
          </>
        )}
      </Svg>
    </View>
  );
}

function getStrokeColor(variant: string, color: string): string {
  switch (variant) {
    case 'default':
      return 'url(#gradientDefault)';
    case 'gradient':
      return 'url(#gradientFull)';
    case 'glass':
      return 'url(#innerGlow)';
    case 'monochrome':
    default:
      return color;
  }
}

/**
 * LoopLogoMark - Simplified mark version for small sizes
 * Single continuous loop path
 */
export function LoopLogoMark({
  size = 48,
  color = COLORS.primary,
}: {
  size?: number;
  color?: string;
}) {
  const strokeWidth = size * 0.15;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="markGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={COLORS.primary} />
          <Stop offset="100%" stopColor={COLORS.accent} />
        </LinearGradient>
      </Defs>

      {/* Infinity-like loop path */}
      <Path
        d="M 12 24
           C 12 16, 20 16, 24 24
           C 28 32, 36 32, 36 24
           C 36 16, 28 16, 24 24
           C 20 32, 12 32, 12 24"
        fill="none"
        stroke="url(#markGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * LoopAppIcon - Full app icon with background
 * Ready for export at 1024x1024
 */
export function LoopAppIcon({
  size = 1024,
  showBackground = true,
}: {
  size?: number;
  showBackground?: boolean;
}) {
  const iconSize = size * 0.6; // Logo takes 60% of the icon
  const padding = (size - iconSize) / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        {/* Background gradient */}
        <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={COLORS.warmWhite} />
          <Stop offset="50%" stopColor="#FFE8E8" />
          <Stop offset="100%" stopColor="#F0F0FF" />
        </LinearGradient>

        {/* Logo gradient */}
        <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={COLORS.primary} />
          <Stop offset="40%" stopColor={COLORS.primaryLight} />
          <Stop offset="100%" stopColor={COLORS.accent} />
        </LinearGradient>

        {/* Subtle inner shadow for depth */}
        <LinearGradient id="innerShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <Stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
        </LinearGradient>
      </Defs>

      {/* Background */}
      {showBackground && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          fill="url(#bgGradient)"
        />
      )}

      {/* Logo rings */}
      <G transform={`translate(${padding}, ${padding})`}>
        {/* Left ring */}
        <Circle
          cx={iconSize * 0.35}
          cy={iconSize / 2}
          r={iconSize * 0.28}
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth={iconSize * 0.12}
          strokeLinecap="round"
        />

        {/* Right ring */}
        <Circle
          cx={iconSize * 0.65}
          cy={iconSize / 2}
          r={iconSize * 0.28}
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth={iconSize * 0.12}
          strokeLinecap="round"
        />
      </G>

      {/* Subtle vignette for depth */}
      {showBackground && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          fill="url(#innerShadow)"
        />
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoopLogo;
