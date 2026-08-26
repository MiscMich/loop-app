import type { SFSymbol } from 'expo-symbols';

export type MoodCategoryKey =
  | 'happy'
  | 'chill'
  | 'excited'
  | 'love'
  | 'tired'
  | 'focused'
  | 'playful'
  | 'grateful';

export interface MoodOption {
  symbol: SFSymbol;
  label: string;
}

export const moodCategories: Record<MoodCategoryKey, MoodOption[]> = {
  happy: [
    { symbol: 'face.smiling' as SFSymbol, label: 'Smiling' },
    { symbol: 'sun.max.fill' as SFSymbol, label: 'Sunny' },
    { symbol: 'sparkles' as SFSymbol, label: 'Sparkly' },
    { symbol: 'star.fill' as SFSymbol, label: 'Starry' },
    { symbol: 'hand.thumbsup.fill' as SFSymbol, label: 'Thumbs up' },
    { symbol: 'heart.fill' as SFSymbol, label: 'Warm' },
    { symbol: 'sparkles' as SFSymbol, label: 'Celebration' },
    { symbol: 'star.fill' as SFSymbol, label: 'Party' },
  ],
  chill: [
    { symbol: 'moon.stars.fill' as SFSymbol, label: 'Calm night' },
    { symbol: 'leaf.fill' as SFSymbol, label: 'Grounded' },
    { symbol: 'wind' as SFSymbol, label: 'Breezy' },
    { symbol: 'drop.fill' as SFSymbol, label: 'Fresh' },
    { symbol: 'snowflake' as SFSymbol, label: 'Cool' },
    { symbol: 'cup.and.saucer.fill' as SFSymbol, label: 'Cozy' },
    { symbol: 'headphones' as SFSymbol, label: 'Lo-fi' },
    { symbol: 'book.fill' as SFSymbol, label: 'Quiet' },
  ],
  excited: [
    { symbol: 'bolt.fill' as SFSymbol, label: 'Electric' },
    { symbol: 'flame.fill' as SFSymbol, label: 'On fire' },
    { symbol: 'rocket.fill' as SFSymbol, label: 'Launch' },
    { symbol: 'trophy.fill' as SFSymbol, label: 'Winning' },
    { symbol: 'sparkles' as SFSymbol, label: 'Charged' },
    { symbol: 'star.fill' as SFSymbol, label: 'Bright' },
    { symbol: 'hand.thumbsup.fill' as SFSymbol, label: 'Confident' },
    { symbol: 'sparkles' as SFSymbol, label: 'Hyped' },
  ],
  love: [
    { symbol: 'heart.fill' as SFSymbol, label: 'Loving' },
    { symbol: 'heart.circle.fill' as SFSymbol, label: 'Affection' },
    { symbol: 'sparkles' as SFSymbol, label: 'Adoring' },
    { symbol: 'gift.fill' as SFSymbol, label: 'Thoughtful' },
    { symbol: 'person.2.fill' as SFSymbol, label: 'Together' },
    { symbol: 'sparkles' as SFSymbol, label: 'Tender' },
    { symbol: 'sun.max.fill' as SFSymbol, label: 'Radiant' },
    { symbol: 'star.fill' as SFSymbol, label: 'Starry' },
  ],
  tired: [
    { symbol: 'bed.double.fill' as SFSymbol, label: 'Sleepy' },
    { symbol: 'moon.stars.fill' as SFSymbol, label: 'Resting' },
    { symbol: 'moon.stars.fill' as SFSymbol, label: 'Drained' },
    { symbol: 'eye.slash' as SFSymbol, label: 'Low energy' },
    { symbol: 'battery.25' as SFSymbol, label: 'Low battery' },
    { symbol: 'cloud.moon.fill' as SFSymbol, label: 'Quiet night' },
    { symbol: 'cup.and.saucer.fill' as SFSymbol, label: 'Need a break' },
    { symbol: 'moon.stars.fill' as SFSymbol, label: 'Late night' },
  ],
  focused: [
    { symbol: 'target' as SFSymbol, label: 'Locked in' },
    { symbol: 'brain.head.profile' as SFSymbol, label: 'Deep focus' },
    { symbol: 'pencil' as SFSymbol, label: 'Making progress' },
    { symbol: 'doc.text' as SFSymbol, label: 'Organized' },
    { symbol: 'magnifyingglass' as SFSymbol, label: 'Investigating' },
    { symbol: 'checkmark.seal.fill' as SFSymbol, label: 'On track' },
    { symbol: 'lightbulb.fill' as SFSymbol, label: 'Inspired' },
    { symbol: 'book.fill' as SFSymbol, label: 'Studying' },
  ],
  playful: [
    { symbol: 'gamecontroller.fill' as SFSymbol, label: 'Playful' },
    { symbol: 'sparkles' as SFSymbol, label: 'Random' },
    { symbol: 'sparkles' as SFSymbol, label: 'Whimsical' },
    { symbol: 'music.note' as SFSymbol, label: 'Bopping' },
    { symbol: 'sparkles' as SFSymbol, label: 'Silly' },
    { symbol: 'star.fill' as SFSymbol, label: 'Spark' },
    { symbol: 'sparkles' as SFSymbol, label: 'Fun' },
    { symbol: 'face.smiling' as SFSymbol, label: 'Goofy' },
  ],
  grateful: [
    { symbol: 'sparkles' as SFSymbol, label: 'Grateful' },
    { symbol: 'leaf.fill' as SFSymbol, label: 'Grounded' },
    { symbol: 'sun.max.fill' as SFSymbol, label: 'Thankful' },
    { symbol: 'sparkles' as SFSymbol, label: 'Blessed' },
    { symbol: 'heart.fill' as SFSymbol, label: 'Appreciative' },
    { symbol: 'gift.fill' as SFSymbol, label: 'Gifted' },
    { symbol: 'globe.americas.fill' as SFSymbol, label: 'Connected' },
    { symbol: 'star.fill' as SFSymbol, label: 'Shining' },
  ],
};

