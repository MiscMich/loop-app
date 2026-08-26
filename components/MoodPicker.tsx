/**
 * MoodPicker - Icon mood selector
 * Uses HeroUI Button + Tailwind
 *
 * Accessibility:
 * - All mood buttons have descriptive labels
 * - Category filters announce selection state
 * - Full VoiceOver support
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { Button } from 'heroui-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import {
  moodCategories,
  allMoodOptions,
  getMoodLabel,
  resolveMoodSymbol,
  type MoodCategoryKey,
} from '@/lib/iconTokens';

interface MoodPickerProps {
  onSelect: (symbol: string, note?: string) => void;
  initialEmoji?: string;
  initialNote?: string;
  showNote?: boolean;
}

export function MoodPicker({
  onSelect,
  initialEmoji,
  initialNote = '',
  showNote = true,
}: MoodPickerProps) {
  const { colors } = useTheme();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(
    initialEmoji || null
  );
  const [note, setNote] = useState(initialNote);
  const [selectedCategory, setSelectedCategory] = useState<MoodCategoryKey | null>(null);

  const handleEmojiSelect = useCallback((symbol: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmoji(symbol);
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedEmoji) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(resolveMoodSymbol(selectedEmoji), note.trim() || undefined);
    }
  }, [selectedEmoji, note, onSelect]);

  const categoryNames = Object.keys(moodCategories) as MoodCategoryKey[];
  const selectedLabel = selectedEmoji ? getMoodLabel(selectedEmoji) : 'Select a mood';

  return (
    <View className="flex-1 p-5" style={{ backgroundColor: colors.background.DEFAULT }}>
      {/* Selected Mood Preview */}
      <View className="items-center mb-6">
        <View
          className="w-24 h-24 rounded-[28px] items-center justify-center"
          style={{ backgroundColor: colors.background.secondary }}
        >
          <SafeSymbol
            name={resolveMoodSymbol(selectedEmoji)}
            size={60}
            tintColor={colors.primary.DEFAULT}
          />
        </View>
        <Text className="text-sm mt-2" style={{ color: colors.text.tertiary }}>
          {selectedEmoji ? selectedLabel : 'Select a mood'}
        </Text>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-11 mb-5"
        contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
        accessibilityRole="tablist"
        accessibilityLabel="Mood categories"
      >
        <Pressable
          className={`px-4 py-2 rounded-full ${selectedCategory === null ? 'bg-primary' : ''}`}
          style={selectedCategory !== null ? { backgroundColor: colors.background.secondary } : undefined}
          onPress={() => setSelectedCategory(null)}
          accessibilityRole="tab"
          accessibilityLabel="All moods"
          accessibilityState={{ selected: selectedCategory === null }}
          accessibilityHint="Shows all available mood icons"
        >
          <Text
            className="text-sm font-medium"
            style={{ color: selectedCategory === null ? colors.text.inverse : colors.text.DEFAULT }}
          >
            All
          </Text>
        </Pressable>
        {categoryNames.map((cat) => (
          <Pressable
            key={cat}
            className={`px-4 py-2 rounded-full ${selectedCategory === cat ? 'bg-primary' : ''}`}
            style={selectedCategory !== cat ? { backgroundColor: colors.background.secondary } : undefined}
            onPress={() => setSelectedCategory(cat)}
            accessibilityRole="tab"
            accessibilityLabel={`${cat.charAt(0).toUpperCase() + cat.slice(1)} moods`}
            accessibilityState={{ selected: selectedCategory === cat }}
            accessibilityHint={`Shows ${cat} mood icons`}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: selectedCategory === cat ? colors.text.inverse : colors.text.DEFAULT }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Icon Grid */}
      <View
        className="flex-row flex-wrap justify-center gap-2 mb-6"
        accessibilityRole="radiogroup"
        accessibilityLabel="Mood icon options"
      >
        {(selectedCategory
          ? moodCategories[selectedCategory]
          : allMoodOptions
        ).map((option, index) => {
          const isSelected = selectedEmoji === option.symbol;
          const emojiName = option.label;
          return (
            <Pressable
              key={`${option.symbol}-${index}`}
              className={`w-14 h-14 rounded-2xl justify-center items-center ${
                isSelected ? 'scale-105' : ''
              }`}
              style={
                isSelected
                  ? { backgroundColor: `${colors.primary.DEFAULT}22` }
                  : { backgroundColor: colors.background.secondary }
              }
              onPress={() => handleEmojiSelect(option.symbol)}
              accessibilityRole="radio"
              accessibilityLabel={emojiName}
              accessibilityState={{ selected: isSelected, checked: isSelected }}
              accessibilityHint={isSelected ? 'Currently selected mood' : `Double tap to select ${emojiName}`}
            >
              <SafeSymbol
                name={option.symbol}
                size={28}
                tintColor={isSelected ? colors.primary.DEFAULT : colors.text.DEFAULT}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Optional Note */}
      {showNote && (
        <View className="mb-6">
          <TextInput
            className="rounded-xl p-4 min-h-20 text-base"
            style={{ backgroundColor: colors.background.secondary, color: colors.text.DEFAULT }}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.text.tertiary}
            value={note}
            onChangeText={setNote}
            maxLength={100}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Mood note"
            accessibilityHint="Add an optional note to your mood, maximum 100 characters"
          />
          <Text
            className="text-xs text-right mt-1"
            style={{ color: colors.text.tertiary }}
            accessibilityLabel={`${note.length} of 100 characters used`}
          >
            {note.length}/100
          </Text>
        </View>
      )}

      {/* Confirm Button */}
      <Button
        variant="primary"
        size="lg"
        onPress={handleConfirm}
        isDisabled={!selectedEmoji}
        className="w-full rounded-2xl shadow-lg"
        pressableFeedbackVariant="highlight"
        accessibilityLabel={selectedEmoji ? `Set mood to ${getMoodLabel(selectedEmoji)}` : 'Set Mood'}
        accessibilityHint={selectedEmoji ? 'Confirms your mood selection' : 'Select an icon first'}
        accessibilityState={{ disabled: !selectedEmoji }}
      >
        <Button.Label>Set Mood</Button.Label>
      </Button>
    </View>
  );
}

export default MoodPicker;
