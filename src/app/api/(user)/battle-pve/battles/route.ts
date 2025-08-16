// ================================
// FILE: \app\api\pve\battles\route.ts - FIXED VERSION
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser, ensureDbUserFromAuth } from '@/lib/auth/auth-compat';
import {
  createBattleContext,
  initializeBattle,
  aiTurn,
} from '@/lib/battle-pve/index'; // <-- Add aiTurn import
import { loadCardIndex } from '@/lib/battle-pve/cards';

export const dynamic = 'force-dynamic';

const CreateBattleSchema = z.object({
  opponentId: z.string().min(1),
  deckId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { opponentId, deckId } = CreateBattleSchema.parse(body);

    // 1) Resolve auth (session or wallet), then resolve a REAL DB user
    const auth = await getCurrentUser(req);
    if (!auth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await ensureDbUserFromAuth(auth);

    // 2) Load opponent (with its AI deck)
    const opponent = await prisma.opponent.findUnique({
      where: { id: opponentId },
      include: { deck: true },
    });
    if (!opponent || !opponent.deck) {
      return NextResponse.json(
        { error: 'Opponent not found' },
        { status: 404 }
      );
    }

    // 3) Deck ownership validation
    const wallet = auth.walletAddress?.toLowerCase();
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        OR: [
          { userId: user.id },
          wallet ? { userAddress: wallet } : undefined,
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
        name: true,
        userId: true,
        userAddress: true,
        cards: { select: { tokenId: true } },
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: 'Deck not found or not owned by user' },
        { status: 403 }
      );
    }

    // 4) Build deck ID arrays
    const playerDeckIds: string[] = deck.cards
      .map((c) => c.tokenId)
      .filter((t): t is string => typeof t === 'string' && t.length > 0);

    const aiDeckIds: string[] = Array.isArray(opponent.deck.cards)
      ? (opponent.deck.cards as any[])
          .map((v) => (typeof v === 'string' ? v : (v?.tokenId as string)))
          .filter((t): t is string => typeof t === 'string' && t.length > 0)
      : [];

    if (playerDeckIds.length === 0 || aiDeckIds.length === 0) {
      return NextResponse.json(
        { error: 'Decks cannot be empty' },
        { status: 400 }
      );
    }

    // 5) Initialize engine state
    await loadCardIndex();
    const context = await createBattleContext();
    let initialState = initializeBattle(playerDeckIds, aiDeckIds, context);

    // 🔧 FIX: Auto-run AI preparation phase immediately
    if (initialState.phase === 'PREPARATION' && !initialState.active.ai) {
      console.log('🤖 Auto-running AI preparation phase...');
      try {
        const aiState = await aiTurn(initialState, context);
        if (aiState && aiState.active.ai) {
          initialState = aiState;
          console.log('✅ AI successfully placed active Pokemon');
        } else {
          console.warn('⚠️ AI failed to place active Pokemon');
        }
      } catch (aiError) {
        console.error('❌ AI preparation failed:', aiError);
        // Continue with original state - let player see the issue
      }
    }

    // 6) Create battle with properly initialized state
    const created = await prisma.battle.create({
      data: {
        userId: user.id,
        opponentId: opponent.id,
        playerDeckId: deck.id,
        difficulty: opponent.difficulty,
        status: 'ACTIVE',
        state: initialState, // <-- Now includes AI active Pokemon
        winner: null,
      },
      select: { id: true },
    });

    console.log('✅ Battle created with ID:', created.id);
    console.log('📊 Initial state:', {
      phase: initialState.phase,
      playerActiveExists: !!initialState.active.player,
      aiActiveExists: !!initialState.active.ai,
    });

    return NextResponse.json({ battleId: created.id }, { status: 201 });
  } catch (err: any) {
    console.error('❌ Battle creation failed:', err);
    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'Foreign key constraint failed (user/deck/opponent missing).',
        },
        { status: 409 }
      );
    }
    const status = err?.status ?? err?.cause?.status ?? 500;
    const message =
      err?.message ??
      (typeof err === 'string' ? err : 'Failed to create battle');
    return NextResponse.json({ error: message }, { status });
  }
}
