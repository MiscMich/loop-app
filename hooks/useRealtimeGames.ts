import { useEffect, useCallback, useRef } from 'react';
import { supabase, canQuerySupabase, isValidUUID } from '@/lib/supabase';
import { useGameStore, TicTacToeGame, CellValue } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { supabaseRetry } from '@/lib/retry';
import { logger } from '@/lib/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Convert database game to store format
const convertToStoreGame = (dbGame: any, player1Name?: string, player2Name?: string): TicTacToeGame => ({
  id: dbGame.id,
  player1Id: dbGame.player1_id,
  player1Name: player1Name || 'Player 1',
  player2Id: dbGame.player2_id,
  player2Name: player2Name || 'Player 2',
  board: (dbGame.board as CellValue[]) || Array(9).fill(null),
  currentTurn: dbGame.current_turn,
  status: dbGame.status,
  winnerId: dbGame.winner_id,
  createdAt: dbGame.created_at,
  updatedAt: dbGame.updated_at,
  moves: [], // Moves are loaded separately if needed
});

export function useRealtimeGames() {
  const { user } = useAuthStore();
  const { setActiveGames, addGame, updateGame, completeGame } = useGameStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch active games with AbortController support
  const fetchGames = useCallback(async (signal?: AbortSignal) => {
    if (!user?.id || !canQuerySupabase(user.id)) return;

    try {
      // Check if request was cancelled
      if (signal?.aborted) return;

      const data = await supabaseRetry<any[]>(async () =>
        await supabase
          .from('loop_games')
          .select(`
            *,
            player1:loop_users!player1_id(display_name),
            player2:loop_users!player2_id(display_name)
          `)
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .neq('status', 'finished')
          .order('updated_at', { ascending: false })
          .abortSignal(signal as AbortSignal)
      );

      if (signal?.aborted) return;

      const games = data.map((g: any) => convertToStoreGame(
        g,
        g.player1?.display_name,
        g.player2?.display_name
      ));
      setActiveGames(games);
    } catch (err: any) {
      // Don't log aborted requests as errors
      if (err?.name === 'AbortError' || signal?.aborted) return;
      logger.error('Failed to fetch games after retries', { action: 'fetchGames', userId: user?.id }, err);
    }
  }, [user?.id, setActiveGames]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user?.id || !canQuerySupabase(user.id)) return;

    // CREATE ABORT CONTROLLER FIRST
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Create channel for game updates
    const channel = supabase
      .channel(`games:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loop_games',
        },
        async (payload: any) => {
          try {
            const isRelevant = payload.new.player1_id === user.id || payload.new.player2_id === user.id;
            if (!isRelevant) return;

            // Get player names
            const { data: players, error } = await supabase
              .from('loop_users')
              .select('id, display_name')
              .in('id', [payload.new.player1_id, payload.new.player2_id]);

            if (error) {
              logger.error('Failed to fetch player names', { action: 'gameInsertHandler', metadata: { gameId: payload.new.id } }, error);
              return;
            }

            const player1 = (players as any[])?.find((p: any) => p.id === payload.new.player1_id);
            const player2 = (players as any[])?.find((p: any) => p.id === payload.new.player2_id);

            const game = convertToStoreGame(
              payload.new,
              player1?.display_name,
              player2?.display_name
            );
            addGame(game);
          } catch (err) {
            logger.error('Error in game INSERT handler', { action: 'gameInsertHandler' }, err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loop_games',
        },
        (payload: any) => {
          const isRelevant = payload.new.player1_id === user.id || payload.new.player2_id === user.id;
          if (!isRelevant) return;

          if (payload.new.status === 'finished') {
            completeGame(payload.new.id, payload.new.winner_id);
          } else {
            updateGame(payload.new.id, {
              board: payload.new.board,
              currentTurn: payload.new.current_turn,
              status: payload.new.status,
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Fetch initial data with cancellation support
    fetchGames(abortController.signal);

    return () => {
      // Abort any in-flight requests
      abortController.abort();
      channel.unsubscribe();
    };
  }, [user?.id, setActiveGames, addGame, updateGame, completeGame, fetchGames]);

  // Public refresh method (no abort signal - user-initiated)
  const refresh = useCallback(() => fetchGames(undefined), [fetchGames]);

  return { refresh };
}

// Hook for game actions
export function useGameActions() {
  const { user } = useAuthStore();
  const { makeMove: localMakeMove } = useGameStore();

  const createGame = useCallback(async (opponentId: string): Promise<string | null> => {
    if (!user?.id) return null;
    if (!isValidUUID(opponentId)) {
      logger.error('Invalid opponent ID format', { action: 'createGame', metadata: { opponentId } });
      return null;
    }

    if (canQuerySupabase(user.id)) {
      const { data, error } = await (supabase
        .from('loop_games') as any)
        .insert({
          player1_id: user.id,
          player2_id: opponentId,
          current_turn: user.id,
          status: 'active',
          board: Array(9).fill(null),
        })
        .select()
        .single();

      if (error) {
        logger.error('Create game error', { action: 'createGame', userId: user.id, metadata: { opponentId } }, error);
        return null;
      }

      return (data as any)?.id || null;
    }

    // Local-only mode - use store's createNewGame
    const { createNewGame } = await import('@/stores/gameStore');
    const localGame = createNewGame(
      user.id,
      user.displayName || 'You',
      opponentId,
      'Opponent'
    );
    return localGame.id;
  }, [user]);

  const makeMove = useCallback(async (
    gameId: string,
    position: number
  ): Promise<boolean> => {
    if (!user?.id) return false;
    if (!isValidUUID(gameId)) {
      logger.error('Invalid game ID format', { action: 'makeMove', metadata: { gameId } });
      return false;
    }

    if (canQuerySupabase(user.id)) {
      // First, get current game state
      const { data: gameData, error: fetchError } = await supabase
        .from('loop_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (fetchError || !gameData) {
        logger.error('Fetch game error', { action: 'makeMove', metadata: { gameId } }, fetchError);
        return false;
      }

      const game = gameData as any;

      // Validate move
      if (game.current_turn !== user.id) return false;
      if (game.status !== 'active') return false;
      if (game.board[position] !== null) return false;

      // Make move
      const newBoard = [...game.board];
      const isPlayer1 = user.id === game.player1_id;
      newBoard[position] = isPlayer1 ? 'X' : 'O';

      // Check for winner
      const winner = checkWinner(newBoard);
      const isDraw = !winner && newBoard.every((cell: any) => cell !== null);

      // Update game
      const { error: updateError } = await (supabase
        .from('loop_games') as any)
        .update({
          board: newBoard,
          current_turn: isPlayer1 ? game.player2_id : game.player1_id,
          status: winner || isDraw ? 'finished' : 'active',
          winner_id: winner ? user.id : null,
        })
        .eq('id', gameId);

      if (updateError) {
        logger.error('Update game error', { action: 'makeMove', metadata: { gameId, position } }, updateError);
        return false;
      }

      // Record move
      try {
        const { error } = await supabase
          .from('loop_game_moves')
          .insert({
            game_id: gameId,
            player_id: user.id,
            position,
          } as any);
        if (error) {
          logger.error('Failed to record game move', { action: 'makeMove', metadata: { gameId, position } }, error);
        }
      } catch (err) {
        logger.error('Error recording game move', { action: 'makeMove', metadata: { gameId, position } }, err);
      }

      return true;
    }

    // Local-only mode
    localMakeMove(gameId, position, user.id);
    return true;
  }, [user, localMakeMove]);

  return { createGame, makeMove };
}

// Helper function to check winner
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6], // diagonals
];

function checkWinner(board: CellValue[]): CellValue {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}
