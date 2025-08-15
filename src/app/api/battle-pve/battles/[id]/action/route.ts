// D:\BlockchainAssignment\pokemon-tcg\src\app\api\battle-pve\battles\[id]\action\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireDbUser } from '@/lib/auth/auth-compat';
import {
  createBattleContext,
  applyAction,
  aiTurn,
  isBattleEnded,
  getBattleWinner,
  getCards,
  needsBenchPromotion,
  hasLostDueToNoPokemon,
} from '@/lib/battle-pve';
import { rehydrateContextFromState } from '@/lib/battle-pve/context-rehydrate';
import { updateProgressOnBattleEnd } from '@/lib/battle-pve/progress';
import type { BattleState, BattleAction } from '@/lib/battle-pve/state';

interface ActionRequest {
  type: string;
  cardIid?: string;
  targetIid?: string;
  attackIndex?: number;
  energyType?: string;
  position?: number;
  benchPosition?: number; // For bench promotion / retreat target
  attackerIid?: string; // optional alias used by UI
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== DEBUG: PATCH /api/pve/battles/[id]/action ===');
    const { id: battleId } = await context.params;

    const user = await requireDbUser(req);
    const actionData: ActionRequest = await req.json();
    console.log('Processing action:', actionData);

    const battle = await prisma.battle.findFirst({
      where: { id: battleId, userId: user.id },
      include: { opponent: true },
    });
    if (!battle) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }
    if (battle.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Battle is not active' },
        { status: 400 }
      );
    }

    const rawState = battle.state as unknown;
    let currentState: BattleState =
      typeof rawState === 'string'
        ? (JSON.parse(rawState) as BattleState)
        : (rawState as BattleState);

    // Rebuild runtime instances with persisted HP
    const contextObj = await createBattleContext();
    await rehydrateContextFromState(currentState, contextObj);

    // Check for immediate loss conditions
    if (hasLostDueToNoPokemon(currentState, 'PLAYER')) {
      console.log('🔍 Player has lost due to no Pokemon available');
      currentState.phase = 'ENDED';
      currentState.winner = 'AI';

      await prisma.battle.update({
        where: { id: battle.id },
        data: {
          status: 'LOST',
          winner: 'AI',
          endedAt: new Date(),
          state: currentState as any,
        },
      });

      const hydratedState = await hydrateForClient(currentState);
      return NextResponse.json(
        {
          success: true,
          state: hydratedState,
          battleEnded: true,
          winner: 'AI',
        },
        { status: 200 }
      );
    }

    if (hasLostDueToNoPokemon(currentState, 'AI')) {
      console.log('🔍 AI has lost due to no Pokemon available');
      currentState.phase = 'ENDED';
      currentState.winner = 'PLAYER';

      await prisma.battle.update({
        where: { id: battle.id },
        data: {
          status: 'WON',
          winner: 'PLAYER',
          endedAt: new Date(),
          state: currentState as any,
        },
      });

      const hydratedState = await hydrateForClient(currentState);
      return NextResponse.json(
        {
          success: true,
          state: hydratedState,
          battleEnded: true,
          winner: 'PLAYER',
        },
        { status: 200 }
      );
    }

    // Handle AI preparation phase
    if (actionData.type === 'AI_PREPARATION') {
      if (currentState.phase !== 'PREPARATION') {
        return NextResponse.json(
          { error: 'AI_PREPARATION only allowed during preparation phase' },
          { status: 400 }
        );
      }
      if (!currentState.active.ai) {
        currentState = await aiTurn(currentState, contextObj);
      }
      await prisma.battle.update({
        where: { id: battle.id },
        data: { state: currentState as any, updatedAt: new Date() },
      });
      const hydratedState = await hydrateForClient(currentState);
      return NextResponse.json(
        {
          success: true,
          state: hydratedState,
          battleEnded: false,
          winner: null,
        },
        { status: 200 }
      );
    }

    // Validate turn-based actions
    if (
      currentState.phase !== 'PREPARATION' &&
      currentState.phase !== 'PLAYER_TURN' &&
      actionData.type !== 'AI_PREPARATION'
    ) {
      return NextResponse.json({ error: "Not player's turn" }, { status: 400 });
    }

    // Block other actions if promotion pending
    const needsPromotion = currentState.flags?.needsBenchPromotion;
    if (
      needsPromotion &&
      needsPromotion.side === 'PLAYER' &&
      actionData.type !== 'PROMOTE_FROM_BENCH'
    ) {
      console.log(
        '❌ Player must promote from bench before taking other actions'
      );
      return NextResponse.json(
        {
          error: 'You must promote a Pokemon from bench to active slot first',
        },
        { status: 400 }
      );
    }

    // Build the battle action
    let battleAction: BattleAction;
    switch (actionData.type) {
      case 'PLACE_ACTIVE':
        battleAction = {
          type: 'PLACE_ACTIVE',
          side: 'PLAYER',
          cardIid: actionData.cardIid!,
        };
        break;
      case 'PLACE_BENCH':
        battleAction = {
          type: 'PLACE_BENCH',
          side: 'PLAYER',
          cardIid: actionData.cardIid!,
          position: actionData.position ?? 0,
        };
        break;
      case 'PROMOTE_FROM_BENCH':
        battleAction = {
          type: 'PROMOTE_FROM_BENCH',
          side: 'PLAYER',
          cardIid: actionData.cardIid!,
          benchPosition: actionData.benchPosition ?? 0,
        };
        break;
      case 'ATTACH_ENERGY':
        battleAction = {
          type: 'ATTACH_ENERGY',
          side: 'PLAYER',
          cardIid: actionData.cardIid!,
          energyType: actionData.energyType || 'COLORLESS',
        };
        break;
      case 'ATTACK':
        battleAction = {
          type: 'ATTACK',
          side: 'PLAYER',
          attackerIid: actionData.attackerIid || actionData.cardIid!,
          targetIid: actionData.targetIid!,
          attackIndex:
            typeof actionData.attackIndex === 'number'
              ? actionData.attackIndex
              : 0,
        };
        break;
      case 'RETREAT': // ✅ NEW
        battleAction = {
          type: 'RETREAT',
          side: 'PLAYER',
          benchPosition: actionData.benchPosition ?? 0,
        };
        break;
      case 'END_TURN':
        battleAction = { type: 'END_TURN', side: 'PLAYER' };
        break;
      case 'CONCEDE':
        battleAction = { type: 'CONCEDE', side: 'PLAYER' };
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Apply player action
    const afterPlayer = applyAction(currentState, battleAction, contextObj);
    if (!afterPlayer) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    currentState = afterPlayer;

    // Log the action
    await prisma.battleAction.create({
      data: {
        battleId: battle.id,
        turn: currentState.turn,
        actor: 'PLAYER',
        type: actionData.type,
        payload: actionData as any,
      },
    });

    // Check if battle ended after player action
    if (isBattleEnded(currentState)) {
      const winner = getBattleWinner(currentState);

      await prisma.battle.update({
        where: { id: battle.id },
        data: {
          status:
            winner === 'PLAYER'
              ? 'WON'
              : winner === 'AI'
              ? 'LOST'
              : 'ABANDONED',
          winner: winner ?? 'DRAW',
          endedAt: new Date(),
          state: currentState as any,
        },
      });

      // Update progress if there's a winner
      if (winner && winner !== 'DRAW') {
        try {
          const battleDuration = Math.floor(
            (new Date().getTime() - battle.createdAt.getTime()) / 1000
          );
          const battleResult = {
            battleId: battle.id,
            userId: user.id,
            opponentId: battle.opponentId,
            difficulty: battle.difficulty,
            winner: winner as 'PLAYER' | 'AI',
            duration: battleDuration,
            turnsPlayed: currentState.turn,
            playerFinalHP: winner === 'PLAYER' ? 80 : 0,
            aiFinalHP: winner === 'AI' ? 80 : 0,
          };
          await updateProgressOnBattleEnd(battleResult);
        } catch (progressError) {
          console.error('Failed to update progress:', progressError);
        }
      }

      const hydratedState = await hydrateForClient(currentState);
      return NextResponse.json(
        {
          success: true,
          state: hydratedState,
          battleEnded: true,
          winner: winner ?? null,
        },
        { status: 200 }
      );
    }

    // Handle AI turn if needed
    if (currentState.phase === 'AI_TURN') {
      console.log('🤖 Running AI turn...');

      // Check if AI needs bench promotion first
      if (needsBenchPromotion(currentState, 'AI')) {
        console.log('🤖 AI needs bench promotion');
        currentState = await aiTurn(currentState, contextObj);
      } else {
        currentState = await aiTurn(currentState, contextObj);
      }

      await prisma.battleAction.create({
        data: {
          battleId: battle.id,
          turn: currentState.turn,
          actor: 'AI',
          type: 'AI_TURN',
          payload: { aiTurn: true } as any,
        },
      });

      // Check if battle ended after AI turn
      const finalWinner = getBattleWinner(currentState);
      const finalBattleEnded = finalWinner || isBattleEnded(currentState);

      if (finalBattleEnded) {
        await prisma.battle.update({
          where: { id: battle.id },
          data: {
            status:
              finalWinner === 'PLAYER'
                ? 'WON'
                : finalWinner === 'AI'
                ? 'LOST'
                : 'ABANDONED',
            winner: finalWinner ?? 'DRAW',
            endedAt: new Date(),
            state: currentState as any,
          },
        });

        // Update progress
        if (finalWinner && finalWinner !== 'DRAW') {
          try {
            const battleDuration = Math.floor(
              (new Date().getTime() - battle.createdAt.getTime()) / 1000
            );
            const battleResult = {
              battleId: battle.id,
              userId: user.id,
              opponentId: battle.opponentId,
              difficulty: battle.difficulty,
              winner: finalWinner as 'PLAYER' | 'AI',
              duration: battleDuration,
              turnsPlayed: currentState.turn,
              playerFinalHP: finalWinner === 'PLAYER' ? 80 : 0,
              aiFinalHP: finalWinner === 'AI' ? 80 : 0,
            };
            await updateProgressOnBattleEnd(battleResult);
          } catch (progressError) {
            console.error('Failed to update progress:', progressError);
          }
        }

        const hydratedState = await hydrateForClient(currentState);
        return NextResponse.json(
          {
            success: true,
            state: hydratedState,
            battleEnded: true,
            winner: finalWinner ?? null,
          },
          { status: 200 }
        );
      }
    }

    // Update battle state
    await prisma.battle.update({
      where: { id: battle.id },
      data: { state: currentState as any, updatedAt: new Date() },
    });

    const hydratedState = await hydrateForClient(currentState);
    return NextResponse.json(
      {
        success: true,
        state: hydratedState,
        battleEnded: false,
        winner: null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('PATCH /api/pve/battles/[id]/action error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Failed to process action' },
      { status: 500 }
    );
  }
}

