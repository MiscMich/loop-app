/**
 * GameBoard - Tic Tac Toe game component
 * Uses HeroUI Button + PressableFeedback + Tailwind
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Button, PressableFeedback } from 'heroui-native';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import type { TicTacToeGame, CellValue } from '@/stores/gameStore';

interface GameBoardProps {
  game: TicTacToeGame;
  currentUserId: string;
  onMove: (position: number) => void;
  onRematch?: () => void;
}

export function GameBoard({
  game,
  currentUserId,
  onMove,
  onRematch,
}: GameBoardProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const boardSize = Math.min(screenWidth - 64, 320);
  const cellSize = boardSize / 3;
  const isMyTurn = game.currentTurn === currentUserId;
  const isPlayer1 = currentUserId === game.player1Id;
  const mySymbol: CellValue = isPlayer1 ? 'X' : 'O';
  const isFinished = game.status === 'finished';
  const isWinner = game.winnerId === currentUserId;
  const isDraw = isFinished && !game.winnerId;

  const opponentName = isPlayer1 ? game.player2Name : game.player1Name;

  const winningLine = useMemo(() => {
    if (!isFinished || isDraw) return null;

    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (
        game.board[a] &&
        game.board[a] === game.board[b] &&
        game.board[a] === game.board[c]
      ) {
        return [a, b, c];
      }
    }
    return null;
  }, [game.board, isFinished, isDraw]);

  const handleCellPress = useCallback((position: number) => {
    if (!isMyTurn || isFinished || game.board[position]) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMove(position);
  }, [isMyTurn, isFinished, game.board, onMove]);

  const renderCell = (position: number) => {
    const value = game.board[position];
    const isWinningCell = winningLine?.includes(position);
    const isPlayable = isMyTurn && !isFinished && !value;

    const borderRight = position % 3 !== 2;
    const borderBottom = position < 6;

    return (
      <Pressable
        key={position}
        className={`justify-center items-center bg-white ${
          borderRight ? 'border-r-2 border-r-gray-200' : ''
        } ${borderBottom ? 'border-b-2 border-b-gray-200' : ''} ${
          isWinningCell ? 'bg-green-100' : ''
        }`}
        style={[
          { width: cellSize, height: cellSize },
          isPlayable ? { backgroundColor: colors.background.secondary } : null,
        ]}
        onPress={() => handleCellPress(position)}
        disabled={!isPlayable}
      >
        {value === 'X' && (
          <Text className="text-5xl font-bold text-primary">X</Text>
        )}
        {value === 'O' && (
          <Text className="text-5xl font-bold text-accent">O</Text>
        )}
        {!value && isPlayable && (
          <View className="w-2 h-2 rounded-full bg-gray-200" />
        )}
      </Pressable>
    );
  };

  const getStatusMessage = () => {
    if (isFinished) {
      if (isDraw) return "It's a draw!";
      if (isWinner) return 'You won!';
      return `${opponentName} won`;
    }
    if (isMyTurn) return 'Your turn';
    return `${opponentName}'s turn`;
  };

  const getStatusClassName = () => {
    if (!isFinished) return '';
    if (isWinner) return 'bg-green-100';
    if (isDraw) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getStatusBgStyle = () => {
    if (!isFinished) return { backgroundColor: colors.background.secondary };
    return undefined;
  };

  const handleRematch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRematch?.();
  };

  return (
    <View className="flex-1 p-6 items-center" style={{ backgroundColor: colors.background.DEFAULT }}>
      {/* Player Info */}
      <View className="flex-row items-center gap-4 mb-6">
        <View
          className={`items-center p-3 rounded-2xl min-w-[100px] ${
            isMyTurn && !isFinished ? 'bg-teal-50 border-2 border-accent' : ''
          }`}
          style={!(isMyTurn && !isFinished) ? { backgroundColor: colors.background.secondary } : undefined}
        >
          <Text className="text-3xl font-bold mb-1" style={{ color: colors.text.DEFAULT }}>
            {mySymbol}
          </Text>
          <Text className="text-xs" style={{ color: colors.text.tertiary }}>
            You
          </Text>
          {isMyTurn && !isFinished && (
            <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent" />
          )}
        </View>

        <Text className="text-sm" style={{ color: colors.text.tertiary }}>vs</Text>

        <View
          className={`items-center p-3 rounded-2xl min-w-[100px] ${
            !isMyTurn && !isFinished ? 'bg-teal-50 border-2 border-accent' : ''
          }`}
          style={!(!isMyTurn && !isFinished) ? { backgroundColor: colors.background.secondary } : undefined}
        >
          <Text className="text-3xl font-bold mb-1" style={{ color: colors.text.DEFAULT }}>
            {mySymbol === 'X' ? 'O' : 'X'}
          </Text>
          <Text className="text-xs" style={{ color: colors.text.tertiary }}>
            {opponentName}
          </Text>
          {!isMyTurn && !isFinished && (
            <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent" />
          )}
        </View>
      </View>

      {/* Status */}
      <View
        className={`px-6 py-3 rounded-full mb-6 ${getStatusClassName()}`}
        style={getStatusBgStyle()}
      >
        <Text className="text-lg font-semibold" style={{ color: colors.text.DEFAULT }}>
          {getStatusMessage()}
        </Text>
      </View>

      {/* Game Board */}
      <View
        className="bg-white rounded-[20px] overflow-hidden shadow-lg"
        style={{ width: boardSize, height: boardSize, borderCurve: 'continuous' }}
      >
        <View className="flex-1 flex-row flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((position) => renderCell(position))}
        </View>
      </View>

      {/* Rematch Button */}
      {isFinished && onRematch && (
        <Button
          variant="primary"
          size="lg"
          onPress={handleRematch}
          className="mt-6 bg-accent"
          pressableFeedbackVariant="highlight"
        >
          <SafeSymbol name="arrow.clockwise" size={20} tintColor={colors.text.inverse} />
          <Button.Label>Rematch</Button.Label>
        </Button>
      )}

      {/* Move History */}
      {game.moves.length > 0 && (
        <View className="mt-6 w-full">
          <Text className="text-xs uppercase tracking-wider mb-2" style={{ color: colors.text.tertiary }}>
            Moves
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {game.moves.slice(-6).map((move, index) => (
              <View
                key={index}
                className="px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: colors.background.secondary }}
              >
                <Text className="text-xs" style={{ color: colors.text.secondary }}>
                  {move.playerId === currentUserId ? 'You' : opponentName}
                  {' → '}
                  {move.position + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default GameBoard;
