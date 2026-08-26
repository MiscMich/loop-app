/**
 * Widget Theme Screen
 * Customize the appearance of the Loop widget
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Palette,
  ChevronLeft,
  Check,
  Smartphone,
  Image,
  Type,
} from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { colors as baseColors, darkColors } from '@/lib/theme';
import { getWidgetSettings, reloadWidgetTimelines, syncWidgetSettings } from '@/lib/widgetSync';
import WidgetPreview, { WidgetStyleId, WidgetThemeId } from '@/components/widget/WidgetPreview';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ThemeOption {
  id: WidgetThemeId;
  name: string;
  colors: readonly [string, string];
  textColor: string;
  preview: string;
}

const WIDGET_THEMES: ThemeOption[] = [
  {
    id: 'coral',
    name: 'Coral Sunrise',
    colors: [baseColors.primary.DEFAULT, baseColors.primary.light],
    textColor: baseColors.text.inverse,
    preview: 'Warm and energetic',
  },
  {
    id: 'lavender',
    name: 'Soft Lavender',
    colors: [baseColors.accent.DEFAULT, baseColors.accent.light],
    textColor: baseColors.text.inverse,
    preview: 'Calm and serene',
  },
  {
    id: 'lime',
    name: 'Fresh Lime',
    colors: [baseColors.success.DEFAULT, baseColors.success.light],
    textColor: baseColors.text.inverse,
    preview: 'Bright and cheerful',
  },
  {
    id: 'gold',
    name: 'Golden Hour',
    colors: [baseColors.celebration.gold, baseColors.celebration.goldDark],
    textColor: baseColors.text.inverse,
    preview: 'Warm and inviting',
  },
  {
    id: 'minimal',
    name: 'Minimal White',
    colors: [baseColors.surface.DEFAULT, baseColors.background.secondary],
    textColor: baseColors.text.DEFAULT,
    preview: 'Clean and simple',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: [darkColors.background.DEFAULT, darkColors.surface.elevated],
    textColor: darkColors.text.DEFAULT,
    preview: 'Sleek and modern',
  },
];

interface StyleOption {
  id: WidgetStyleId;
  name: string;
  icon: any;
  description: string;
}

const WIDGET_STYLES: StyleOption[] = [
  {
    id: 'standard',
    name: 'Standard',
    icon: Image,
    description: 'Show avatar and latest content',
  },
  {
    id: 'compact',
    name: 'Compact',
    icon: Type,
    description: 'Focus on the content',
  },
  {
    id: 'full',
    name: 'Full Preview',
    icon: Smartphone,
    description: 'Large content display',
  },
];

function ThemeCard({
  theme,
  isSelected,
  onSelect,
  index,
}: {
  theme: ThemeOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.selectionAsync();
        onSelect();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      style={animatedStyle}
    >
      <Animated.View
        entering={FadeInDown.duration(400).delay(100 + index * 50)}
        style={[
          styles.themeCard,
          {
            borderColor: isSelected ? colors.primary.DEFAULT : 'transparent',
            borderWidth: isSelected ? 3 : 0,
          },
        ]}
      >
        <LinearGradient
          colors={theme.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.themeGradient}
        >
          {/* Mock widget content */}
          <View style={styles.mockWidgetSmall}>
            <View style={[styles.mockAvatarSmall, { backgroundColor: colors.surface.glass }]} />
            <View style={styles.mockLinesContainer}>
              <View style={[styles.mockLine, { backgroundColor: theme.textColor, opacity: 0.9 }]} />
              <View style={[styles.mockLineShort, { backgroundColor: theme.textColor, opacity: 0.5 }]} />
            </View>
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.success.DEFAULT }]}>
              <Check size={14} color={colors.text.inverse} strokeWidth={3} />
            </View>
          )}
        </LinearGradient>

        <Text style={[styles.themeName, { color: colors.text.DEFAULT }]}>
          {theme.name}
        </Text>
        <Text style={[styles.themePreview, { color: colors.text.tertiary }]}>
          {theme.preview}
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

