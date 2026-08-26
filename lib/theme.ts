/**
 * Loop Theme - Warm Sunrise 2026
 *
 * Evolved Warm Sunrise palette with liquid-glass surfaces, refined neutrals,
 * and modern motion guidance. See DESIGN_SYSTEM.md for usage rules.
 */

// =============================================================================
// COLOR PALETTE (Warm Sunrise 2026)
// =============================================================================

export const colors = {
  // Primary - Warm Coral (energetic, friendly)
  primary: {
    DEFAULT: '#FF6B6B',
    light: '#FF8E8E',
    dark: '#E85555',
    gradient: ['#FF6B6B', '#FFB4B4'] as const,
  },

  // Success - Vibrant Lime (achievement, completion)
  success: {
    DEFAULT: '#97DC38',
    light: '#B5E868',
    dark: '#7BC22A',
    gradient: ['#97DC38', '#C5F06A'] as const,
  },

  // Accent - Soft Lavender (calm, trust)
  accent: {
    DEFAULT: '#A1A8EA',
    light: '#BFC4F2',
    dark: '#8289D8',
    gradient: ['#A1A8EA', '#C5CAF5'] as const,
  },

  // Backgrounds (Warm Light Mode)
  background: {
    DEFAULT: '#FFFBF7',     // Warm white (cream tint)
    secondary: '#FFF5EE',   // Warmer cream
    tertiary: '#FFEEE5',    // Peachy cream
    pure: '#FFFFFF',        // Pure white (for cards)
  },

  // Text (High contrast on warm backgrounds)
  text: {
    DEFAULT: '#1A1A2E',     // Dark navy (not pure black)
    secondary: '#3E3E59',   // Deeper muted navy
    tertiary: '#6D6D8A',    // Soft gray
    inverse: '#FFFFFF',     // White text on dark
    muted: '#9C9CB4',       // Very light
    faint: '#C9C9D8',       // Helper text / placeholders
  },

  // Neutrals (use for borders, separators, subtle fills)
  neutral: {
    50: '#FFFBF7',
    100: '#FFF5EE',
    200: '#FFECE1',
    300: '#F3E4DC',
    400: '#E1D4CF',
    500: '#C7B9B5',
    600: '#A39491',
    700: '#7C6E6C',
    800: '#4B4242',
    900: '#2D2626',
  },

  // Surfaces (Elevated content + liquid glass)
  surface: {
    DEFAULT: '#FFFFFF',
    elevated: '#FFFFFF',
    card: '#FFFFFF',
    sunlit: '#FFF8F3',
    overlay: 'rgba(255, 255, 255, 0.96)',
    glass: 'rgba(255, 255, 255, 0.72)',
    glassStrong: 'rgba(255, 255, 255, 0.86)',
    glassTint: 'rgba(255, 233, 220, 0.38)',
  },

  // System
  separator: 'rgba(26, 26, 46, 0.12)',
  separatorStrong: 'rgba(26, 26, 46, 0.18)',
  fill: 'rgba(26, 26, 46, 0.08)',
  fillStrong: 'rgba(26, 26, 46, 0.12)',

  // Semantic
  warning: '#FFB347',
  error: '#FF6B6B',        // Same as primary
  info: '#A1A8EA',         // Same as accent

  // Legacy compatibility
  celebration: {
    DEFAULT: '#97DC38',    // Map to success
    gold: '#FFB347',
    goldDark: '#FF9500',
  },
} as const;

// Gradient Presets (Warm Sunrise 2026)
export const gradients = {
  // Main app gradient (top to bottom)
  sunrise: ['#FFFBF7', '#FFE4D6', '#FFD4C4'] as const,

  // Success/celebration gradient
  celebration: ['#E8FFB8', '#C5F06A', '#97DC38'] as const,

  // Onboarding warm gradient
  onboarding: ['#FFF5EE', '#FFE4D6', '#FFD4C4'] as const,

  // Coral accent gradient
  coral: ['#FF6B6B', '#FF8E8E', '#FFB4B4'] as const,

  // Lavender calm gradient
  lavender: ['#A1A8EA', '#BFC4F2', '#E0E4FF'] as const,

  // Lime fresh gradient
  lime: ['#B5E868', '#97DC38', '#C5F06A'] as const,

  // Hero glass gradient (subtle for high-end surfaces)
  hero: ['#FFF8F3', '#FFEDE3', '#F7E7DE'] as const,

  // Glassy overlay gradient
  glass: ['rgba(255,255,255,0.9)', 'rgba(255,244,238,0.85)', 'rgba(255,255,255,0.95)'] as const,

  // Header fade gradient
  header: ['#FFFBF7', 'rgba(255, 251, 247, 0)'] as const,
} as const;

