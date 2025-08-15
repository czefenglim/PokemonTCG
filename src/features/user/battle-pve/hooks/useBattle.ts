// ================================
// FILE: UI Integration Hook - /app/hooks/useBattle.ts
// ================================

import { useState, useEffect, useCallback } from 'react';
import {
  createBattle,
  loadBattle,
  sendBattleAction,
} from '@/lib/battle-pve/api-utils';

export interface BattleHookState {
  battleId: string | null;
  battleState: any;
  opponent: any;
  fetching: boolean; // initial loads only
  mutating: boolean; // in-flight actions (no UI blocking)
  error: string | null;
  battleEnded: boolean;
  winner: string | null;
}

export function useBattle() {
  const [state, setState] = useState<BattleHookState>({
    battleId: null,
    battleState: null,
    opponent: null,
    fetching: false,
    mutating: false,
    error: null,
    battleEnded: false,
    winner: null,
  });

  // Start a new battle
  const startBattle = useCallback(
    async (opponentId: string, deckId: string) => {
      setState((prev) => ({ ...prev, fetching: true, error: null }));

      try {
        const result = await createBattle(opponentId, deckId);
        setState((prev) => ({
          ...prev,
          battleId: result.battleId,
          battleState: result.state,
          opponent: result.opponent,
          fetching: false,
        }));

        return result.battleId;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          fetching: false,
          error:
            error instanceof Error ? error.message : 'Failed to start battle',
        }));
        throw error;
      }
    },
    []
  );

  // Load existing battle
  const loadExistingBattle = useCallback(async (battleId: string) => {
    setState((prev) => ({ ...prev, fetching: true, error: null }));

    try {
      const result = await loadBattle(battleId);
      setState((prev) => ({
        ...prev,
        battleId,
        battleState: result.state,
        opponent: result.opponent,
        fetching: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        fetching: false,
        error: error instanceof Error ? error.message : 'Failed to load battle',
      }));
      throw error;
    }
  }, []);

  // Send an action
  const performAction = useCallback(
    async (action: any) => {
      if (!state.battleId) {
        throw new Error('No active battle');
      }

      setState((prev) => ({ ...prev, mutating: true, error: null }));

      try {
        const result = await sendBattleAction(state.battleId, action);
        setState((prev) => ({
          ...prev,
          battleState: result.state,
          battleEnded: result.battleEnded,
          winner: result.winner,
          mutating: false,
        }));

        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          mutating: false,
          error:
            error instanceof Error ? error.message : 'Failed to perform action',
        }));
        throw error;
      }
    },
    [state.battleId]
  );

  // 🔧 FIX 2: Auto-run AI preparation phase when needed
  useEffect(() => {
    const checkAndRunAIPreparation = async () => {
      if (
        state.battleState &&
        state.battleId &&
        state.battleState.phase === 'PREPARATION' &&
        !state.battleState.active?.ai &&
        !state.fetching &&
        !state.mutating
      ) {
        try {
          await performAction({ type: 'AI_PREPARATION' });
        } catch {
          // silent
        }
      }
    };

    const timeoutId = setTimeout(checkAndRunAIPreparation, 100);
    return () => clearTimeout(timeoutId);
  }, [
    state.battleState,
    state.battleId,
    state.fetching,
    state.mutating,
    performAction,
  ]);

  return {
    ...state,
    startBattle,
    loadExistingBattle,
    performAction,
  };
}
