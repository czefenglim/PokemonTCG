// ================================
// FILE: /app/pve/battle/[id]/page.tsx
// Animations added w/ Framer Motion (card placement, energy attach flight,
// attack shake + impact ring + damage numbers, retreat swap via shared layout,
// turn banner, animated HP bars).
// ================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBattle } from '@/features/user/battle-pve/hooks/useBattle';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

interface Card {
  id: string; // iid
  tokenId: string; // tokenId (from DB)
  name: string;
  image: string;
  type: string;
  hp: number;
  maxHp: number;
  attacks?: any[];
  weaknesses?: any[];
  resistances?: any[];
}

interface EnergyType {
  type: string;
  color: string;
  symbol: string;
  bgGradient: string;
}

const ENERGY_TYPES: EnergyType[] = [
  {
    type: 'FIRE',
    color: 'bg-red-500',
    symbol: '🔥',
    bgGradient: 'from-red-400 to-red-600',
  },
  {
    type: 'WATER',
    color: 'bg-blue-500',
    symbol: '💧',
    bgGradient: 'from-blue-400 to-blue-600',
  },
  {
    type: 'GRASS',
    color: 'bg-green-500',
    symbol: '🌿',
    bgGradient: 'from-green-400 to-green-600',
  },
  {
    type: 'LIGHTNING',
    color: 'bg-yellow-500',
    symbol: '⚡',
    bgGradient: 'from-yellow-400 to-yellow-600',
  },
  {
    type: 'PSYCHIC',
    color: 'bg-purple-500',
    symbol: '🔮',
    bgGradient: 'from-purple-400 to-purple-600',
  },
  {
    type: 'FIGHTING',
    color: 'bg-orange-500',
    symbol: '👊',
    bgGradient: 'from-orange-400 to-orange-600',
  },
  {
    type: 'DARKNESS',
    color: 'bg-gray-800',
    symbol: '🌙',
    bgGradient: 'from-gray-600 to-gray-800',
  },
  {
    type: 'METAL',
    color: 'bg-gray-500',
    symbol: '⚙️',
    bgGradient: 'from-gray-400 to-gray-600',
  },
  {
    type: 'COLORLESS',
    color: 'bg-gray-300',
    symbol: '⭐',
    bgGradient: 'from-gray-200 to-gray-400',
  },
];

function normType(s: string) {
  return String(s || '')
    .trim()
    .toUpperCase();
}
function energyByType(t: string) {
  const T = normType(t);
  return (
    ENERGY_TYPES.find((e) => e.type === T) ||
    ENERGY_TYPES.find((e) => e.type === 'COLORLESS')!
  );
}

// ---------- Local optimistic helpers (mirror server logic) ----------
function cloneState<T>(s: T): T {
  return JSON.parse(JSON.stringify(s));
}
function getEnergyCountLocal(state: any, cardIid: string): number {
  return state?.energies?.[cardIid] || 0;
}
function calcDamageLocal(
  attacker: any,
  target: any,
  attackIndex: number
): number {
  const attack = attacker?.attacks?.[attackIndex];
  if (!attack) return 0;
  const base =
    typeof attack.damage === 'number'
      ? attack.damage
      : parseInt(String(attack.damage || '').replace(/\D+/g, '')) || 0;

  let damage = base;
  const atkType = String(attacker.type || '').toLowerCase();

  const weak = (target.weaknesses || []).find(
    (w: any) => String(w.type || '').toLowerCase() === atkType
  );
  if (weak) damage *= 2;

  const resist = (target.resistances || []).find(
    (r: any) => String(r.type || '').toLowerCase() === atkType
  );
  if (resist) {
    const val = parseInt(String(resist.value || '')) || 20;
    damage = Math.max(0, damage - val);
  }
  return damage;
}
function applyKOLocal(next: any, cardIid: string, targetSide: 'PLAYER' | 'AI') {
  const isPlayer = targetSide === 'PLAYER';
  next.active = next.active ?? { player: null, ai: null };
  next.bench = next.bench ?? {
    player: [null, null, null],
    ai: [null, null, null],
  };
  next.discards = next.discards ?? { player: [], ai: [] };
  next.energies = next.energies ?? {};

  const activeSlot = isPlayer ? next.active?.player : next.active?.ai;

  if (activeSlot && activeSlot.id === cardIid) {
    if (isPlayer) {
      next.active.player = null;
      next.discards.player.push(activeSlot);
    } else {
      next.active.ai = null;
      next.discards.ai.push(activeSlot);
    }
    const bench = isPlayer ? next.bench.player : next.bench.ai;
    const hasBenchPokemon = bench.some((card: any) => card !== null);
    if (!hasBenchPokemon) {
      next.phase = 'ENDED';
      next.winner = isPlayer ? 'AI' : 'PLAYER';
    } else {
      next.flags = next.flags || {};
      next.flags.needsBenchPromotion = { side: targetSide, forced: true };
    }
  } else {
    const bench = isPlayer ? next.bench.player : next.bench.ai;
    const discards = isPlayer ? next.discards.player : next.discards.ai;
    for (let i = 0; i < bench.length; i++) {
      const c = bench[i];
      if (c && c.id === cardIid) {
        discards.push(c);
        bench[i] = null;
        break;
      }
    }
  }

  if (next.energies) delete next.energies[cardIid];

  const zeroHpIfFound = (obj: any) => {
    if (obj && obj.id === cardIid) obj.hp = 0;
  };
  zeroHpIfFound(isPlayer ? next.active?.player : next.active?.ai);

  (next.bench?.player ?? []).forEach((c: any, i: number) => {
    if (c && c.id === cardIid) next.bench.player[i]!.hp = 0;
  });
  (next.bench?.ai ?? []).forEach((c: any, i: number) => {
    if (c && c.id === cardIid) next.bench.ai[i]!.hp = 0;
  });
  (next.discards?.player ?? []).forEach((c: any) => zeroHpIfFound(c));
  (next.discards?.ai ?? []).forEach((c: any) => zeroHpIfFound(c));
}

// ================================
// Retreat cost helper (MAX HP based)
// ================================
function computeRetreatCostFromMaxHP(maxHp: number): number {
  if (maxHp >= 150) return 3;
  if (maxHp >= 100) return 2;
  if (maxHp >= 60) return 1;
  return 0;
}

