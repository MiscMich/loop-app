/**
 * Create Screen - Content Creation Hub
 * Migrated to Tailwind with staggered animations
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Card } from 'heroui-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/providers/ThemeProvider';
import type { ColorPalette } from '@/lib/theme';
import { useTooltipState } from '@/components/ui/Tooltip';

const GRID_PADDING = 12;
const ITEM_PADDING = 8;

type ContentType = 'doodle' | 'photo' | 'mood' | 'voice' | 'game';

interface ContentOption {
  type: ContentType;
  icon: SFSymbol;
  title: string;
  subtitle: string;
  color: string;
}

const buildContentOptions = (colors: ColorPalette): ContentOption[] => [
  {
    type: 'doodle',
    icon: 'paintbrush.fill',
    title: 'Draw',
    subtitle: 'Create a doodle',
    color: colors.primary.DEFAULT,
  },
  {
    type: 'photo',
    icon: 'camera.fill',
    title: 'Photo',
    subtitle: 'Capture a moment',
    color: colors.accent.DEFAULT,
  },
  {
    type: 'mood',
    icon: 'face.smiling.fill',
    title: 'Mood',
    subtitle: 'Share your vibe',
    color: colors.celebration.gold,
  },
  {
    type: 'voice',
    icon: 'mic.fill',
    title: 'Voice',
    subtitle: '10s voice note',
    color: colors.accent.dark,
  },
  {
    type: 'game',
    icon: 'gamecontroller.fill',
    title: 'Game',
    subtitle: 'Play together',
    color: colors.success.DEFAULT,
  },
];

function ContentOptionCard({
  option,
  onPress,
  index,
  foregroundColor,
}: {
  option: ContentOption;
  onPress: () => void;
  index: number;
  foregroundColor: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 80).springify()}
      style={[styles.optionCard, { backgroundColor: option.color }]}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={({ pressed }) => [
          styles.pressableContent,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={styles.iconContainer}>
          <SafeSymbol name={option.icon} size={28} tintColor={foregroundColor} />
        </View>
        <Text style={[styles.optionTitle, { color: foregroundColor }]}>{option.title}</Text>
        <Text style={[styles.optionSubtitle, { color: foregroundColor, opacity: 0.8 }]}>
          {option.subtitle}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function CreateScreen() {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const moodSpotlight = useTooltipState('create-mood-spotlight', true);
  const itemWidth = (screenWidth - GRID_PADDING * 2) / 2;
  const contentOptions = useMemo(() => buildContentOptions(colors), [colors]);

  const handleOptionPress = (type: ContentType) => {
    router.push(`/create/${type}`);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background.DEFAULT }}
      edges={['top']}
    >
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(50).springify()}
        className="px-5 pt-4 pb-6"
      >
        <Text
          className="text-xs font-semibold tracking-widest mb-1"
          style={{ color: colors.primary.DEFAULT }}
        >
          SHARE SOMETHING
        </Text>
        <Text
          className="text-[32px] font-bold"
          style={{ color: colors.text.DEFAULT }}
        >
          Create
        </Text>
      </Animated.View>

      {/* Content Options Grid */}
      <View style={styles.gridContainer}>
        {contentOptions.map((option, index) => (
          <View key={option.type} style={[styles.gridItem, { width: itemWidth }]}>
            <ContentOptionCard
              option={option}
              onPress={() => handleOptionPress(option.type)}
              index={index}
              foregroundColor={colors.text.inverse}
            />
          </View>
        ))}
      </View>

      {/* Mood Feature Spotlight - First Time Only */}
      {moodSpotlight.visible && (
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          className="px-5 mt-6"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              moodSpotlight.dismiss();
            }}
          >
            <Card variant="secondary">
              <View className="flex-row items-center p-4">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: colors.celebration.gold }}
                >
                  <SafeSymbol name="face.smiling" size={22} tintColor={colors.text.inverse} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[11px] font-bold tracking-wider mb-1"
                    style={{ color: colors.celebration.goldDark }}
                  >
                    DISCOVER MOOD
                  </Text>
                  <Text
                    className="text-[15px] leading-5"
                    style={{ color: colors.text.secondary }}
                  >
                    Share how you're feeling! Your mood icon appears on friends' widgets.
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    moodSpotlight.dismiss();
                  }}
                  hitSlop={8}
                >
                  <SafeSymbol name="xmark.circle.fill" size={20} tintColor={colors.text.tertiary} />
                </Pressable>
              </View>
            </Card>
          </Pressable>
        </Animated.View>
      )}

      {/* Pro Tip */}
      <Animated.View
        entering={FadeInDown.delay(moodSpotlight.visible ? 700 : 500).springify()}
        className="px-5 mt-6"
      >
        <Card variant="secondary">
          <View className="flex-row items-center p-4">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: colors.celebration.gold }}
            >
              <Text className="text-2xl">✨</Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-[11px] font-bold tracking-wider mb-1"
                style={{ color: colors.celebration.goldDark }}
              >
                PRO TIP
              </Text>
              <Text
                className="text-[15px] leading-5"
                style={{ color: colors.text.secondary }}
              >
                Your friends see what you share on their home widget!
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Quick Action Hint */}
      <Animated.View
        entering={FadeInDown.delay(moodSpotlight.visible ? 800 : 600).springify()}
        className="flex-row items-center justify-center py-6 gap-2"
      >
        <SafeSymbol name="bolt.fill" size={16} tintColor={colors.text.tertiary} />
        <Text
          className="text-sm font-medium"
          style={{ color: colors.text.tertiary }}
        >
          Quick doodle (hold + button)
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
  },
  gridItem: {
    padding: ITEM_PADDING,
  },
  optionCard: {
    borderRadius: 23,
    borderCurve: 'continuous',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  pressableContent: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
  },
});
