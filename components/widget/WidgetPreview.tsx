import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { borderRadius, spacing, typography, colors as baseColors, darkColors } from '@/lib/theme';

export type WidgetThemeId = 'coral' | 'lavender' | 'lime' | 'gold' | 'minimal' | 'dark';
export type WidgetStyleId = 'standard' | 'compact' | 'full';
export type WidgetSize = 'small' | 'medium' | 'large';

interface WidgetPreviewProps {
  themeId?: WidgetThemeId;
  styleId?: WidgetStyleId;
  size?: WidgetSize;
  friendName?: string;
  mood?: string;
  symbolName?: SFSymbol;
  note?: string;
  unreadCount?: number;
  showBrand?: boolean;
  style?: ViewStyle;
}

const THEME_MAP: Record<WidgetThemeId, { colors: readonly [string, string]; text: string; accent: string; badgeText: string; bg: string; avatar: string } > = {
  coral: {
    colors: baseColors.primary.gradient,
    text: baseColors.text.inverse,
    accent: baseColors.surface.glassStrong,
    badgeText: baseColors.text.DEFAULT,
    bg: baseColors.background.secondary,
    avatar: baseColors.surface.glass,
  },
  lavender: {
    colors: baseColors.accent.gradient,
    text: baseColors.text.inverse,
    accent: baseColors.surface.glassStrong,
    badgeText: baseColors.text.DEFAULT,
    bg: baseColors.background.secondary,
    avatar: baseColors.surface.glass,
  },
  lime: {
    colors: baseColors.success.gradient,
    text: baseColors.text.inverse,
    accent: baseColors.surface.glassStrong,
    badgeText: baseColors.text.DEFAULT,
    bg: baseColors.background.secondary,
    avatar: baseColors.surface.glass,
  },
  gold: {
    colors: [baseColors.warning, baseColors.celebration.goldDark],
    text: baseColors.text.inverse,
    accent: baseColors.surface.glassStrong,
    badgeText: baseColors.text.DEFAULT,
    bg: baseColors.background.secondary,
    avatar: baseColors.surface.glass,
  },
  minimal: {
    colors: [baseColors.surface.DEFAULT, baseColors.background.secondary],
    text: baseColors.text.DEFAULT,
    accent: baseColors.background.secondary,
    badgeText: baseColors.text.DEFAULT,
    bg: baseColors.surface.DEFAULT,
    avatar: baseColors.fillStrong,
  },
  dark: {
    colors: [darkColors.background.DEFAULT, darkColors.surface.elevated],
    text: darkColors.text.DEFAULT,
    accent: darkColors.surface.elevated,
    badgeText: darkColors.text.DEFAULT,
    bg: darkColors.background.secondary,
    avatar: darkColors.surface.glass,
  },
};

const SIZE_MAP: Record<WidgetSize, { width: number; height: number; padding: number } > = {
  small: { width: 155, height: 155, padding: 14 },
  medium: { width: 329, height: 155, padding: 16 },
  large: { width: 329, height: 345, padding: 18 },
};

export function WidgetPreview({
  themeId = 'coral',
  styleId = 'standard',
  size = 'small',
  friendName = 'Jamie',
  mood = '',
  symbolName = 'sparkles',
  note = 'Sent you a doodle',
  unreadCount = 1,
  showBrand = true,
  style,
}: WidgetPreviewProps) {
  const palette = THEME_MAP[themeId];
  const sizing = SIZE_MAP[size];

  const isCompact = styleId === 'compact';
  const isFull = styleId === 'full';

  return (
    <View style={[styles.wrapper, { width: sizing.width, height: sizing.height }, style]}>
      <LinearGradient
        colors={palette.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { padding: sizing.padding }]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: palette.avatar }]}>
            <Text style={[styles.avatarText, { color: palette.text }]}>L</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.friendName, { color: palette.text }]} numberOfLines={1}>
              {friendName}
            </Text>
            {!isCompact && (
              <Text style={[styles.subtitle, { color: palette.text, opacity: 0.8 }]}>Just now</Text>
            )}
          </View>
          {unreadCount > 0 && !isCompact && (
            <View style={[styles.badge, { backgroundColor: palette.accent }]}>
              <Text style={[styles.badgeText, { color: palette.badgeText }]}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={[styles.contentArea, isFull && styles.contentAreaFull]}>
          {symbolName ? (
            <SafeSymbol name={symbolName} size={28} tintColor={palette.text} />
          ) : (
            <Text style={[styles.mood, { color: palette.text }]}>{mood}</Text>
          )}
          {!isCompact && (
            <Text style={[styles.note, { color: palette.text, opacity: 0.85 }]} numberOfLines={2}>
              {note}
            </Text>
          )}
        </View>

        {/* Footer */}
        {showBrand && (
          <View style={styles.footerRow}>
            <Text style={[styles.brand, { color: palette.text, opacity: 0.7 }]}>Loop</Text>
            {isFull && (
              <Text style={[styles.footerHint, { color: palette.text, opacity: 0.6 }]}>Tap to open</Text>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderCurve: 'continuous',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  friendName: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },
  badge: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  contentAreaFull: {
    justifyContent: 'flex-start',
    paddingTop: spacing.md,
  },
  mood: {
    fontSize: 32,
  },
  note: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  footerHint: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
  },
});

export default WidgetPreview;
