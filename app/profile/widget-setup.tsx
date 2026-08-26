/**
 * Widget Setup Screen
 * Instructions and configuration for adding Loop widget to homescreen
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Check,
  Grip,
  Sparkles,
} from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { useFriendsStore } from '@/stores/friendsStore';
import WidgetPreview from '@/components/widget/WidgetPreview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SetupStep {
  number: number;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const buildSetupSteps = (colors: ReturnType<typeof useTheme>['colors']): SetupStep[] => [
  {
    number: 1,
    title: 'Long press on homescreen',
    description: 'Press and hold on any empty area of your homescreen until the apps start wiggling',
    icon: Grip,
    color: colors.primary.DEFAULT,
  },
  {
    number: 2,
    title: 'Tap the + button',
    description: 'Look for the + button in the top left corner of your screen',
    icon: Plus,
    color: colors.success.DEFAULT,
  },
  {
    number: 3,
    title: 'Search for Loop',
    description: 'Type "Loop" in the search bar to find the widget',
    icon: Search,
    color: colors.accent.DEFAULT,
  },
  {
    number: 4,
    title: 'Choose your size',
    description: 'Pick from small, medium, or large widget sizes',
    icon: Smartphone,
    color: colors.celebration.gold,
  },
  {
    number: 5,
    title: 'Add and configure',
    description: 'Tap "Add Widget" then select which friend to show',
    icon: Check,
    color: colors.accent.dark,
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StepCard({
  step,
  index,
  isLast,
}: {
  step: SetupStep;
  index: number;
  isLast: boolean;
}) {
  const { colors } = useTheme();
  const Icon = step.icon;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      style={animatedStyle}
    >
      <Animated.View
        entering={FadeInRight.duration(400).delay(200 + index * 100)}
        style={styles.stepContainer}
      >
        {/* Step number and line */}
        <View style={styles.stepLeft}>
          <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
            <Text style={[styles.stepNumberText, { color: colors.text.inverse }]}>{step.number}</Text>
          </View>
          {!isLast && (
            <View style={[styles.stepLine, { backgroundColor: colors.separator }]} />
          )}
        </View>

        {/* Step content */}
        <View style={[styles.stepCard, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
          <View style={[styles.stepIconContainer, { backgroundColor: step.color + '15' }]}>
            <Icon size={22} color={step.color} strokeWidth={2} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={[styles.stepTitle, { color: colors.text.DEFAULT }]}>
              {step.title}
            </Text>
            <Text style={[styles.stepDescription, { color: colors.text.secondary }]}>
              {step.description}
            </Text>
          </View>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

function WidgetPreviewCard() {
  const { colors } = useTheme();
  const friends = useFriendsStore((state) => state.friends);

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100)}
      style={styles.previewContainer}
    >
      <LinearGradient
        colors={[colors.primary.DEFAULT, colors.primary.light]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.previewGradient}
      >
        <Sparkles size={24} color={colors.text.inverse} strokeWidth={2} />
        <Text style={[styles.previewTitle, { color: colors.text.inverse }]}>Widget Preview</Text>
        <Text style={[styles.previewSubtitle, { color: colors.text.inverse, opacity: 0.8 }]}>
          See your friends' latest updates right on your homescreen
        </Text>

        {/* Mock widget */}
        <View style={[styles.mockWidget, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}>
          <WidgetPreview
            themeId="coral"
            styleId="standard"
            size="medium"
            friendName={friends[0]?.displayName || 'Add friends'}
            symbolName="sparkles"
            note="Latest content here"
            unreadCount={friends.length > 0 ? 1 : 0}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function WidgetSizeSelector() {
  const { colors } = useTheme();
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');

  const sizes = [
    { key: 'small' as const, label: 'Small', width: 60, height: 60 },
    { key: 'medium' as const, label: 'Medium', width: 120, height: 60 },
    { key: 'large' as const, label: 'Large', width: 120, height: 120 },
  ];

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(600)}
      style={styles.sizeContainer}
    >
      <Text style={[styles.sizeTitle, { color: colors.text.DEFAULT }]}>
        Available Sizes
      </Text>
      <View style={styles.sizeRow}>
        {sizes.map((size) => (
          <Pressable
            key={size.key}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedSize(size.key);
            }}
            style={styles.sizeOption}
          >
            <View
              style={[
                styles.sizeMockup,
                {
                  width: size.width,
                  height: size.height,
                  backgroundColor: selectedSize === size.key
                    ? colors.primary.DEFAULT + '20'
                    : colors.background.secondary,
                  borderColor: selectedSize === size.key
                    ? colors.primary.DEFAULT
                    : colors.separator,
                },
              ]}
            >
              <Smartphone
                size={size.key === 'small' ? 16 : 24}
                color={selectedSize === size.key ? colors.primary.DEFAULT : colors.text.tertiary}
                strokeWidth={2}
              />
            </View>
            <Text
              style={[
                styles.sizeLabel,
                {
                  color: selectedSize === size.key
                    ? colors.primary.DEFAULT
                    : colors.text.secondary,
                  fontWeight: selectedSize === size.key ? '600' : '400',
                },
              ]}
            >
              {size.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

export default function WidgetSetupScreen() {
  const { colors } = useTheme();
  const steps = buildSetupSteps(colors);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, []);

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
            Widget Setup
          </Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Widget Preview */}
          <WidgetPreviewCard />

          {/* Size Selector */}
          <WidgetSizeSelector />

          {/* Setup Steps */}
          <View style={styles.stepsSection}>
            <Animated.Text
              entering={FadeIn.duration(400).delay(400)}
              style={[styles.stepsTitle, { color: colors.text.tertiary }]}
            >
              HOW TO ADD THE WIDGET
            </Animated.Text>

            {steps.map((step, index) => (
              <StepCard
                key={step.number}
                step={step}
                index={index}
                isLast={index === steps.length - 1}
              />
            ))}
          </View>

          {/* Tips */}
          <Animated.View
            entering={FadeIn.duration(400).delay(900)}
            style={[styles.tipsContainer, { backgroundColor: `${colors.success.DEFAULT}15` }]}
          >
            <Sparkles size={20} color={colors.success.DEFAULT} strokeWidth={2} />
            <View style={styles.tipsTextContainer}>
              <Text style={[styles.tipsTitle, { color: colors.text.DEFAULT }]}>
                Pro tip
              </Text>
              <Text style={[styles.tipsText, { color: colors.text.secondary }]}>
                Add multiple widgets to show different friends! Each widget can be configured to show a specific friend's content.
              </Text>
            </View>
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
  headerSpacer: {
    width: 40,
  },
  previewContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  previewGradient: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  previewSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  mockWidget: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  mockWidgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mockAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockWidgetText: {
    marginLeft: 12,
  },
  mockName: {
    fontSize: 15,
    fontWeight: '600',
  },
  mockTime: {
    fontSize: 12,
    marginTop: 2,
  },
  mockDoodle: {
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockDoodleText: {
    fontSize: 13,
  },
  sizeContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sizeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  sizeOption: {
    alignItems: 'center',
  },
  sizeMockup: {
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sizeLabel: {
    fontSize: 13,
  },
  stepsSection: {
    paddingHorizontal: 20,
  },
  stepsTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  stepLeft: {
    alignItems: 'center',
    width: 40,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: -4,
  },
  stepCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginLeft: 8,
    marginBottom: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  stepIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
  },
  tipsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