// Dark mode colors (full parity)
export const darkColors = {
  primary: {
    DEFAULT: '#FF8E8E',
    light: '#FFB4B4',
    dark: '#FF6B6B',
    gradient: ['#FF8E8E', '#FFB4B4'] as const,
  },
  success: {
    DEFAULT: '#B5E868',
    light: '#C5F06A',
    dark: '#97DC38',
    gradient: ['#B5E868', '#C5F06A'] as const,
  },
  accent: {
    DEFAULT: '#BFC4F2',
    light: '#D5D9F7',
    dark: '#A1A8EA',
    gradient: ['#BFC4F2', '#D5D9F7'] as const,
  },
  background: {
    DEFAULT: '#151521',
    secondary: '#1F1F30',
    tertiary: '#2A2A42',
    pure: '#0B0B12',
  },
  text: {
    DEFAULT: '#FFFFFF',
    secondary: '#E1E1F0',
    tertiary: '#A8A8BF',
    inverse: '#1A1A2E',
    muted: '#7F7F98',
    faint: '#5C5C78',
  },
  neutral: {
    50: '#1B1B2A',
    100: '#232335',
    200: '#2C2C42',
    300: '#343454',
    400: '#4A4A6A',
    500: '#6A6A8A',
    600: '#8A8AAD',
    700: '#B1B1CC',
    800: '#D8D8E8',
    900: '#F1F1F7',
  },
  surface: {
    DEFAULT: '#1F1F30',
    elevated: '#25253B',
    card: '#23233A',
    sunlit: '#2A2A42',
    overlay: 'rgba(31, 31, 48, 0.96)',
    glass: 'rgba(37, 37, 66, 0.7)',
    glassStrong: 'rgba(37, 37, 66, 0.85)',
    glassTint: 'rgba(74, 74, 106, 0.35)',
  },
  separator: 'rgba(255, 255, 255, 0.12)',
  separatorStrong: 'rgba(255, 255, 255, 0.18)',
  fill: 'rgba(255, 255, 255, 0.08)',
  fillStrong: 'rgba(255, 255, 255, 0.12)',
  warning: '#FFB347',
  error: '#FF6B6B',
  info: '#A1A8EA',
  celebration: {
    DEFAULT: '#B5E868',
    gold: '#FFB347',
    goldDark: '#FF9500',
  },
} as const;

// =============================================================================
// TYPOGRAPHY (SF Pro - Native iOS)
// =============================================================================

export const typography = {
  // Font Families (SF Pro via system font)
  fontFamily: {
    display: 'System',     // SF Pro Display on iOS
    text: 'System',        // SF Pro Text on iOS
    mono: 'SF Mono',       // Code snippets
    // Legacy
    sans: 'System',
  },

  // iOS Dynamic Type Scale
  fontSize: {
    caption2: 11,
    caption1: 12,
    footnote: 13,
    subheadline: 15,
    callout: 16,
    body: 17,              // iOS default body
    headline: 17,
    title3: 20,
    title2: 22,
    title1: 28,
    largeTitle: 34,
    hero: 48,              // Large marketing headlines
    // Legacy aliases
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 22,
    '3xl': 28,
    '4xl': 34,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  lineHeight: {
    tight: 1.1,            // Headlines
    normal: 1.35,          // Body text
    relaxed: 1.5,          // Long-form reading
  },

  letterSpacing: {
    tighter: -0.8,         // Large titles
    tight: -0.4,           // Headlines
    normal: 0,             // Body
    wide: 0.4,             // Small caps, buttons
  },
} as const;

// =============================================================================
// SPACING & LAYOUT (8pt Grid)
// =============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 80,

  // Screen margins
  screenHorizontal: 20,    // More generous than iOS default
  screenVertical: 24,
  cardPadding: 20,
  listInset: 16,
} as const;

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  pill: 9999,              // Full pill shape for buttons
  playful: 24,
  full: 9999,
} as const;

// =============================================================================
// Z-INDEX SCALE (Layering System)
// =============================================================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  tooltip: 400,
  popover: 500,
  overlay: 600,
  toast: 700,
  banner: 800,
  max: 999,
} as const;

// =============================================================================
// SHADOWS (React Native shadow properties)
// =============================================================================

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 5,
  },
  float: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 8,
  },
  // Colored shadow glows - use sparingly
  primaryGlow: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  successGlow: {
    shadowColor: '#97DC38',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  accentGlow: {
    shadowColor: '#A1A8EA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  // Legacy alias
  button: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// =============================================================================
// ANIMATION (react-native-reanimated Spring Physics)
// =============================================================================

export const animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    celebration: 600,
  },
  springs: {
    snappy: {
      damping: 20,
      stiffness: 400,
      mass: 0.8,
    },
    responsive: {
      damping: 18,
      stiffness: 200,
      mass: 1,
    },
    gentle: {
      damping: 15,
      stiffness: 120,
      mass: 1.2,
    },
    bouncy: {
      damping: 10,
      stiffness: 180,
      mass: 1,
    },
    ios26: {
      damping: 25,
      stiffness: 300,
      mass: 0.9,
    },
  },
  easing: {
    spring: {
      damping: 18,
      stiffness: 200,
      mass: 1,
    },
    ease: 'ease-out',
  },
} as const;

// =============================================================================
// MOTION GUIDELINES
// =============================================================================

export const motion = {
  duration: {
    fast: 120,
    base: 200,
    slow: 320,
    hero: 520,
  },
  easing: {
    standard: [0.2, 0.0, 0.0, 1.0],
    emphasized: [0.2, 0.0, 0.0, 1.2],
  },
} as const;

// =============================================================================
// THEME EXPORT
// =============================================================================

export const theme = {
  colors,
  darkColors,
  gradients,
  typography,
  spacing,
  borderRadius,
  zIndex,
  shadows,
  animation,
  motion,
} as const;

export type Theme = typeof theme;
export type ColorPalette = typeof colors | typeof darkColors;
