/**
 * Game Play Screen - Tic-Tac-Toe
 * Interactive game board with animations and haptic feedback
 *
 * Best Practices Applied:
 * - Lucide icons (consistent icon library)
 * - Optimized Zustand selectors
 * - useReducedMotion for accessibility
 * - Proper accessibility labels on all interactive elements
 * - Ternary conditional rendering (not &&)
 * - Animated components with spring physics
 * - Implements all 4 UI states: Loading, Error, Empty, Ideal
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Gamepad2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Avatar, PressableFeedback } from 'heroui-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useReducedMotion,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

import { useGameStore, checkWinner, checkDraw } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/providers/ThemeProvider';
import { colors as themeColors } from '@/lib/theme';
import { playSound } from '@/lib/sounds';
import type { CellValue } from '@/stores/gameStore';

// State components
import { SkeletonGameBoard } from '@/components/states/loading';
import { NetworkError } from '@/components/states/error';

function GameCell({
  value,
  index,
  onPress,
  isWinningCell,
  disabled,
  reducedMotion,
}: {
  value: CellValue;
  index: number;
  onPress: () => void;
  isWinningCell: boolean;
  disabled: boolean;
  reducedMotion: boolean;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (disabled || value) return;
    if (!reducedMotion) {
      scale.value = withSequence(
        withTiming(0.9, { duration: 50 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    }
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getCellColor = () => {
    if (!value) return 'transparent';
    if (isWinningCell) return themeColors.warning;
    return value === 'X' ? themeColors.primary.DEFAULT : themeColors.accent.DEFAULT;
  };

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.delay(index * 50).springify()}
      style={animatedStyle}
    >
      <PressableFeedback
        onPress={handlePress}
        isDisabled={disabled || !!value}
        accessibilityRole="button"
        accessibilityLabel={`Cell ${index + 1}, ${value ? `contains ${value}` : 'empty'}`}
        accessibilityHint={disabled || value ? undefined : 'Tap to place your mark'}
        accessibilityState={{ disabled: disabled || !!value }}
        style={[
          styles.cell,
          {
            backgroundColor: value
              ? `${getCellColor()}20`
              : colors.background.secondary,
            borderWidth: isWinningCell ? 3 : 0,
            borderColor: themeColors.warning,
          },
        ]}
      >
        {value ? (
          <Animated.Text
            entering={reducedMotion ? undefined : FadeIn.springify()}
            style={[styles.cellText, { color: getCellColor() }]}
          >
            {value}
          </Animated.Text>
        ) : null}
      </PressableFeedback>
    </Animated.View>
  );
}

export default function GamePlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // ✅ OPTIMIZED: Individual selectors instead of destructuring
  const getGameById = useGameStore((state) => state.getGameById);
  const makeMove = useGameStore((state) => state.makeMove);
  const completeGame = useGameStore((state) => state.completeGame);
  const user = useAuthStore((state) => state.user);

  // ✅ ACCESSIBILITY: Check for reduced motion preference
  const reducedMotion = useReducedMotion() ?? false;

  const game = getGameById(id);

  // Simulate initial load for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const winner = useMemo(() => {
    if (!game) return null;
    return checkWinner(game.board);
  }, [game?.board]);

  const isDraw = useMemo(() => {
    if (!game || winner) return false;
    return checkDraw(game.board);
  }, [game?.board, winner]);

  const winningCells = useMemo(() => {
    if (!game || !winner) return [];
    const WINNING_LINES = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const line of WINNING_LINES) {
      const [a, b, c] = line;
      if (
        game.board[a] &&
        game.board[a] === game.board[b] &&
        game.board[a] === game.board[c]
      ) {
        return line;
      }
    }
    return [];
  }, [game?.board, winner]);

  const isMyTurn = game?.currentTurn === user?.id && game?.status === 'active';
  const amPlayer1 = game?.player1Id === user?.id;
  const mySymbol = amPlayer1 ? 'X' : 'O';

  const handleCellPress = useCallback(
    (position: number) => {
      if (!game || !user || !isMyTurn) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSound('move', 0.4);
      makeMove(game.id, position, user.id);

      // Check for win/draw after move
      setTimeout(() => {
        const updatedGame = getGameById(game.id);
        if (!updatedGame) return;

        const newWinner = checkWinner(updatedGame.board);
        const newDraw = checkDraw(updatedGame.board);

        if (newWinner) {
          const winnerId =
            newWinner === 'X' ? updatedGame.player1Id : updatedGame.player2Id;
          completeGame(game.id, winnerId);
          Haptics.notificationAsync(
            winnerId === user.id
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning
          );
          playSound(winnerId === user.id ? 'victory' : 'error', 0.6);
        } else if (newDraw) {
          completeGame(game.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          playSound('error', 0.4);
        }
      }, 100);
    },
    [game, user, isMyTurn, makeMove, getGameById, completeGame]
  );

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, []);

  const handleRematch = useCallback(() => {
    Haptics.selectionAsync();
    Alert.alert('Rematch', 'Rematch feature coming soon!');
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.DEFAULT }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <PressableFeedback
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
          >
            <ChevronLeft size={22} color={colors.text.DEFAULT} />
          </PressableFeedback>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
              Tic-Tac-Toe
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <SkeletonGameBoard />
        </View>
      </SafeAreaView>
    );
  }

  // Game not found (error-like state)
  if (!game) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.DEFAULT }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <PressableFeedback
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
          >
            <ChevronLeft size={22} color={colors.text.DEFAULT} />
          </PressableFeedback>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
              Tic-Tac-Toe
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <NetworkError
            onRetry={handleBack}
            title="Game Not Found"
            message="This game may have been deleted or doesn't exist."
          />
        </View>
      </SafeAreaView>
    );
  }

  const opponent = amPlayer1
    ? { name: game.player2Name, id: game.player2Id }
    : { name: game.player1Name, id: game.player1Id };

  const getStatusText = () => {
    if (game.status === 'finished') {
      if (isDraw) return "It's a draw!";
      if (game.winnerId === user?.id) return 'You won!';
      return `${opponent.name} won`;
    }
    if (isMyTurn) return 'Your turn';
    return `${opponent.name}'s turn`;
  };

  const getStatusColor = () => {
    if (game.status === 'finished') {
      if (isDraw) return colors.text.secondary;
      if (game.winnerId === user?.id) return themeColors.warning;
      return themeColors.primary.DEFAULT;
    }
    return isMyTurn ? themeColors.accent.DEFAULT : colors.text.secondary;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.DEFAULT }]}
      edges={['top']}
    >
      {/* Header */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()}
        style={styles.header}
      >
        <PressableFeedback
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
          style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
        >
          <ChevronLeft size={22} color={colors.text.DEFAULT} />
        </PressableFeedback>

        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: colors.success.DEFAULT }]}>
            <Gamepad2 size={16} color={colors.text.inverse} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
            Tic-Tac-Toe
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Players */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(100).springify()}
        style={styles.playersContainer}
        accessibilityRole="text"
        accessibilityLabel={`You playing as ${mySymbol} versus ${opponent.name}`}
      >
        {/* You */}
        <View style={styles.playerCard}>
          <View
            style={[
              styles.avatarWrapper,
              {
                borderColor: isMyTurn && game.status === 'active'
                  ? themeColors.accent.DEFAULT
                  : 'transparent',
                borderWidth: isMyTurn && game.status === 'active' ? 2 : 0,
              },
            ]}
          >
            <Avatar size="md" alt={user?.displayName || 'You'}>
              {user?.avatarUrl ? (
                <Avatar.Image source={{ uri: user.avatarUrl }} />
              ) : null}
              <Avatar.Fallback style={{ backgroundColor: themeColors.primary.DEFAULT }}>
                <Text style={[styles.avatarFallback, { color: colors.text.inverse }]}>
                  {(user?.displayName || 'Y').charAt(0).toUpperCase()}
                </Text>
              </Avatar.Fallback>
            </Avatar>
          </View>
          <Text style={[styles.playerName, { color: colors.text.DEFAULT }]}>
            You ({mySymbol})
          </Text>
        </View>

        {/* VS */}
        <Text style={[styles.vsText, { color: colors.text.tertiary }]}>
          VS
        </Text>

        {/* Opponent */}
        <View style={styles.playerCard}>
          <View
            style={[
              styles.avatarWrapper,
              {
                borderColor: !isMyTurn && game.status === 'active'
                  ? themeColors.accent.DEFAULT
                  : 'transparent',
                borderWidth: !isMyTurn && game.status === 'active' ? 2 : 0,
              },
            ]}
          >
            <Avatar size="md" alt={opponent.name}>
              <Avatar.Fallback style={{ backgroundColor: themeColors.accent.DEFAULT }}>
                <Text style={[styles.avatarFallback, { color: colors.text.inverse }]}>
                  {opponent.name.charAt(0).toUpperCase()}
                </Text>
              </Avatar.Fallback>
            </Avatar>
          </View>
          <Text style={[styles.playerName, { color: colors.text.DEFAULT }]}>
            {opponent.name} ({amPlayer1 ? 'O' : 'X'})
          </Text>
        </View>
      </Animated.View>

      {/* Status */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(200).springify()}
        style={styles.statusContainer}
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
      >
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </Animated.View>

      {/* Game Board */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(300).springify()}
        style={styles.boardContainer}
        accessibilityRole="none"
        accessibilityLabel="Tic Tac Toe game board"
      >
        <View style={[styles.board, { backgroundColor: colors.background.secondary }]}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.row}>
              {[0, 1, 2].map((col) => {
                const index = row * 3 + col;
                return (
                  <GameCell
                    key={index}
                    value={game.board[index]}
                    index={index}
                    onPress={() => handleCellPress(index)}
                    isWinningCell={winningCells.includes(index)}
                    disabled={!isMyTurn || game.status === 'finished'}
                    reducedMotion={reducedMotion}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Actions for finished game */}
      {game.status === 'finished' ? (
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.delay(500).springify()}
          style={styles.actionsContainer}
        >
          <PressableFeedback
            onPress={handleRematch}
            accessibilityRole="button"
            accessibilityLabel="Play again"
            accessibilityHint="Start a new game with the same opponent"
            style={[styles.rematchButton, { backgroundColor: themeColors.primary.DEFAULT }]}
          >
            <Text style={[styles.rematchText, { color: colors.text.inverse }]}>Rematch</Text>
          </PressableFeedback>
          <PressableFeedback
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go to home"
            style={[styles.homeButton, { backgroundColor: colors.background.secondary }]}
          >
            <Text style={[styles.homeText, { color: colors.text.DEFAULT }]}>
              Back to Home
            </Text>
          </PressableFeedback>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 32,
  },
  playerCard: {
    alignItems: 'center',
  },
  avatarWrapper: {
    padding: 4,
    borderRadius: 28,
  },
  avatarFallback: {
    fontSize: 18,
    fontWeight: '700',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  vsText: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
  },
  boardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    padding: 16,
    borderRadius: 23,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    margin: 4,
  },
  cellText: {
    fontSize: 48,
    fontWeight: '700',
  },
  actionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  rematchButton: {
    paddingVertical: 16,
    borderRadius: 23,
    alignItems: 'center',
  },
  rematchText: {
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    paddingVertical: 16,
    borderRadius: 23,
    alignItems: 'center',
  },
  homeText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
