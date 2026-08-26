/**
 * SafeSymbol - Fallback wrapper for SF Symbols
 * Uses expo-symbols when native module is available,
 * falls back to Lucide icons otherwise (dev client without EAS build)
 */
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import {
  Sparkles,
  Users,
  CheckCircle,
  Search,
  Gamepad2,
  Heart,
  Camera,
  Palette,
  Brush,
  Mic,
  Send,
  Plus,
  Settings,
  User,
  ArrowRight,
  ChevronRight,
  X,
  Check,
  Bell,
  Image as ImageIcon,
  Smile,
  Lightbulb,
  Sun,
  Moon,
  Leaf,
  Wind,
  Droplet,
  Snowflake,
  Coffee,
  Headphones,
  BookOpen,
  Zap,
  Flame,
  Rocket,
  Trophy,
  Star,
  ThumbsUp,
  Gift,
  Globe,
  BatteryLow,
  EyeOff,
  Target,
  FileText,
  BadgeCheck,
  Music,
  CloudMoon,
  Brain,
  type LucideIcon,
} from 'lucide-react-native';
import type { SFSymbol } from 'expo-symbols';
import { logger } from '@/lib/logger';

// Check if expo-symbols native module is available
// In Expo Go / dev client without EAS build, native modules like expo-symbols
// will load but render incorrectly (showing garbage text like "Unimpleme")
// We detect this by checking if ExpoModulesCore can access the native view manager
let symbolsAvailable = false;
let SymbolView: any = null;

try {
  // First check if we're in a dev client by checking for expo-constants
  const Constants = require('expo-constants').default;
  const isDevClient = Constants.appOwnership === 'expo' ||
                      Constants.executionEnvironment === 'storeClient' ||
                      !Constants.expoConfig?.extra?.eas?.buildId;

  // Only try to use native symbols in EAS build (not dev client)
  if (!isDevClient) {
    const expoSymbols = require('expo-symbols');
    SymbolView = expoSymbols.SymbolView;
    symbolsAvailable = true;
  }
} catch {
  symbolsAvailable = false;
}

// Log which mode we're using
if (!symbolsAvailable) {
  logger.debug('Using Lucide fallback icons (dev client mode)', { action: 'SafeSymbol' });
}

// Map SF Symbol names to Lucide icons
const SYMBOL_TO_LUCIDE: Record<string, LucideIcon> = {
  'sparkles': Sparkles,
  'sparkle': Sparkles,
  'sparkles.circle.fill': Sparkles,
  'person.2': Users,
  'person.2.fill': Users,
  'checkmark.circle': CheckCircle,
  'checkmark.circle.fill': CheckCircle,
  'magnifyingglass': Search,
  'gamecontroller': Gamepad2,
  'gamecontroller.fill': Gamepad2,
  'heart': Heart,
  'heart.fill': Heart,
  'camera': Camera,
  'camera.fill': Camera,
  'paintpalette': Palette,
  'paintpalette.fill': Palette,
  'paintbrush': Brush,
  'paintbrush.fill': Brush,
  'mic': Mic,
  'mic.fill': Mic,
  'face.smiling': Smile,
  'paperplane': Send,
  'paperplane.fill': Send,
  'plus': Plus,
  'plus.circle': Plus,
  'plus.circle.fill': Plus,
  'gearshape': Settings,
  'gearshape.fill': Settings,
  'person': User,
  'person.fill': User,
  'person.crop.circle': User,
  'person.crop.circle.fill': User,
  'arrow.right': ArrowRight,
  'arrow.right.circle': ArrowRight,
  'arrow.right.circle.fill': ArrowRight,
  'chevron.right': ChevronRight,
  'chevron.right.circle': ChevronRight,
  'xmark': X,
  'xmark.circle': X,
  'xmark.circle.fill': X,
  'checkmark': Check,
  'bell': Bell,
  'bell.fill': Bell,
  'lightbulb': Lightbulb,
  'lightbulb.fill': Lightbulb,
  'photo': ImageIcon,
  'photo.fill': ImageIcon,
  'sun.max.fill': Sun,
  'moon.stars.fill': Moon,
  'leaf.fill': Leaf,
  'wind': Wind,
  'drop.fill': Droplet,
  'snowflake': Snowflake,
  'cup.and.saucer.fill': Coffee,
  'headphones': Headphones,
  'book.fill': BookOpen,
  'bolt.fill': Zap,
  'flame.fill': Flame,
  'rocket.fill': Rocket,
  'trophy.fill': Trophy,
  'star.fill': Star,
  'hand.thumbsup.fill': ThumbsUp,
  'gift.fill': Gift,
  'globe.americas.fill': Globe,
  'battery.25': BatteryLow,
  'eye.slash': EyeOff,
  'target': Target,
  'brain.head.profile': Brain,
  'doc.text': FileText,
  'checkmark.seal.fill': BadgeCheck,
  'music.note': Music,
  'cloud.moon.fill': CloudMoon,
};

interface SafeSymbolProps {
  name: SFSymbol | string;
  size?: number;
  tintColor?: string;
  style?: any;
}

export function SafeSymbol({
  name,
  size = 24,
  tintColor = '#000000',
  style,
}: SafeSymbolProps) {
  const [useNative, setUseNative] = useState(symbolsAvailable);
  const [hasError, setHasError] = useState(false);

  // Check for native module availability at mount
  useEffect(() => {
    // If we get the NativeViewManagerAdapter warning, fall back to Lucide
    if (!SymbolView) {
      setUseNative(false);
    }
  }, []);

  // Get the Lucide icon for this symbol name
  const LucideIcon = SYMBOL_TO_LUCIDE[name as string] || Sparkles;

  // If native symbols not available or had an error, use Lucide
  if (!useNative || hasError || !SymbolView) {
    return (
      <View style={style}>
        <LucideIcon size={size} color={tintColor} strokeWidth={2} />
      </View>
    );
  }

  // Try native SymbolView with error boundary behavior
  return (
    <View
      style={style}
      onLayout={() => {
        // If the component renders but with wrong content, this won't catch it
        // We rely on the warning logs to know if symbols work
      }}
    >
      <SymbolView
        name={name}
        size={size}
        tintColor={tintColor}
        fallback={
          <LucideIcon size={size} color={tintColor} strokeWidth={2} />
        }
      />
    </View>
  );
}

// Export a hook to check if symbols are available
export function useSymbolsAvailable(): boolean {
  return symbolsAvailable && SymbolView !== null;
}

// Helper to check availability before using
export const isSymbolsAvailable = () => symbolsAvailable && SymbolView !== null;