export const allMoodOptions: MoodOption[] = Object.values(moodCategories).flat();

const moodSymbolLabels: Record<string, string> = allMoodOptions.reduce(
  (acc, option) => {
    if (!acc[option.symbol as string]) {
      acc[option.symbol as string] = option.label;
    }
    return acc;
  },
  {} as Record<string, string>
);

const moodEmojiFallback: Record<string, SFSymbol> = {
  '😊': 'face.smiling' as SFSymbol,
  '😄': 'face.smiling' as SFSymbol,
  '😁': 'face.smiling' as SFSymbol,
  '🥰': 'heart.fill' as SFSymbol,
  '😍': 'heart.fill' as SFSymbol,
  '🤗': 'sparkles' as SFSymbol,
  '✨': 'sparkles' as SFSymbol,
  '🌟': 'star.fill' as SFSymbol,
  '😌': 'moon.stars.fill' as SFSymbol,
  '😎': 'sun.max.fill' as SFSymbol,
  '🧘': 'leaf.fill' as SFSymbol,
  '☕': 'cup.and.saucer.fill' as SFSymbol,
  '🌿': 'leaf.fill' as SFSymbol,
  '💆': 'sparkles' as SFSymbol,
  '🎧': 'headphones' as SFSymbol,
  '📚': 'book.fill' as SFSymbol,
  '🎉': 'party.popper.fill' as SFSymbol,
  '🔥': 'flame.fill' as SFSymbol,
  '⚡': 'bolt.fill' as SFSymbol,
  '🚀': 'rocket.fill' as SFSymbol,
  '💪': 'hand.thumbsup.fill' as SFSymbol,
  '🏆': 'trophy.fill' as SFSymbol,
  '🎊': 'sparkles' as SFSymbol,
  '💥': 'sparkles' as SFSymbol,
  '❤️': 'heart.fill' as SFSymbol,
  '💕': 'heart.fill' as SFSymbol,
  '💗': 'heart.fill' as SFSymbol,
  '💖': 'heart.circle.fill' as SFSymbol,
  '😘': 'heart.circle.fill' as SFSymbol,
  '🥺': 'heart.fill' as SFSymbol,
  '💝': 'gift.fill' as SFSymbol,
  '💞': 'heart.fill' as SFSymbol,
  '😴': 'bed.double.fill' as SFSymbol,
  '🥱': 'moon.stars.fill' as SFSymbol,
  '😪': 'moon.stars.fill' as SFSymbol,
  '💤': 'moon.stars.fill' as SFSymbol,
  '🛌': 'bed.double.fill' as SFSymbol,
  '😮‍💨': 'cloud.moon.fill' as SFSymbol,
  '🫠': 'battery.25' as SFSymbol,
  '😵': 'eye.slash' as SFSymbol,
  '🎯': 'target' as SFSymbol,
  '💻': 'doc.text' as SFSymbol,
  '📝': 'pencil' as SFSymbol,
  '🧠': 'brain.head.profile' as SFSymbol,
  '💡': 'lightbulb.fill' as SFSymbol,
  '📖': 'book.fill' as SFSymbol,
  '✍️': 'pencil' as SFSymbol,
  '🔍': 'magnifyingglass' as SFSymbol,
  '😜': 'face.smiling' as SFSymbol,
  '🤪': 'sparkles' as SFSymbol,
  '😝': 'face.smiling' as SFSymbol,
  '🤭': 'face.smiling' as SFSymbol,
  '😋': 'face.smiling' as SFSymbol,
  '🤡': 'sparkles' as SFSymbol,
  '🎮': 'gamecontroller.fill' as SFSymbol,
  '🎲': 'sparkles' as SFSymbol,
  '🙏': 'sparkles' as SFSymbol,
  '💫': 'sparkles' as SFSymbol,
  '🌈': 'sparkles' as SFSymbol,
  '☀️': 'sun.max.fill' as SFSymbol,
  '🌸': 'sparkles' as SFSymbol,
  '🦋': 'sparkles' as SFSymbol,
  '🌻': 'sun.max.fill' as SFSymbol,
  '🍀': 'leaf.fill' as SFSymbol,
  '😶': 'face.smiling' as SFSymbol,
};

