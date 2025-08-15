// app/api/battle-pve/battles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireDbUser } from '@/lib/auth/auth-compat';
import { getCards } from '@/lib/battle-pve';
import type { BattleState } from '@/lib/battle-pve/state';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== DEBUG: GET /api/battle-pve/battles/[id] ===');
    const { id: battleId } = await context.params;

    const user = await requireDbUser(req);

    const battle = await prisma.battle.findFirst({
      where: { id: battleId, userId: user.id },
      include: { opponent: true },
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }

    const rawState = battle.state as unknown;
    const battleState: BattleState =
      typeof rawState === 'string'
        ? (JSON.parse(rawState) as BattleState)
        : (rawState as BattleState);

    const allCardRefs = [
      ...(battleState.active.player ? [battleState.active.player] : []),
      ...(battleState.active.ai ? [battleState.active.ai] : []),
      ...battleState.hands.player,
      ...battleState.hands.ai,
      ...battleState.decks.player,
      ...battleState.decks.ai,
      ...battleState.discards.player,
      ...battleState.discards.ai,
      ...battleState.bench.player.filter(Boolean),
      ...battleState.bench.ai.filter(Boolean),
    ] as { id: string; iid: string }[];

    const uniqueCardIds = [...new Set(allCardRefs.map((r) => r.id))];
    const cardDataList = await getCards(uniqueCardIds);
    const cardDataMap = new Map(
      cardDataList.map((c) => [String(c.tokenId), c])
    );

    const hydratedState = hydrateBattleState(battleState, cardDataMap);

    return NextResponse.json(
      {
        battle: {
          id: battle.id,
          status: battle.status,
          difficulty: battle.difficulty,
          createdAt: battle.createdAt,
          updatedAt: battle.updatedAt,
          endedAt: battle.endedAt,
          winner: battle.winner ?? null,
        },
        opponent: {
          id: battle.opponent.id,
          name: battle.opponent.name,
          element: battle.opponent.element,
          difficulty: battle.opponent.difficulty,
          portraitUrl: battle.opponent.portraitUrl,
        },
        state: hydratedState,
        battleEnded: battle.status !== 'ACTIVE',
        winner: battle.winner,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('GET /api/battle-pve/battles/[id] error:', err);
    const message = err?.message ?? 'Failed to load battle';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function hydrateBattleState(state: BattleState, cardDataMap: Map<string, any>) {
  const hpOf = (iid: string, fallback: number) =>
    state.hpByIid?.[iid] ?? fallback;

  const hydrateCard = (ref: { id: string; iid: string }) => {
    const c = cardDataMap.get(ref.id);
    return c
      ? {
          id: ref.iid,
          tokenId: ref.id,
          name: c.name,
          image: c.largeImage || c.smallImage,
          type: c.type,
          hp: hpOf(ref.iid, c.hp), // <-- current HP
          maxHp: c.hp,
          attacks: c.attacks || [],
          weaknesses: c.weaknesses || [],
          resistances: c.resistances || [],
        }
      : null;
  };

  return {
    phase: state.phase,
    turn: state.turn,
    firstPlayer: state.firstPlayer,
    winner: state.winner ?? null,
    active: {
      player: state.active.player ? hydrateCard(state.active.player) : null,
      ai: state.active.ai ? hydrateCard(state.active.ai) : null,
    },
    hands: {
      player: state.hands.player.map(hydrateCard).filter(Boolean),
      ai: state.hands.ai.map(hydrateCard).filter(Boolean),
    },
    bench: {
      player: state.bench.player.map((c) => (c ? hydrateCard(c) : null)),
      ai: state.bench.ai.map((c) => (c ? hydrateCard(c) : null)),
    },
    decks: {
      player: state.decks.player.length,
      ai: state.decks.ai.length,
    },
    discards: {
      player: state.discards.player.map(hydrateCard).filter(Boolean),
      ai: state.discards.ai.map(hydrateCard).filter(Boolean),
    },
    prizes: state.prizes,
    energies: state.energies,
    canAttackThisTurn: state.canAttackThisTurn,
    legalMoves: state.legalMoves,
    flags: state.flags || {}, // Ensure flags are always included
  };
}