// Optimistic reducer for UI instant feedback - ONLY for PLAYER actions
function optimisticReduce(state: any, action: any) {
  if (!state) return state;
  const next = cloneState(state);

  switch (action.type) {
    case 'PLACE_ACTIVE': {
      if (next.phase !== 'PREPARATION') return state;
      const idx = next.hands.player.findIndex(
        (c: any) => c.id === action.cardIid
      );
      if (idx >= 0 && !next.active.player) {
        next.active.player = next.hands.player[idx];
        next.hands.player.splice(idx, 1);
      }
      return next;
    }
    case 'PLACE_BENCH': {
      const idx = next.hands.player.findIndex(
        (c: any) => c.id === action.cardIid
      );
      if (idx >= 0 && next.bench.player[action.position] === null) {
        next.bench.player[action.position] = next.hands.player[idx];
        next.hands.player.splice(idx, 1);
      }
      return next;
    }
    case 'PROMOTE_FROM_BENCH': {
      const benchCard = next.bench.player[action.benchPosition];
      if (benchCard && benchCard.id === action.cardIid) {
        next.active.player = benchCard;
        next.bench.player[action.benchPosition] = null;
        if (next.flags?.needsBenchPromotion?.side === 'PLAYER')
          delete next.flags.needsBenchPromotion;
      }
      return next;
    }
    case 'ATTACH_ENERGY': {
      next.energies[action.cardIid] = (next.energies[action.cardIid] || 0) + 1;
      next.energyTypes = next.energyTypes || {};
      const T = normType(action.energyType);
      next.energyTypes[action.cardIid] = [
        ...(next.energyTypes[action.cardIid] || []),
        T,
      ];
      next.flags = { ...(next.flags || {}), hasAttachedEnergyThisTurn: true };
      return next;
    }
    case 'END_TURN': {
      next.turn += 1;
      next.phase = 'AI_TURN';
      next.canAttackThisTurn = false;
      next.flags = {
        hasAttachedEnergyThisTurn: false,
        hasAttachedThisTurn: false,
        hasRetreatedThisTurn: false,
      };
      return next;
    }
    case 'ATTACK': {
      const attackerIid = action.cardIid || action.attackerIid;
      const targetIid = action.targetIid;
      if (!next?.active?.player || !next?.active?.ai) return next;
      if (next.active.player.id !== attackerIid) return next;
      if (next.active.ai.id !== targetIid) return next;

      const attacker = next.active.player;
      const target = next.active.ai;
      const attackIdx =
        typeof action.attackIndex === 'number' ? action.attackIndex : 0;

      const energyReq = attacker.attacks?.[attackIdx]?.cost?.length || 0;
      const energyHave = getEnergyCountLocal(next, attacker.id);
      if (energyHave < energyReq) return next;

      const dmg = calcDamageLocal(attacker, target, attackIdx);
      const newHp = Math.max(0, (target.hp ?? target.maxHp) - dmg);
      target.hp = newHp;

      if (newHp <= 0) {
        next.prizes = {
          ...(next.prizes || { playerDefeated: 0, aiDefeated: 0 }),
        };
        next.prizes.aiDefeated = (next.prizes.aiDefeated || 0) + 1;
        applyKOLocal(next, targetIid, 'AI');
        if ((next.prizes.aiDefeated || 0) >= 2) {
          next.phase = 'ENDED';
          next.winner = 'PLAYER';
        }
      }

      next.canAttackThisTurn = false;
      return next;
    }
    case 'RETREAT': {
      const benchPos = action.benchPosition ?? 0;
      const active = next.active?.player;
      const benchCard = next.bench?.player?.[benchPos];
      if (!active || !benchCard) return state;

      const maxHp =
        typeof active.maxHp === 'number' ? active.maxHp : active.hp || 0;
      const cost = computeRetreatCostFromMaxHP(maxHp);
      const have = next.energies[active.id] || 0;
      if (have < cost) return state;

      next.energies[active.id] = Math.max(0, have - cost);
      next.bench.player[benchPos] = active;
      next.active.player = benchCard;
      next.flags = { ...(next.flags || {}), hasRetreatedThisTurn: true };
      return next;
    }
    default:
      return next;
  }
}