export function resolveMoodSymbol(value?: string | null): SFSymbol {
  if (!value) {
    return 'sparkles' as SFSymbol;
  }

  if (value.includes('.') || moodSymbolLabels[value]) {
    return value as SFSymbol;
  }

  return moodEmojiFallback[value] || ('sparkles' as SFSymbol);
}

export function getMoodLabel(value?: string | null): string {
  const symbol = resolveMoodSymbol(value);
  return moodSymbolLabels[symbol as string] || 'Mood';
}

export interface ReactionOption {
  symbol: SFSymbol;
  label: string;
}

export const quickReactions: ReactionOption[] = [
  { symbol: 'heart.fill' as SFSymbol, label: 'Love' },
  { symbol: 'face.smiling' as SFSymbol, label: 'Laugh' },
  { symbol: 'sparkles' as SFSymbol, label: 'Wow' },
  { symbol: 'flame.fill' as SFSymbol, label: 'Fire' },
  { symbol: 'hand.thumbsup.fill' as SFSymbol, label: 'Applause' },
];

const reactionEmojiFallback: Record<string, SFSymbol> = {
  '❤️': 'heart.fill' as SFSymbol,
  '😂': 'face.smiling' as SFSymbol,
  '😮': 'sparkles' as SFSymbol,
  '🔥': 'flame.fill' as SFSymbol,
  '👏': 'hand.thumbsup.fill' as SFSymbol,
};

export function resolveReactionSymbol(value?: string | null): SFSymbol {
  if (!value) {
    return 'heart.fill' as SFSymbol;
  }

  const reactionSymbols = new Set(quickReactions.map((reaction) => reaction.symbol));
  if (value.includes('.') || reactionSymbols.has(value as SFSymbol)) {
    return value as SFSymbol;
  }

  return reactionEmojiFallback[value] || ('heart.fill' as SFSymbol);
}

export function getReactionLabel(value?: string | null): string {
  const symbol = resolveReactionSymbol(value);
  const match = quickReactions.find((reaction) => reaction.symbol === symbol);
  return match?.label || 'Reaction';
}
