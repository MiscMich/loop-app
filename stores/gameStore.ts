import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ssrSafeStorage } from '@/lib/ssrStorage';
import { track, AnalyticsEvent } from '@/lib/analytics';

export type CellValue = 'X' | 'O' | null;
export type GameStatus = 'waiting' | 'active' | 'finished';
export type GameResult = 'win' | 'lose' | 'draw' | null;

export interface TicTacToeGame {
  id: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  board: CellValue[];
  currentTurn: string; // player ID
  status: GameStatus;
  winnerId?: string;
  createdAt: string;
  updatedAt: string;
  moves: GameMove[];
}

export interface GameMove {
  playerId: string;
  position: number;
  timestamp: string;
}

interface GameState {
  activeGames: TicTacToeGame[];
  completedGames: TicTacToeGame[];
  isLoading: boolean;

  // Actions
  setActiveGames: (games: TicTacToeGame[]) => void;
  addGame: (game: TicTacToeGame) => void;
  updateGame: (gameId: string, updates: Partial<TicTacToeGame>) => void;
  makeMove: (gameId: string, position: number, playerId: string) => void;
  completeGame: (gameId: string, winnerId?: string) => void;
  setLoading: (loading: boolean) => void;
  getGameById: (id: string) => TicTacToeGame | undefined;
  getMyTurnGames: (userId: string) => TicTacToeGame[];
}

// Winning combinations for tic-tac-toe
const WINNING_LINES = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left column
  [1, 4, 7], // middle column
  [2, 5, 8], // right column
  [0, 4, 8], // diagonal
  [2, 4, 6], // anti-diagonal
];

// Valid cell values for tic-tac-toe
const VALID_CELL_VALUES: readonly (CellValue)[] = ['X', 'O', null] as const;

const isValidCellValue = (value: unknown): value is CellValue => {
  return VALID_CELL_VALUES.includes(value as CellValue);
};

export const checkWinner = (board: CellValue[]): CellValue => {
  // Validate board structure
  if (!Array.isArray(board) || board.length !== 9) {
    throw new Error('Invalid board: must be an array of exactly 9 elements');
  }

  // Validate all cell values
  for (let i = 0; i < board.length; i++) {
    if (!isValidCellValue(board[i])) {
      throw new Error(`Invalid board: cell at position ${i} has invalid value "${board[i]}"`);
    }
  }

  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

export const checkDraw = (board: CellValue[]): boolean => {
  return board.every((cell) => cell !== null) && !checkWinner(board);
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      activeGames: [],
      completedGames: [],
      isLoading: false,

      setActiveGames: (activeGames) => set({ activeGames }),

      addGame: (game) => {
        set((state) => ({
          activeGames: [...state.activeGames, game],
        }));

        // Track game started
        track(AnalyticsEvent.GAME_STARTED, {
          gameId: game.id,
          gameType: 'tictactoe',
          opponentId: game.player2Id,
        });
      },

      updateGame: (gameId, updates) =>
        set((state) => ({
          activeGames: state.activeGames.map((g) =>
            g.id === gameId ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
          ),
        })),

      makeMove: (gameId, position, playerId) => {
        const state = get();
        const game = state.activeGames.find((g) => g.id === gameId);
        if (!game || game.status !== 'active') return;
        if (game.currentTurn !== playerId) return;
        if (game.board[position] !== null) return;

        const isPlayer1 = playerId === game.player1Id;
        const symbol: CellValue = isPlayer1 ? 'X' : 'O';
        const newBoard = [...game.board];
        newBoard[position] = symbol;

        const newMove: GameMove = {
          playerId,
          position,
          timestamp: new Date().toISOString(),
        };

        const winner = checkWinner(newBoard);
        const isDraw = checkDraw(newBoard);

        const updatedGame: TicTacToeGame = {
          ...game,
          board: newBoard,
          moves: [...game.moves, newMove],
          currentTurn: isPlayer1 ? game.player2Id : game.player1Id,
          updatedAt: new Date().toISOString(),
          status: winner || isDraw ? 'finished' : 'active',
          winnerId: winner ? playerId : undefined,
        };

        // Track move made
        track(AnalyticsEvent.GAME_MOVE_MADE, {
          gameId,
          gameType: 'tictactoe',
          moveNumber: game.moves.length + 1,
        });

        if (winner || isDraw) {
          set({
            activeGames: state.activeGames.filter((g) => g.id !== gameId),
            completedGames: [...state.completedGames, updatedGame].slice(0, 50), // Keep max 50 completed games
          });

          // Track game completed
          const result = winner ? (playerId === game.player1Id ? 'win' : 'lose') : 'draw';
          track(AnalyticsEvent.GAME_COMPLETED, {
            gameId,
            gameType: 'tictactoe',
            result,
            movesCount: updatedGame.moves.length,
          });

          // Track specific outcome
          if (winner) {
            track(playerId === game.player1Id ? AnalyticsEvent.GAME_WON : AnalyticsEvent.GAME_LOST, {
              gameId,
              gameType: 'tictactoe',
              movesCount: updatedGame.moves.length,
            });
          } else if (isDraw) {
            track(AnalyticsEvent.GAME_DRAW, {
              gameId,
              gameType: 'tictactoe',
              movesCount: updatedGame.moves.length,
            });
          }
          return;
        }

        set({
          activeGames: state.activeGames.map((g) =>
            g.id === gameId ? updatedGame : g
          ),
        });
      },

      completeGame: (gameId, winnerId) => {
        const state = get();
        const game = state.activeGames.find((g) => g.id === gameId);
        if (!game) return;

        const completedGame: TicTacToeGame = {
          ...game,
          status: 'finished',
          winnerId,
          updatedAt: new Date().toISOString(),
        };

        set({
          activeGames: state.activeGames.filter((g) => g.id !== gameId),
          completedGames: [...state.completedGames, completedGame].slice(0, 50), // Keep max 50 completed games
        });

        // Track game completed
        const isDraw = !winnerId;
        const result = isDraw ? 'draw' : (winnerId === game.player1Id ? 'win' : 'lose');
        track(AnalyticsEvent.GAME_COMPLETED, {
          gameId,
          gameType: 'tictactoe',
          result,
          movesCount: game.moves.length,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      getGameById: (id) => {
        const { activeGames, completedGames } = get();
        return (
          activeGames.find((g) => g.id === id) ||
          completedGames.find((g) => g.id === id)
        );
      },

      getMyTurnGames: (userId) =>
        get().activeGames.filter((g) => g.currentTurn === userId),
    }),
    {
      name: 'loop-game-storage',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        activeGames: state.activeGames,
        completedGames: state.completedGames.slice(0, 20), // Keep last 20 games
      }),
    }
  )
);

// Helper function to create a new game
export const createNewGame = (
  player1Id: string,
  player1Name: string,
  player2Id: string,
  player2Name: string
): TicTacToeGame => ({
  id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  player1Id,
  player1Name,
  player2Id,
  player2Name,
  board: Array(9).fill(null),
  currentTurn: player1Id,
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  moves: [],
});