function StyleOption({
  style,
  isSelected,
  onSelect,
  index,
}: {
  style: StyleOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const { colors } = useTheme();
  const Icon = style.icon;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.selectionAsync();
        onSelect();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      style={animatedStyle}
    >
      <Animated.View
        entering={FadeInDown.duration(400).delay(400 + index * 50)}
        style={[
          styles.styleOption,
          {
            backgroundColor: isSelected
              ? `${colors.primary.DEFAULT}15`
              : colors.surface.DEFAULT,
            borderColor: isSelected ? colors.primary.DEFAULT : colors.separator,
          },
        ]}
      >
        <View
          style={[
            styles.styleIconContainer,
            {
              backgroundColor: isSelected
                ? colors.primary.DEFAULT
                : colors.background.secondary,
            },
          ]}
        >
          <Icon
            size={20}
            color={isSelected ? colors.text.inverse : colors.text.secondary}
            strokeWidth={2}
          />
        </View>
        <View style={styles.styleTextContainer}>
          <Text
            style={[
              styles.styleName,
              {
                color: isSelected ? colors.primary.DEFAULT : colors.text.DEFAULT,
                fontWeight: isSelected ? '600' : '500',
              },
            ]}
          >
            {style.name}
          </Text>
          <Text style={[styles.styleDescription, { color: colors.text.tertiary }]}>
            {style.description}
          </Text>
        </View>
        {isSelected && (
          <View style={[styles.checkCircle, { backgroundColor: colors.primary.DEFAULT }]}>
            <Check size={14} color={colors.text.inverse} strokeWidth={3} />
          </View>
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

export default function WidgetThemeScreen() {
  const { colors } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<WidgetThemeId>('coral');
  const [selectedStyle, setSelectedStyle] = useState<WidgetStyleId>('standard');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const isSaveDisabled = isLoadingSettings;

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const settings = await getWidgetSettings();
        if (settings && isMounted) {
          setSelectedTheme(settings.themeId);
          setSelectedStyle(settings.styleId);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSettings(false);
        }
      }
    };
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, []);

  const handleSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const settings = {
      themeId: selectedTheme,
      styleId: selectedStyle,
      updatedAt: new Date().toISOString(),
    };
    syncWidgetSettings(settings).finally(() => {
      reloadWidgetTimelines();
      router.back();
    });
  }, [selectedTheme, selectedStyle]);

  return (
    <LinearGradient
      colors={[colors.background.DEFAULT, colors.background.secondary, colors.background.tertiary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={colors.text.DEFAULT} strokeWidth={2} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
            Widget Theme
          </Text>
          <Pressable
            onPress={handleSave}
            style={[styles.saveButton, isSaveDisabled && { opacity: 0.5 }]}
            disabled={isSaveDisabled}
          >
            <Text style={[styles.saveButtonText, { color: colors.primary.DEFAULT }]}>
              Save
            </Text>
          </Pressable>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme Selection */}
          <View style={styles.section}>
            <Animated.Text
              entering={FadeIn.duration(400).delay(50)}
              style={[styles.sectionTitle, { color: colors.text.tertiary }]}
            >
              COLOR THEME
            </Animated.Text>
            <View style={styles.themeGrid}>
              {WIDGET_THEMES.map((theme, index) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedTheme === theme.id}
                  onSelect={() => setSelectedTheme(theme.id)}
                  index={index}
                />
              ))}
            </View>
          </View>

          {/* Style Selection */}
          <View style={styles.section}>
            <Animated.Text
              entering={FadeIn.duration(400).delay(350)}
              style={[styles.sectionTitle, { color: colors.text.tertiary }]}
            >
              WIDGET STYLE
            </Animated.Text>
            <View style={styles.styleList}>
              {WIDGET_STYLES.map((style, index) => (
                <StyleOption
                  key={style.id}
                  style={style}
                  isSelected={selectedStyle === style.id}
                  onSelect={() => setSelectedStyle(style.id)}
                  index={index}
                />
              ))}
            </View>
          </View>

          {/* Preview */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(600)}
            style={styles.previewSection}
          >
            <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
              PREVIEW
            </Text>
            <View style={[styles.previewContainer, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
              <WidgetPreview
                themeId={selectedTheme}
                styleId={selectedStyle}
                size="medium"
                friendName="Jamie"
                symbolName="sparkles"
                note="Sent you a doodle"
                unreadCount={2}
                style={styles.previewWidget}
              />
            </View>
          </Animated.View>

          {/* Info */}
          <Animated.View
            entering={FadeIn.duration(400).delay(700)}
            style={[styles.infoContainer, { backgroundColor: colors.background.secondary }]}
          >
            <Palette size={20} color={colors.text.tertiary} strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              Widget theme changes will apply the next time your widget refreshes, usually within a few minutes.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  themeCard: {
    width: '30%',
    marginHorizontal: '1.66%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  themeGradient: {
    aspectRatio: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  mockWidgetSmall: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  mockLinesContainer: {
    flex: 1,
    marginLeft: 8,
  },
  mockLine: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  mockLineShort: {
    height: 6,
    width: '60%',
    borderRadius: 3,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  themePreview: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  styleList: {
    gap: 12,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  styleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  styleTextContainer: {
    flex: 1,
  },
  styleName: {
    fontSize: 16,
  },
  styleDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  previewContainer: {
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  previewWidget: {
    alignSelf: 'center',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  previewTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewTime: {
    fontSize: 12,
    marginTop: 2,
  },
  previewContentArea: {
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
});