// ===== Helpers for effects =====
const centerOf = (el: HTMLElement | null) => {
  if (!el) return { x: 0, y: 0 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};
const uid = () => Math.random().toString(36).slice(2);

export default function PvEBattlePage() {
  const params = useParams();
  const router = useRouter();
  const battleId = params.id as string;

  const {
    battleState: serverBattleState,
    opponent,
    fetching,
    error,
    battleEnded: serverBattleEnded,
    winner: serverWinner,
    loadExistingBattle,
    performAction,
  } = useBattle();

  // local optimistic state (authoritative for rendering)
  const [localBattleState, setLocalBattleState] = useState<any | null>(null);

  // StrictMode-safe snapshot for rollback
  const localRef = useRef<any | null>(null);
  useEffect(() => {
    localRef.current = localBattleState;
  }, [localBattleState]);

  // Drag/hover UI state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [draggedEnergy, setDraggedEnergy] = useState<EnergyType | null>(null);
  const [hoveredBenchIndex, setHoveredBenchIndex] = useState<number | null>(
    null
  );
  const [isOverActiveSlot, setIsOverActiveSlot] = useState(false);
  const [hoveredEnergyTarget, setHoveredEnergyTarget] = useState<string | null>(
    null
  );
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [previewType, setPreviewType] = useState<'player' | 'opponent'>(
    'player'
  );
  const [previewPosition, setPreviewPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(
    null
  );
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  // Energy per turn UI state
  const [currentTurnEnergy, setCurrentTurnEnergy] = useState<EnergyType | null>(
    null
  );
  const [energyAttached, setEnergyAttached] = useState<
    Record<string, EnergyType[]>
  >({});
  const [energySpentThisTurn, setEnergySpentThisTurn] =
    useState<boolean>(false);

  // Bench promotion
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionOptions, setPromotionOptions] = useState<Card[]>([]);

  // Retreat UI state
  const [showRetreatModal, setShowRetreatModal] = useState(false);
  const [retreatError, setRetreatError] = useState<string | null>(null);

  // ===== Animation states/elements =====
  const [shake, setShake] = useState(false);
  const [impactRings, setImpactRings] = useState<
    Array<{ id: string; x: number; y: number }>
  >([]);
  const [damageTexts, setDamageTexts] = useState<
    Array<{ id: string; x: number; y: number; value: number }>
  >([]);
  const [energyFlights, setEnergyFlights] = useState<
    Array<{
      id: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
      symbol: string;
    }>
  >([]);
  const [glowTargets, setGlowTargets] = useState<Record<string, number>>({});
  const [turnBanner, setTurnBanner] = useState<
    'PLAYER' | 'AI' | 'SETUP' | null
  >(null);

  // Coin flip
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [coinFace, setCoinFace] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [coinResult, setCoinResult] = useState<'PLAYER' | 'AI' | null>(null);
  const coinFlipOnce = useRef(false);
  const lastFlipBattleId = useRef<string | null>(null);
  // under the other coin flip state
  const [forcedStarter, setForcedStarter] = useState<'PLAYER' | 'AI' | null>(
    null
  );

  // who likely started, based on current snapshot
  function inferStarterFromState(s: any): 'PLAYER' | 'AI' {
    if ((s?.turn ?? 1) > 1) return 'AI'; // AI must have already taken turn 1
    if (s?.phase === 'AI_TURN') return 'AI'; // still on AI_TURN at turn 1
    return 'PLAYER';
  }
  // reset coin flip when battle changes (or on hard refresh)
  useEffect(() => {
    if (battleId && lastFlipBattleId.current !== battleId) {
      lastFlipBattleId.current = battleId;
      coinFlipOnce.current = false;
      setShowCoinFlip(false);
      setCoinResult(null);
      setCoinFace('HEADS');
    }
  }, [battleId]);

  // Refs to DOM nodes for effects
  const energySourceRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const handContainerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const setCardRef = (id: string) => (el: HTMLElement | null) =>
    (cardRefs.current[id] = el);

  // Track previous HP to spawn damage numbers
  const prevAiHp = useRef<number | null>(null);
  const prevPlayerHp = useRef<number | null>(null);

  // Load battle
  useEffect(() => {
    if (battleId) loadExistingBattle(battleId);
  }, [battleId, loadExistingBattle]);

  // Sync local state with server
  useEffect(() => {
    if (serverBattleState) {
      setLocalBattleState(serverBattleState);
    }
  }, [serverBattleState]);

  // Bench promotion needs
  useEffect(() => {
    const localNeedsPromotion = localBattleState?.flags?.needsBenchPromotion;
    const serverNeedsPromotion = serverBattleState?.flags?.needsBenchPromotion;
    const needsPromotion = localNeedsPromotion || serverNeedsPromotion;
    if (
      needsPromotion &&
      needsPromotion.side === 'PLAYER' &&
      !showPromotionModal
    ) {
      const battleState = serverBattleState || localBattleState;
      const bench = battleState?.bench?.player || [];
      const available = bench.filter((c: Card | null) => c !== null);
      if (available.length > 0) {
        setPromotionOptions(available as Card[]);
        setShowPromotionModal(true);
      }
    }
  }, [
    localBattleState?.flags?.needsBenchPromotion,
    serverBattleState?.flags?.needsBenchPromotion,
    showPromotionModal,
    localBattleState?.bench?.player,
    serverBattleState?.bench?.player,
  ]);

  // Energy spent flag sync
  useEffect(() => {
    const phase = localBattleState?.phase;
    const hasAttached = !!localBattleState?.flags?.hasAttachedEnergyThisTurn;
    if (phase === 'PLAYER_TURN') {
      if (hasAttached) setEnergySpentThisTurn(true);
    } else {
      setEnergySpentThisTurn(false);
    }
  }, [
    localBattleState?.phase,
    localBattleState?.flags?.hasAttachedEnergyThisTurn,
    localBattleState?.turn,
  ]);

  // Pool of allowed energy based on types on board
  function getPlayerElementPool(): string[] {
    const bs = localBattleState;
    if (!bs) return ['COLORLESS'];
    const pool = new Set<string>();
    const add = (c: any) => {
      if (!c) return;
      const t = normType(c.type);
      const supported = ENERGY_TYPES.some((e) => e.type === t);
      pool.add(supported ? t : 'COLORLESS');
    };
    add(bs.active?.player);
    (bs.bench?.player || []).forEach(add);
    const arr = Array.from(pool);
    return arr.length > 0 ? arr : ['COLORLESS'];
  }

  // Generate energy for player's turn
  useEffect(() => {
    const phase = localBattleState?.phase;
    const hasAttached = !!localBattleState?.flags?.hasAttachedEnergyThisTurn;
    if (phase === 'PLAYER_TURN' && !hasAttached && !energySpentThisTurn) {
      if (!currentTurnEnergy) {
        const pool = getPlayerElementPool();
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setCurrentTurnEnergy(energyByType(pick));
      }
    } else {
      if (currentTurnEnergy) setCurrentTurnEnergy(null);
    }
  }, [
    localBattleState?.phase,
    localBattleState?.flags?.hasAttachedEnergyThisTurn,
    localBattleState?.active?.player,
    localBattleState?.bench?.player,
    energySpentThisTurn,
    currentTurnEnergy,
  ]);

  // Auto-FS on load
  useEffect(() => {
    const enterFullScreen = async () => {
      const elem = document.documentElement;
      try {
        await (elem.requestFullscreen?.() ||
          (elem as any).webkitRequestFullscreen?.() ||
          (elem as any).mozRequestFullScreen?.() ||
          (elem as any).msRequestFullscreen?.());
      } catch {}
    };
    enterFullScreen();
  }, []);

  // Turn banner on phase change
  useEffect(() => {
    const phase = localBattleState?.phase;
    if (!phase) return;
    if (phase === 'PLAYER_TURN') setTurnBanner('PLAYER');
    else if (phase === 'AI_TURN') setTurnBanner('AI');
    else if (phase === 'PREPARATION') setTurnBanner('SETUP');
    const t = setTimeout(() => setTurnBanner(null), 1200);
    return () => clearTimeout(t);
  }, [localBattleState?.phase]);

  // TRIGGER: open once per battle as soon as both actives exist
  useEffect(() => {
    const s = serverBattleState || localBattleState;
    const haveActives = !!s?.active?.player?.id && !!s?.active?.ai?.id;

    if (haveActives && !coinFlipOnce.current) {
      coinFlipOnce.current = true;
      setCoinResult(null);
      setCoinFace('HEADS');
      setForcedStarter(inferStarterFromState(s));
      setShowCoinFlip(true);
    }
  }, [
    localBattleState?.active?.player?.id,
    localBattleState?.active?.ai?.id,
    serverBattleState?.active?.player?.id,
    serverBattleState?.active?.ai?.id,
    localBattleState?.phase,
    serverBattleState?.phase,
    localBattleState?.turn,
    serverBattleState?.turn,
  ]);

  // ----- RUNNER: do the flip while overlay is open (StrictMode-safe)
  useEffect(() => {
    if (!showCoinFlip || coinResult !== null) return;

    let faceTimer: any;
    let endTimer: any;

    faceTimer = setInterval(() => {
      setCoinFace((f) => (f === 'HEADS' ? 'TAILS' : 'HEADS'));
    }, 120);

    const starter: 'PLAYER' | 'AI' =
      forcedStarter ?? (Math.random() < 0.5 ? 'PLAYER' : 'AI');

    endTimer = setTimeout(() => {
      clearInterval(faceTimer);
      setCoinResult(starter);
      setCoinFace(starter === 'PLAYER' ? 'HEADS' : 'TAILS');
      setTimeout(() => setShowCoinFlip(false), 800);
    }, 2000);

    return () => {
      clearInterval(faceTimer);
      clearTimeout(endTimer);
    };
  }, [showCoinFlip, coinResult, forcedStarter]);

  // Optional safety: only force-close if battle ended
  useEffect(() => {
    const s = serverBattleState || localBattleState;
    if (showCoinFlip && s?.phase === 'ENDED') setShowCoinFlip(false);
  }, [showCoinFlip, localBattleState?.phase, serverBattleState?.phase]);

  // Detect HP drops and spawn impact/damage text
  useEffect(() => {
    const ai = localBattleState?.active?.ai as Card | null;
    const pl = localBattleState?.active?.player as Card | null;

    if (ai) {
      if (prevAiHp.current !== null && ai.hp < prevAiHp.current) {
        // ai took damage
        const el = cardRefs.current[ai.id];
        const { x, y } = centerOf(el || null);
        const diff = prevAiHp.current - ai.hp;
        const id = uid();
        setImpactRings((arr) => [...arr, { id, x, y }]);
        const dmgId = uid();
        setDamageTexts((arr) => [
          ...arr,
          { id: dmgId, x, y: y - 10, value: diff },
        ]);
        setTimeout(() => {
          setDamageTexts((arr) => arr.filter((d) => d.id !== dmgId));
        }, 2000); // visible for ~2s
        setTimeout(
          () => setImpactRings((arr) => arr.filter((r) => r.id !== id)),
          450
        );
      }
      prevAiHp.current = ai.hp;
    } else {
      prevAiHp.current = null;
    }

    if (pl) {
      if (prevPlayerHp.current !== null && pl.hp < prevPlayerHp.current) {
        const el = cardRefs.current[pl.id];
        const { x, y } = centerOf(el || null);
        const diff = prevPlayerHp.current - pl.hp;
        const id = uid();
        setImpactRings((arr) => [...arr, { id, x, y }]);
        const dmgId = uid();
        setDamageTexts((arr) => [
          ...arr,
          { id: dmgId, x, y: y - 10, value: diff },
        ]);
        setTimeout(() => {
          setDamageTexts((arr) => arr.filter((d) => d.id !== dmgId));
        }, 2000); // visible for ~2s
        setTimeout(
          () => setImpactRings((arr) => arr.filter((r) => r.id !== id)),
          450
        );
      }
      prevPlayerHp.current = pl.hp;
    } else {
      prevPlayerHp.current = null;
    }
  }, [localBattleState?.active?.ai?.hp, localBattleState?.active?.player?.hp]);

  // Helpers
  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleManualFullscreen = async () => {
    const elem = document.documentElement;
    try {
      await (elem.requestFullscreen?.() ||
        (elem as any).webkitRequestFullscreen?.() ||
        (elem as any).mozRequestFullScreen?.() ||
        (elem as any).msRequestFullscreen?.());
    } catch {}
  };

  const startHoverTimer = (
    card: Card,
    type: 'player' | 'opponent' = 'player',
    element: HTMLElement
  ) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setPreviewPosition({ x: centerX, y: centerY });
    hoverTimer.current = setTimeout(() => {
      setPreviewCard(card);
      setPreviewType(type);
    }, 300);
  };
  const cancelHoverTimer = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setPreviewCard(null);
  };

  // Local energy counts
  const getEnergyCount = (cardId: string): number =>
    localBattleState?.energies?.[cardId] || 0;
  const getAttachedEnergies = (cardId: string): EnergyType[] =>
    energyAttached[cardId] || [];

  const getAIEnergySymbols = (card: Card, energyCount: number): string[] => {
    const symbols: string[] = [];
    const cardType = card.type?.toUpperCase() || 'COLORLESS';
    const energyType =
      ENERGY_TYPES.find((e) => e.type === cardType) ||
      ENERGY_TYPES.find((e) => e.type === 'COLORLESS');
    const symbol = energyType?.symbol || '⭐';
    for (let i = 0; i < Math.min(energyCount, 5); i++) symbols.push(symbol);
    return symbols;
  };

  const canAttachEnergy = (): boolean => {
    const currentPhase = localBattleState?.phase || 'PREPARATION';
    return (
      currentPhase === 'PLAYER_TURN' &&
      !energySpentThisTurn &&
      !localBattleState?.flags?.hasAttachedEnergyThisTurn
    );
  };

  // STRICT: Attacks need quantity AND same-element count >= quantity
  const canUseAttack = (pokemon: Card, attackIndex: number): boolean => {
    if (!pokemon.attacks || !pokemon.attacks[attackIndex]) return false;
    const attack = pokemon.attacks[attackIndex];
    const req = attack.cost?.length || 0;
    const haveTotal = localBattleState?.energies?.[pokemon.id] || 0;
    const serverTyped = (
      localBattleState?.energyTypes?.[pokemon.id] || []
    ).filter((t: string) => normType(t) === normType(pokemon.type)).length;
    const localIcons = (energyAttached[pokemon.id] || []).filter(
      (e) => normType(e.type) === normType(pokemon.type)
    ).length;
    const haveTyped = serverTyped + localIcons;
    return (
      haveTotal >= req &&
      haveTyped >= req &&
      localBattleState?.canAttackThisTurn
    );
  };

  const getAvailableEnergy = (): EnergyType | null => {
    if (!canAttachEnergy()) return null;
    return currentTurnEnergy;
  };

  const canDropOnActiveSlot = (): boolean => {
    const currentPhase = localBattleState?.phase || 'PREPARATION';
    return currentPhase === 'PREPARATION';
  };

  // ✅ Optimistic + trigger anim hooks
  const performActionOptimistic = React.useCallback(
    (action: any) => {
      const before = localRef.current ? cloneState(localRef.current) : null;

      // Attack -> screen shake
      if (action?.type === 'ATTACK') {
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }

      setLocalBattleState((prev) => optimisticReduce(prev, action));
      performAction(action)
        .then(() => {
          // server truth flows via useBattle -> sync effect
        })
        .catch(() => {
          if (before) setLocalBattleState(before);
          if (action?.type === 'ATTACH_ENERGY') setEnergySpentThisTurn(false);
        });
    },
    [performAction]
  );

  // Action handlers
  const handleCardAction = (action: any) => performActionOptimistic(action);

  const handleEnergyAttachment = (energyType: string, targetCardId: string) => {
    if (!canAttachEnergy()) return;

    setEnergySpentThisTurn(true);
    setCurrentTurnEnergy(null);

    // Flight: energy pool -> target card center
    const from = centerOf(energySourceRef.current);
    const to = centerOf(cardRefs.current[targetCardId] || null);
    const energyObj = ENERGY_TYPES.find((e) => e.type === energyType);
    if (energyObj) {
      const id = uid();
      setEnergyFlights((arr) => [
        ...arr,
        { id, from, to, symbol: energyObj.symbol },
      ]);
      setTimeout(
        () => setEnergyFlights((arr) => arr.filter((f) => f.id !== id)),
        650
      );
      setGlowTargets((m) => ({ ...m, [targetCardId]: Date.now() }));
      setTimeout(
        () =>
          setGlowTargets((m) => {
            const { [targetCardId]: _, ...rest } = m;
            return rest;
          }),
        800
      );
    }

    handleCardAction({
      type: 'ATTACH_ENERGY',
      cardIid: targetCardId,
      energyType,
    });
    if (energyObj) {
      setEnergyAttached((prev) => ({
        ...prev,
        [targetCardId]: [...(prev[targetCardId] || []), energyObj],
      }));
    }
  };

  const handleDropOnActive = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOverActiveSlot(false);
    setHoveredEnergyTarget(null);

    const cardData = e.dataTransfer.getData('application/json');
    const energyData = e.dataTransfer.getData('energy');

    if (energyData && localBattleState?.active?.player && canAttachEnergy()) {
      const energy = JSON.parse(energyData);
      handleEnergyAttachment(energy.type, localBattleState.active.player.id);
    } else if (cardData && canDropOnActiveSlot()) {
      const card = JSON.parse(cardData);
      handleCardAction({ type: 'PLACE_ACTIVE', cardIid: card.id });
    }
  };

  const handleDropOnBench = (
    e: React.DragEvent<HTMLDivElement>,
    position: number
  ) => {
    e.preventDefault();
    setHoveredBenchIndex(null);
    setHoveredEnergyTarget(null);

    const cardData = e.dataTransfer.getData('application/json');
    const energyData = e.dataTransfer.getData('energy');

    if (
      energyData &&
      localBattleState?.bench?.player[position] &&
      canAttachEnergy()
    ) {
      const energy = JSON.parse(energyData);
      handleEnergyAttachment(
        energy.type,
        localBattleState.bench.player[position].id
      );
    } else if (cardData) {
      const card = JSON.parse(cardData);
      handleCardAction({ type: 'PLACE_BENCH', cardIid: card.id, position });
    }
  };

  const handleEndTurn = () => handleCardAction({ type: 'END_TURN' });

  const handleAttack = (attackIndex: number) => {
    if (!localBattleState?.active?.player || !localBattleState?.active?.ai)
      return;
    handleCardAction({
      type: 'ATTACK',
      cardIid: localBattleState.active.player.id,
      targetIid: localBattleState.active.ai.id,
      attackIndex,
    });
  };

  // Bench promotion
  const handleBenchPromotion = (selectedCard: Card) => {
    const bench = localBattleState?.bench?.player || [];
    const position = bench.findIndex(
      (card: Card | null) => card && card.id === selectedCard.id
    );
    if (position !== -1) {
      handleCardAction({
        type: 'PROMOTE_FROM_BENCH',
        cardIid: selectedCard.id,
        benchPosition: position,
      });
      setShowPromotionModal(false);
      setPromotionOptions([]);
    }
  };

  // Retreat check
  const canRetreatNow = (): { ok: boolean; reason?: string; cost?: number } => {
    const phase = localBattleState?.phase;
    const needsPromotion =
      localBattleState?.flags?.needsBenchPromotion?.side === 'PLAYER';
    if (phase !== 'PLAYER_TURN') return { ok: false, reason: 'Not your turn' };
    if (needsPromotion)
      return { ok: false, reason: 'Promote from bench first' };

    const active = localBattleState?.active?.player as Card | null;
    if (!active) return { ok: false, reason: 'No active Pokémon' };

    const bench = (localBattleState?.bench?.player || []) as (Card | null)[];
    if (!bench.some(Boolean))
      return { ok: false, reason: 'No Pokémon on bench' };

    const cost = computeRetreatCostFromMaxHP(active.maxHp ?? active.hp ?? 0);
    const haveTotal = localBattleState?.energies?.[active.id] || 0;
    const serverTyped = (
      localBattleState?.energyTypes?.[active.id] || []
    ).filter((t: string) => normType(t) === normType(active.type)).length;
    const localIcons = (energyAttached[active.id] || []).filter(
      (e) => normType(e.type) === normType(active.type)
    ).length;
    const haveTyped = serverTyped + localIcons;

    if (localBattleState?.flags?.hasRetreatedThisTurn)
      return { ok: false, reason: 'Already retreated this turn', cost };
    if (haveTyped < cost)
      return {
        ok: false,
        reason: `Need ${cost} ${normType(active.type)} energy`,
        cost,
      };
    if (haveTotal < cost)
      return { ok: false, reason: `Need ${cost} energy`, cost };
    return { ok: true, cost };
  };

  const openRetreatModal = () => {
    const { ok, reason } = canRetreatNow();
    if (!ok && reason) {
      setRetreatError(reason);
      setTimeout(() => setRetreatError(null), 2000);
      return;
    }
    setShowRetreatModal(true);
  };

  const handleRetreatTo = (benchIndex: number) => {
    const active = localBattleState?.active?.player as Card | null;
    if (!active) return;

    performActionOptimistic({ type: 'RETREAT', benchPosition: benchIndex });

    const cost = computeRetreatCostFromMaxHP(active.maxHp ?? active.hp ?? 0);
    if (cost > 0) {
      setEnergyAttached((prev) => {
        const arr = prev[active.id] || [];
        if (arr.length === 0) return prev;
        const newArr = arr.slice(0, Math.max(0, arr.length - cost));
        return { ...prev, [active.id]: newArr };
      });
    }
    setShowRetreatModal(false);
  };

  // Early states
  const snapshot = localBattleState ?? serverBattleState;
  if (!snapshot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-xl font-bold">Loading Battle...</div>
          <div className="text-gray-300 mt-2">Battle ID: {battleId}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl font-bold mb-2">Battle Error</div>
          <div className="text-gray-300 mb-4">{error}</div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // End game
  const ended = snapshot.phase === 'ENDED' || serverBattleEnded;
  const winner = snapshot.winner || serverWinner;

  if (ended) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
        {/* subtle confetti emojis */}
        <AnimatePresence>
          {winner === 'PLAYER' &&
            Array.from({ length: 18 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -100,
                  x: Math.random() * window.innerWidth,
                  rotate: 0,
                  opacity: 0,
                }}
                animate={{
                  y: window.innerHeight + 50,
                  rotate: 360,
                  opacity: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2 + Math.random() * 1.5,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
                className="pointer-events-none fixed top-0 text-2xl"
              >
                🎉
              </motion.div>
            ))}
        </AnimatePresence>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white"
        >
          <div className="text-8xl mb-6">
            {winner === 'PLAYER' ? '🏆' : winner === 'AI' ? '💀' : '🤝'}
          </div>
          <div className="text-4xl font-bold mb-2">
            {winner === 'PLAYER'
              ? 'Victory!'
              : winner === 'AI'
              ? 'Defeat!'
              : 'Draw!'}
          </div>
          <div className="text-xl text-gray-300 mb-8">
            {winner === 'PLAYER'
              ? `You defeated ${opponent?.name || 'AI Opponent'}!`
              : winner === 'AI'
              ? `${opponent?.name || 'AI Opponent'} defeated you!`
              : 'The battle ended in a draw'}
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/user/battle/pve/difficulty')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Back to Opponents
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render data
  const bs = snapshot;
  const playerActive: Card | null = bs.active?.player || null;
  const aiActive: Card | null = bs.active?.ai || null;
  const playerHand: Card[] = bs.hands?.player || [];
  const aiHandCount = Array.isArray(bs.hands?.ai)
    ? bs.hands.ai.length
    : Number(bs.hands?.ai) || 0;
  const playerBench: (Card | null)[] = bs.bench?.player || [null, null, null];
  const aiBench: (Card | null)[] = bs.bench?.ai || [null, null, null];
  const playerDeckCount = bs.decks?.player || 0;
  const currentPhase = bs.phase || 'PREPARATION';
  const currentTurn = bs.turn || 1;
  const isPlayerTurn =
    currentPhase === 'PLAYER_TURN' || currentPhase === 'PREPARATION';
  const availableEnergy = getAvailableEnergy();

  // HP bar helper
  const HpBar = ({ current, max }: { current: number; max: number }) => {
    const pct = Math.max(
      0,
      Math.min(100, Math.round((current / Math.max(1, max)) * 100))
    );
    return (
      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 to-lime-500"
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  };

  // Shake variant for battlefield
  const shakeAnim = shake
    ? { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.35 } }
    : { x: 0 };

  return (
    <LayoutGroup>
      <motion.div
        className="relative w-screen h-screen bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url('/images/battle/battle-bg.jpg')` }}
        animate={shakeAnim}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

        {/* Turn banner */}
        <AnimatePresence>
          {turnBanner && (
            <motion.div
              initial={{ y: -40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.95 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-2 rounded-xl bg-black/70 border border-white/20 text-white text-sm font-bold tracking-wider"
            >
              {turnBanner === 'PLAYER'
                ? 'YOUR TURN'
                : turnBanner === 'AI'
                ? 'AI TURN'
                : 'SETUP PHASE'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coin Flip Overlay */}
        <AnimatePresence>
          {showCoinFlip && (
            <motion.div
              key="coin-overlay"
              className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-40 h-40 rounded-full border-4 border-white/30 shadow-2xl
                   bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center"
                style={{ boxShadow: '0 0 50px rgba(250, 204, 21, 0.55)' }}
              >
                {/* Spinning coin */}
                <motion.div
                  key={coinFace}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: 720 }} // 2 spins per face swap
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="w-full h-full rounded-full flex items-center justify-center
                     text-black text-2xl font-extrabold select-none"
                  style={{ backfaceVisibility: 'hidden' as any }}
                >
                  {coinFace === 'HEADS' ? 'HEADS' : 'TAILS'}
                </motion.div>

                {/* Result label */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white font-bold">
                  {coinResult
                    ? coinResult === 'PLAYER'
                      ? 'You go first!'
                      : 'AI goes first!'
                    : 'Flipping...'}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Energy Flights */}
        <AnimatePresence>
          {energyFlights.map((f) => (
            <motion.div
              key={f.id}
              initial={{ x: f.from.x, y: f.from.y, scale: 0.8, opacity: 0 }}
              animate={{ x: f.to.x, y: f.to.y, scale: 1.1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="fixed z-[70] pointer-events-none"
            >
              <div className="w-6 h-6 rounded-full bg-yellow-400/90 border border-white/60 shadow-lg flex items-center justify-center">
                <span className="text-sm">{f.symbol}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Impact rings + damage numbers */}
        <AnimatePresence>
          {impactRings.map((r) => (
            <motion.div
              key={r.id}
              initial={{ x: r.x - 25, y: r.y - 25, scale: 0.6, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="fixed z-[65] w-12 h-12 rounded-full border-2 border-yellow-300/70 pointer-events-none"
              style={{ boxShadow: '0 0 20px rgba(250, 204, 21, 0.6)' }}
            />
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {damageTexts.map((d) => (
            <motion.div
              key={d.id}
              initial={{ x: d.x, y: d.y, opacity: 0, scale: 0.9 }}
              animate={{ y: d.y - 50, opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="fixed z-[66] text-yellow-300 font-extrabold text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] pointer-events-none"
            >
              -{d.value}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Bench Promotion Modal */}
        {showPromotionModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-white/20 shadow-2xl max-w-2xl"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">⚔️</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Choose Your Active Pokemon
                </h2>
                <p className="text-gray-300">
                  Your active Pokemon was defeated. Select a Pokemon from your
                  bench to continue.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {promotionOptions.map((card) => (
                  <motion.button
                    key={card.id}
                    onClick={() => handleBenchPromotion(card)}
                    whileHover={{ scale: 1.05 }}
                    className="relative group bg-black/40 rounded-xl border-2 border-blue-500/40 hover:border-yellow-400 transition-all p-4"
                  >
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full h-32 object-contain mb-2"
                    />
                    <div className="text-white text-sm font-semibold text-center">
                      {card.name}
                    </div>
                    <div className="text-gray-300 text-xs text-center">
                      {card.hp}/{card.maxHp} HP
                    </div>
                    {getEnergyCount(card.id) > 0 && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                        ⚡{getEnergyCount(card.id)}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
              <div className="text-center mt-6">
                <p className="text-sm text-gray-400">
                  You must choose a Pokemon to continue
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Retreat Modal */}
        {showRetreatModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-white/20 shadow-2xl max-w-2xl"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🌀</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Choose a Bench Pokémon to Switch
                </h2>
                <p className="text-gray-300">
                  Your active Pokémon will retreat and switch with the selected
                  bench Pokémon.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {playerBench.map((card, index) =>
                  card ? (
                    <motion.button
                      key={card.id}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleRetreatTo(index)}
                      className="relative group bg-black/40 rounded-xl border-2 border-blue-500/40 hover:border-yellow-400 transition-all p-4"
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-32 object-contain mb-2"
                      />
                      <div className="text-white text-sm font-semibold text-center">
                        {card.name}
                      </div>
                      <div className="text-gray-300 text-xs text-center">
                        {card.hp}/{card.maxHp} HP
                      </div>
                    </motion.button>
                  ) : (
                    <div
                      key={`empty-${index}`}
                      className="relative bg-black/20 rounded-xl border-2 border-dashed border-gray-600 p-4 opacity-60"
                    >
                      <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                        Empty
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowRetreatModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Emergency Promotion UI */}
        {!playerActive &&
          !showPromotionModal &&
          currentPhase !== 'PREPARATION' &&
          currentPhase !== 'ENDED' && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-red-800 to-red-900 rounded-2xl p-8 border border-red-500/50 shadow-2xl max-w-lg"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    No Active Pokemon!
                  </h2>
                  <p className="text-gray-200 mb-6">
                    You need to promote a Pokemon from your bench to continue.
                  </p>
                  <div className="space-y-2">
                    {playerBench.map((card, index) =>
                      card ? (
                        <button
                          key={card.id}
                          onClick={() => handleBenchPromotion(card)}
                          className="w-full flex items-center gap-4 p-3 bg-black/40 rounded-lg border border-red-500/30 hover:border-yellow-400 transition-all"
                        >
                          <img
                            src={card.image}
                            alt={card.name}
                            className="w-12 h-16 object-contain"
                          />
                          <div className="text-left">
                            <div className="text-white font-semibold">
                              {card.name}
                            </div>
                            <div className="text-gray-300 text-sm">
                              {card.hp}/{card.maxHp} HP
                            </div>
                          </div>
                        </button>
                      ) : null
                    )}
                  </div>
                  {playerBench.every((card) => card === null) && (
                    <div className="text-center mt-4">
                      <p className="text-red-300">
                        No Pokemon available on bench!
                      </p>
                      <p className="text-gray-400 text-sm">
                        You will lose this battle.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

        {/* UI Buttons */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={handleManualFullscreen}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg backdrop-blur-md hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-200 border border-white/20"
          >
            Full Screen
          </button>
          {isPlayerTurn &&
            currentPhase === 'PLAYER_TURN' &&
            !showPromotionModal && (
              <button
                onClick={handleEndTurn}
                className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg backdrop-blur-md hover:from-green-700 hover:to-emerald-700 hover:scale-105 transition-all duration-200 border border-white/20"
              >
                End Turn
              </button>
            )}
        </div>

        {/* Game Info Panel */}
        <div className="absolute top-4 left-4 z-40 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                isPlayerTurn ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <div>
              <div className="text-white text-sm font-bold">
                vs {opponent?.name || 'AI Opponent'}
              </div>
              <div className="text-yellow-400 text-xs">
                Turn {currentTurn} -{' '}
                {currentPhase === 'PREPARATION'
                  ? 'Setup Phase'
                  : isPlayerTurn
                  ? 'Your Turn'
                  : 'AI Turn'}
              </div>
              {showPromotionModal && (
                <div className="text-red-400 text-xs font-bold animate-pulse">
                  Choose Active Pokemon!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md rounded-xl px-6 py-2 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="text-white text-sm">
              Hand:{' '}
              <span className="text-blue-400 font-bold">
                {playerHand.length}
              </span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="text-white text-sm">
              Deck:{' '}
              <span className="text-green-400 font-bold">
                {playerDeckCount}
              </span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="text-white text-sm">
              Player Prizes:{' '}
              <span className="text-yellow-400 font-bold">
                {bs.prizes?.playerDefeated || 0}/2
              </span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="text-white text-sm">
              AI Prizes:{' '}
              <span className="text-red-400 font-bold">
                {bs.prizes?.aiDefeated || 0}/2
              </span>
            </div>
          </div>
        </div>

        {/* Deck Area - Right Side */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40"
          ref={deckRef}
        >
          <div className="relative">
            {playerDeckCount > 0 ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600/20 rounded-lg blur-sm scale-95" />
                  <div className="absolute inset-0 bg-blue-600/30 rounded-lg blur-sm scale-97" />
                  <img
                    src="https://images.pokemontcg.io/base1/back.jpg"
                    alt="deck"
                    className="relative w-16 h-24 object-cover rounded-lg shadow-2xl border border-blue-400"
                  />
                  <div className="absolute inset-0 bg-blue-500/10 rounded-lg animate-pulse" />
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-full shadow-lg border border-blue-400">
                  {playerDeckCount}
                </div>
              </>
            ) : (
              <div className="relative w-16 h-24 border-2 border-dashed border-gray-500 rounded-lg bg-black/20 flex items-center justify-center">
                <div className="text-gray-500 text-xs text-center">Empty</div>
              </div>
            )}
          </div>
        </div>

        {/* Energy Area - Bottom Right */}
        <div className="absolute bottom-4 right-4 z-40">
          <div className="relative" ref={energySourceRef}>
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-amber-600/20 rounded-full border-2 border-yellow-400/40 backdrop-blur-md shadow-2xl">
              <div className="absolute inset-1 bg-gradient-to-br from-yellow-400/10 to-amber-500/10 rounded-full border border-yellow-300/30">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-yellow-400 text-[8px] font-bold">
                    ENERGY
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              {availableEnergy && (
                <motion.div
                  className="cursor-grab hover:cursor-grabbing"
                  whileHover={{ scale: 1.1 }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'energy',
                      JSON.stringify(availableEnergy)
                    );
                    setDraggedEnergy(availableEnergy);
                    setIsDragging(true);
                  }}
                  onDragEnd={() => {
                    setDraggedEnergy(null);
                    setIsDragging(false);
                  }}
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${availableEnergy.bgGradient} rounded-full border-2 border-white/50 shadow-lg flex items-center justify-center text-white text-lg font-bold`}
                  >
                    {availableEnergy.symbol}
                  </div>
                </motion.div>
              )}
            </div>

            {availableEnergy && (
              <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                1
              </div>
            )}
            {!availableEnergy && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-400 text-xs text-center">
                  {bs?.flags?.hasAttachedEnergyThisTurn
                    ? 'Used'
                    : bs?.phase === 'AI_TURN'
                    ? 'AI Turn'
                    : bs?.phase === 'PREPARATION'
                    ? 'Setup'
                    : energySpentThisTurn
                    ? 'Used'
                    : 'Wait'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Opponent Section */}
        <div className="absolute -top-[7%] left-1/2 -translate-x-1/2 w-full max-w-5xl">
          {/* AI Hand (hidden) */}
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(Math.min(aiHandCount, 7))].map((_, i) => (
              <div
                key={`ai-hand-${i}`}
                className="relative"
                style={{
                  transform: `rotate(${(i - 3) * 5}deg) translateY(${
                    Math.abs(i - 3) * 3
                  }px)`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent rounded-lg blur-sm" />
                <img
                  src="https://images.pokemontcg.io/base1/back.jpg"
                  alt="opponent-card"
                  className="relative w-[50px] h-[70px] object-cover rounded-lg shadow-xl border border-red-500/30"
                />
              </div>
            ))}
          </div>

          {/* Opponent Bench */}
          <div className="relative">
            <div className="flex justify-center gap-[4.5rem] mb-6">
              {aiBench.map((card, i) => (
                <div
                  key={`ai-bench-${i}`}
                  className="relative group w-[88px] h-[126px]"
                >
                  {card && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-red-700/10 rounded-xl blur-md scale-110" />
                      <motion.div
                        layout
                        layoutId={`card-${card.id}`}
                        ref={setCardRef(card.id)}
                        className="relative w-full h-full bg-black/40 backdrop-blur-sm rounded-xl border-2 border-red-500/40 shadow-xl overflow-hidden transition-all duration-300 group-hover:border-red-400/60"
                        onMouseEnter={(e) =>
                          card &&
                          startHoverTimer(card, 'opponent', e.currentTarget)
                        }
                        onMouseLeave={cancelHoverTimer}
                      >
                        <img
                          src={card.image}
                          alt={card.name}
                          className="absolute inset-0 w-full h-full object-contain p-1"
                        />
                        {getEnergyCount(card.id) > 0 && (
                          <div className="absolute top-1 right-1 bg-black/80 text-white text-xs px-1 rounded-full font-bold flex items-center gap-1">
                            <div className="flex">
                              {getAIEnergySymbols(card, getEnergyCount(card.id))
                                .slice(0, 3)
                                .map((symbol, idx) => (
                                  <span key={idx} className="text-[10px]">
                                    {symbol}
                                  </span>
                                ))}
                              {getEnergyCount(card.id) > 3 && (
                                <span className="text-[8px]">
                                  +{getEnergyCount(card.id) - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                          <div className="text-white text-[10px] font-semibold text-center">
                            Bench
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Opponent Active */}
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 to-red-700/20 rounded-xl blur-xl scale-110 animate-pulse" />
                <motion.div
                  layout
                  layoutId={aiActive ? `card-${aiActive.id}` : undefined}
                  ref={aiActive ? setCardRef(aiActive.id) : undefined}
                  className="relative w-32 h-44 bg-black/50 backdrop-blur-md rounded-xl border-2 border-red-500/60 shadow-2xl overflow-hidden transition-all duration-300 group-hover:scale-105"
                  onMouseEnter={(e) =>
                    aiActive &&
                    startHoverTimer(aiActive, 'opponent', e.currentTarget)
                  }
                  onMouseLeave={cancelHoverTimer}
                >
                  {aiActive ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 to-transparent" />
                      <img
                        src={aiActive.image}
                        alt={aiActive.name}
                        className="absolute inset-0 w-full h-full object-contain p-2"
                      />
                      {getEnergyCount(aiActive.id) > 0 && (
                        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                          <div className="flex items-center gap-1">
                            {getAIEnergySymbols(
                              aiActive,
                              getEnergyCount(aiActive.id)
                            )
                              .slice(0, 3)
                              .map((s, idx) => (
                                <span key={idx} className="text-sm">
                                  {s}
                                </span>
                              ))}
                            {getEnergyCount(aiActive.id) > 3 && (
                              <span className="text-xs">
                                +{getEnergyCount(aiActive.id) - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-0 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                        Active
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <div className="text-white text-xs font-bold text-center">
                          {aiActive.name}
                        </div>
                        <div className="text-white text-[10px] text-center">
                          {aiActive.hp}/{aiActive.maxHp} HP
                        </div>
                        <div className="mt-1 px-2">
                          <HpBar current={aiActive.hp} max={aiActive.maxHp} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-red-300 text-xs">
                      No Active
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Section */}
        <div className="absolute -bottom-[1%] left-1/2 -translate-x-1/2 w-full max-w-5xl">
          <div className="relative mb-6">
            {/* Player Active */}
            <div className="flex justify-center mb-6">
              {(isDragging && !playerActive && canDropOnActiveSlot()) ||
              playerActive ? (
                <div
                  onDrop={handleDropOnActive}
                  onDragOver={(e) => {
                    allowDrop(e);
                    if (draggedEnergy && playerActive)
                      setHoveredEnergyTarget(playerActive.id);
                    else if (!playerActive && canDropOnActiveSlot())
                      setIsOverActiveSlot(true);
                  }}
                  onDragLeave={() => {
                    setIsOverActiveSlot(false);
                    setHoveredEnergyTarget(null);
                  }}
                  className="relative group"
                >
                  {!playerActive ? (
                    <>
                      <div
                        className={`absolute inset-0 rounded-xl blur-xl scale-110 transition-all duration-300 ${
                          isOverActiveSlot
                            ? 'bg-yellow-400/30 animate-pulse'
                            : 'bg-blue-500/10'
                        }`}
                      />
                      <div
                        className={`relative w-32 h-44 rounded-xl border-2 shadow-2xl overflow-hidden transition-all duration-300 ${
                          isOverActiveSlot
                            ? 'border-yellow-400 bg-yellow-400/20 backdrop-blur-md scale-105'
                            : 'border-blue-500/40 bg-black/40 backdrop-blur-sm border-dashed'
                        }`}
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-6xl mb-2 opacity-20">⚔️</div>
                          <div className="text-blue-300 text-sm font-medium">
                            {currentPhase === 'PREPARATION'
                              ? isOverActiveSlot
                                ? 'Drop Here'
                                : 'Active Slot'
                              : 'Battle Phase'}
                          </div>
                          {currentPhase !== 'PREPARATION' && (
                            <div className="text-red-300 text-xs mt-1">
                              Bench Only
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`absolute inset-0 rounded-xl blur-xl scale-110 ${
                          hoveredEnergyTarget === playerActive.id
                            ? 'bg-yellow-400/30 animate-pulse'
                            : 'bg-blue-500/20'
                        }`}
                      />
                      <motion.div
                        layout
                        layoutId={`card-${playerActive.id}`}
                        ref={setCardRef(playerActive.id)}
                        className={`relative w-32 h-44 bg-black/50 backdrop-blur-md rounded-xl border-2 shadow-2xl overflow-hidden transition-all duration-300 group-hover:scale-105 ${
                          hoveredEnergyTarget === playerActive.id
                            ? 'border-yellow-400 scale-105'
                            : 'border-blue-500/60'
                        } ${
                          glowTargets[playerActive.id]
                            ? 'ring-2 ring-yellow-300/80'
                            : ''
                        }`}
                        onMouseEnter={(e) =>
                          startHoverTimer(
                            playerActive,
                            'player',
                            e.currentTarget
                          )
                        }
                        onMouseLeave={cancelHoverTimer}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                        <img
                          src={playerActive.image}
                          alt={playerActive.name}
                          className="absolute inset-0 w-full h-full object-contain p-2"
                        />
                        {getEnergyCount(playerActive.id) > 0 && (
                          <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-lg">
                            {getAttachedEnergies(playerActive.id).length > 0 ? (
                              <div className="flex items-center gap-1">
                                {getAttachedEnergies(playerActive.id)
                                  .slice(0, 3)
                                  .map((energy, idx) => (
                                    <span key={idx} className="text-sm">
                                      {energy.symbol}
                                    </span>
                                  ))}
                                {getAttachedEnergies(playerActive.id).length >
                                  3 && (
                                  <span className="text-xs">
                                    +
                                    {getAttachedEnergies(playerActive.id)
                                      .length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span>⚡{getEnergyCount(playerActive.id)}</span>
                            )}
                          </div>
                        )}
                        <div className="absolute top-0 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                          Active
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                          <div className="text-white text-xs font-bold text-center">
                            {playerActive.name}
                          </div>
                          <div className="text-white text-[10px] text-center">
                            {playerActive.hp}/{playerActive.maxHp} HP
                          </div>
                          <div className="mt-1 px-2">
                            <HpBar
                              current={playerActive.hp}
                              max={playerActive.maxHp}
                            />
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {/* Player Bench */}
            <div className="flex justify-center gap-[4.5rem]">
              {playerBench.map((card, index) => (
                <div
                  key={`player-bench-${index}`}
                  className="relative w-[88px] h-[126px]"
                >
                  {(isDragging && !card) || card ? (
                    <div
                      onDrop={(e) => handleDropOnBench(e, index)}
                      onDragOver={(e) => {
                        allowDrop(e);
                        if (draggedEnergy && card)
                          setHoveredEnergyTarget(card.id);
                        else if (!card) setHoveredBenchIndex(index);
                      }}
                      onDragLeave={() => {
                        setHoveredBenchIndex(null);
                        setHoveredEnergyTarget(null);
                      }}
                      className="relative group w-full h-full"
                    >
                      {!card ? (
                        <>
                          <div
                            className={`absolute inset-0 rounded-xl blur-md scale-110 transition-all duration-300 ${
                              hoveredBenchIndex === index
                                ? 'bg-yellow-400/20'
                                : ''
                            }`}
                          />
                          <div
                            className={`relative w-full h-full rounded-xl border-2 shadow-xl overflow-hidden transition-all duration-300 ${
                              hoveredBenchIndex === index
                                ? 'border-yellow-400 bg-yellow-400/20 backdrop-blur-md scale-105'
                                : 'border-blue-500/40 bg-black/40 backdrop-blur-sm border-dashed'
                            }`}
                          >
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-3xl mb-1 opacity-20">🪑</div>
                              <div className="text-blue-300/50 text-xs font-medium">
                                {hoveredBenchIndex === index ? 'Drop' : 'Bench'}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className={`absolute inset-0 rounded-xl blur-md scale-110 transition-all duration-300 ${
                              hoveredEnergyTarget === card.id
                                ? 'bg-yellow-400/30'
                                : 'bg-blue-500/10'
                            }`}
                          />
                          <motion.div
                            layout
                            layoutId={`card-${card.id}`}
                            ref={setCardRef(card.id)}
                            className={`relative w-full h-full bg-black/50 backdrop-blur-md rounded-xl border-2 shadow-xl overflow-hidden transition-all duration-300 group-hover:scale-105 ${
                              hoveredEnergyTarget === card.id
                                ? 'border-yellow-400 scale-105'
                                : 'border-blue-500/60'
                            } ${
                              glowTargets[card.id]
                                ? 'ring-2 ring-yellow-300/80'
                                : ''
                            }`}
                            onMouseEnter={(e) =>
                              startHoverTimer(
                                card as Card,
                                'player',
                                e.currentTarget
                              )
                            }
                            onMouseLeave={cancelHoverTimer}
                          >
                            <img
                              src={card.image}
                              alt={card.name}
                              className="w-full h-full object-contain p-1"
                            />
                            {getEnergyCount(card.id) > 0 && (
                              <div className="absolute top-1 right-1 bg-black/80 text-white text-xs px-1 rounded-full font-bold flex items-center">
                                {getAttachedEnergies(card.id).length > 0 ? (
                                  <div className="flex">
                                    {getAttachedEnergies(card.id)
                                      .slice(0, 2)
                                      .map((energy, idx) => (
                                        <span key={idx} className="text-[10px]">
                                          {energy.symbol}
                                        </span>
                                      ))}
                                    {getAttachedEnergies(card.id).length >
                                      2 && (
                                      <span className="text-[8px]">
                                        +
                                        {getAttachedEnergies(card.id).length -
                                          2}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span>⚡{getEnergyCount(card.id)}</span>
                                )}
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                              <div className="text-white text-[10px] font-semibold text-center">
                                Bench
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Player Hand */}
          <div className="flex justify-center gap-2" ref={handContainerRef}>
            {playerHand.map((card, index) => (
              <motion.div
                key={`hand-${card.id}-${index}`}
                layout
                layoutId={`card-${card.id}`} // enables shared transition hand -> board
                className={`relative transition-all duration-300 ${
                  selectedHandIndex === index ? 'z-20' : 'z-10'
                }`}
                style={{
                  transform: `translateY(${
                    selectedHandIndex === index ? -30 : 0
                  }px)
                  rotate(${(index - playerHand.length / 2) * 4}deg)
                  translateX(${(index - playerHand.length / 2) * 5}px)`,
                }}
                whileHover={{ y: -30, scale: 1.03 }}
              >
                <div
                  className={`absolute inset-0 rounded-xl blur-lg transition-all duration-300 ${
                    selectedHandIndex === index
                      ? 'bg-blue-400/40 scale-110'
                      : 'bg-blue-600/20 scale-95'
                  }`}
                />
                <motion.img
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify(card)
                    );
                    setIsDragging(true);
                    setDraggedCard(card);
                    setSelectedHandIndex(index);
                    cancelHoverTimer();
                  }}
                  onDragEnd={() => {
                    setIsDragging(false);
                    setDraggedCard(null);
                    setSelectedHandIndex(null);
                  }}
                  onMouseEnter={(e) => {
                    startHoverTimer(card, 'player', e.currentTarget as any);
                    setSelectedHandIndex(index);
                  }}
                  onMouseLeave={() => {
                    cancelHoverTimer();
                    setSelectedHandIndex(null);
                  }}
                  src={card.image}
                  alt={card.name}
                  className={`relative w-24 h-32 object-cover rounded-xl border-2 transition-all duration-300 cursor-grab ${
                    selectedHandIndex === index
                      ? 'border-yellow-400 shadow-yellow-400/30'
                      : 'border-blue-500/50 hover:border-blue-400'
                  } ${
                    draggedCard?.id === card.id ? 'opacity-50 rotate-12' : ''
                  }`}
                  whileTap={{ scale: 0.97 }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Attack / Action Panel */}
        {playerActive &&
          aiActive &&
          currentPhase === 'PLAYER_TURN' &&
          !showPromotionModal && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-20 left-4 z-40 bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-2xl"
            >
              <div className="text-white text-sm font-bold mb-2">Actions:</div>
              <div className="flex flex-col gap-2">
                {/** Always map over an array; gate availability per-button */}
                {(Array.isArray(playerActive.attacks)
                  ? playerActive.attacks
                  : []
                ).map((attack, index) => {
                  const canUse =
                    bs.canAttackThisTurn && canUseAttack(playerActive, index);
                  const energyRequired = attack?.cost?.length || 0;
                  const energyHave = getEnergyCount(playerActive.id);

                  return (
                    <motion.button
                      key={index}
                      onClick={() => canUse && handleAttack(index)}
                      disabled={!canUse}
                      whileTap={canUse ? { scale: 0.98 } : undefined}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors relative ${
                        canUse
                          ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          {attack?.name} ({attack?.damage} damage)
                        </span>
                        <span className="text-xs">
                          {energyHave}/{energyRequired} ⚡
                        </span>
                      </div>
                      {!canUse && (
                        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-red-300">
                            {bs.canAttackThisTurn
                              ? `Need ${Math.max(
                                  0,
                                  energyRequired - energyHave
                                )} more energy`
                              : "Can't attack this turn"}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}

                {/* RETREAT */}
                {(() => {
                  const status = canRetreatNow();
                  const costLabel = playerActive
                    ? computeRetreatCostFromMaxHP(
                        playerActive.maxHp ?? playerActive.hp ?? 0
                      )
                    : 0;

                  return (
                    <motion.button
                      onClick={openRetreatModal}
                      disabled={!status.ok}
                      whileTap={status.ok ? { scale: 0.98 } : undefined}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors relative ${
                        status.ok
                          ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                      }`}
                      title={status.ok ? 'Retreat to bench' : status.reason}
                    >
                      <div className="flex justify-between items-center">
                        <span>Retreat</span>
                        <span className="text-xs">Cost: {costLabel} ⚡</span>
                      </div>
                      {!status.ok && status.reason && (
                        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-red-300">
                            {status.reason}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  );
                })()}
              </div>
            </motion.div>
          )}

        {/* Preview Card */}
        {previewCard && (
          <div
            className="fixed z-50 pointer-events-none animate-fadeIn"
            style={{
              left: `${previewPosition.x}px`,
              top:
                previewType === 'player'
                  ? `${previewPosition.y - 350}px`
                  : `${previewPosition.y + 50}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-2xl blur-2xl scale-110 animate-pulse ${
                  previewType === 'player'
                    ? 'bg-gradient-to-t from-blue-600/40 to-purple-600/40'
                    : 'bg-gradient-to-t from-red-600/40 to-orange-600/40'
                }`}
              />
              <img
                src={previewCard.image}
                alt={previewCard.name}
                className="relative w-48 h-auto object-contain drop-shadow-2xl rounded-2xl border-2 border-white/50"
              />
              <div
                className={`absolute left-0 right-0 text-center ${
                  previewType === 'player' ? '-bottom-8' : '-top-8'
                }`}
              >
                <div className="bg-black/90 backdrop-blur-md rounded-lg mx-4 px-4 py-2 inline-block">
                  <div className="text-white font-bold text-lg">
                    {previewCard.name}
                  </div>
                  {previewCard.hp && (
                    <div className="text-gray-300 text-sm">
                      {previewCard.hp}/{previewCard.maxHp} HP
                    </div>
                  )}
                  {getEnergyCount(previewCard.id) > 0 && (
                    <div className="text-yellow-400 text-sm flex items-center gap-1">
                      <span>Energy:</span>
                      {previewType === 'player' &&
                      getAttachedEnergies(previewCard.id).length > 0 ? (
                        <div className="flex items-center gap-1">
                          {getAttachedEnergies(previewCard.id).map(
                            (energy, idx) => (
                              <span key={idx}>{energy.symbol}</span>
                            )
                          )}
                          <span>({getEnergyCount(previewCard.id)})</span>
                        </div>
                      ) : previewType === 'opponent' ? (
                        <div className="flex items-center gap-1">
                          {getAIEnergySymbols(
                            previewCard as Card,
                            getEnergyCount(previewCard.id)
                          ).map((symbol, idx) => (
                            <span key={idx}>{symbol}</span>
                          ))}
                          <span>({getEnergyCount(previewCard.id)})</span>
                        </div>
                      ) : (
                        <span>⚡ {getEnergyCount(previewCard.id)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tiny toast for retreat error */}
        {retreatError && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="px-4 py-2 rounded-lg bg-red-600/90 text-white text-sm shadow-lg">
              {retreatError}
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateX(-50%) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) scale(1);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}</style>
      </motion.div>
    </LayoutGroup>
  );
}
