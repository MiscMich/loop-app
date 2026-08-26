/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enable dark mode with class strategy for manual control
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./node_modules/heroui-native/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm Sunrise Primary - Coral (energetic, friendly)
        primary: {
          DEFAULT: '#FF6B6B',
          light: '#FF8E8E',
          dark: '#E85555',
        },
        // Success - Vibrant Lime (achievement)
        success: {
          DEFAULT: '#97DC38',
          light: '#B5E868',
          dark: '#7BC22A',
        },
        // Accent - Soft Lavender (calm, trust)
        accent: {
          DEFAULT: '#A1A8EA',
          light: '#BFC4F2',
          dark: '#8289D8',
        },
        // Celebration Colors (same as success)
        celebration: {
          DEFAULT: '#97DC38',
          gold: '#FFB347',
          goldDark: '#FF9500',
        },
        // Light Mode Backgrounds (Warm Sunrise)
        background: {
          DEFAULT: '#FFFBF7',     // Warm white (cream tint)
          secondary: '#FFF5EE',   // Warmer cream
          tertiary: '#FFEEE5',    // Peachy cream
          pure: '#FFFFFF',        // Pure white
        },
        // Surface Colors
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#FFFFFF',
          glass: 'rgba(255, 255, 255, 0.7)',
        },
        // Dark Mode Backgrounds (for future use)
        'dark-bg': {
          DEFAULT: '#1A1A2E',
          secondary: '#252542',
          tertiary: '#2D2D5A',
          pure: '#000000',
        },
        // Light Mode Text (High contrast on warm backgrounds)
        text: {
          DEFAULT: '#1A1A2E',     // Dark navy (not pure black)
          secondary: '#4A4A6A',   // Muted navy
          tertiary: '#8E8E9E',    // Light gray
          inverse: '#FFFFFF',    // White text on dark
          muted: '#B4B4C4',      // Very light
        },
        // Dark Mode Text
        'dark-text': {
          DEFAULT: '#FFFFFF',
          secondary: '#E0E0F0',
          tertiary: '#8E8E9E',
          inverse: '#1A1A2E',
          muted: '#6A6A8A',
        },
        // System Colors
        separator: 'rgba(26, 26, 46, 0.12)',
        fill: 'rgba(26, 26, 46, 0.08)',
        // Semantic
        warning: '#FFB347',
        error: '#FF6B6B',
        info: '#A1A8EA',
      },
      borderRadius: {
        'none': '0',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'pill': '9999px',
        // Semantic aliases
        'playful': '24px',
        'card': '24px',
        'button': '9999px',
      },
      fontFamily: {
        'sans': ['System', '-apple-system', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'sans-serif'],
        'display': ['System', '-apple-system', 'SF Pro Display', 'sans-serif'],
        'text': ['System', '-apple-system', 'SF Pro Text', 'sans-serif'],
        'mono': ['SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        // iOS Dynamic Type Scale
        'caption2': '11px',
        'caption1': '12px',
        'footnote': '13px',
        'subheadline': '15px',
        'callout': '16px',
        'body': '17px',
        'headline': '17px',
        'title3': '20px',
        'title2': '22px',
        'title1': '28px',
        'largeTitle': '34px',
        'hero': '48px',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '80px',
        // Screen margins
        'screen-h': '20px',
        'screen-v': '24px',
      },
      // NOTE: boxShadow only works on web, NOT React Native
      // Use the shadows object from lib/theme.ts for native shadows
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 4px rgba(26, 26, 46, 0.06)',
        'md': '0 4px 12px rgba(26, 26, 46, 0.1)',
        'lg': '0 8px 24px rgba(26, 26, 46, 0.15)',
        'float': '0 12px 32px rgba(26, 26, 46, 0.2)',
        'primary-glow': '0 6px 16px rgba(255, 107, 107, 0.35)',
        'success-glow': '0 6px 16px rgba(151, 220, 56, 0.35)',
        'accent-glow': '0 6px 16px rgba(161, 168, 234, 0.35)',
      },
    },
  },
  plugins: [],
};