async function hydrateForClient(state: BattleState) {
  const allRefs = [
    ...(state.active.player ? [state.active.player] : []),
    ...(state.active.ai ? [state.active.ai] : []),
    ...state.hands.player,
    ...state.hands.ai,
    ...state.decks.player,
    ...state.decks.ai,
    ...state.discards.player,
    ...state.discards.ai,
    ...(state.bench.player.filter((c) => c !== null) as any[]),
    ...(state.bench.ai.filter((c) => c !== null) as any[]),
  ];
  const uniqueIds = [...new Set(allRefs.map((r) => r.id))];

  const cards = await getCards(uniqueIds);
  const map = new Map(cards.map((c) => [String(c.tokenId), c]));

  const hpOf = (iid: string, fallback: number) =>
    state.hpByIid?.[iid] ?? fallback;

  const hydrate = (ref?: { id: string; iid: string } | null) => {
    if (!ref) return null;
    const c = map.get(ref.id);
    return c
      ? {
          id: ref.iid,
          tokenId: ref.id,
          name: c.name,
          image: c.largeImage || c.smallImage,
          type: c.type,
          hp: hpOf(ref.iid, c.hp),
          maxHp: c.hp,
          attacks: c.attacks || [],
          weaknesses: c.weaknesses || [],
          resistances: c.resistances || [],
        }
      : null;
  };

  const hydratedState = {
    phase: state.phase,
    turn: state.turn,
    firstPlayer: state.firstPlayer,
    winner: state.winner ?? null,
    active: {
      player: state.active.player ? hydrate(state.active.player) : null,
      ai: state.active.ai ? hydrate(state.active.ai) : null,
    },
    hands: {
      player: state.hands.player.map(hydrate).filter(Boolean),
      ai: state.hands.ai.map(hydrate).filter(Boolean),
    },
    bench: {
      player: state.bench.player.map((c) => (c ? hydrate(c) : null)),
      ai: state.bench.ai.map((c) => (c ? hydrate(c) : null)),
    },
    decks: {
      player: state.decks.player.length,
      ai: state.decks.ai.length,
    },
    discards: {
      player: state.discards.player.map(hydrate).filter(Boolean),
      ai: state.discards.ai.map(hydrate).filter(Boolean),
    },
    prizes: state.prizes,
    energies: state.energies,
    canAttackThisTurn: state.canAttackThisTurn,
    legalMoves: state.legalMoves,
    flags: state.flags || {}, // Ensure flags are always included
  };

  // Debug log to ensure flags are included
  if (state.flags?.needsBenchPromotion) {
    console.log(
      '🔍 Hydrating state with bench promotion flag:',
      state.flags.needsBenchPromotion
    );
  }

  return hydratedState;
}
