// src/app/lib/pve/context-rehydrate.ts
// Rehydrate Battle Context including typed energy lists

import { BattleState, BattleContext } from './state';
import { getCards } from './cards';

/**
 * Rehydrate the battle context from a saved battle state
 * This rebuilds the card instances and syncs runtime data with persisted data
 */
export async function rehydrateContextFromState(
  state: BattleState,
  context: BattleContext
): Promise<void> {
  console.log('🔄 Rehydrating battle context from saved state...');

  // ✅ Ensure typed energy storage exists
  state.energyTypes = state.energyTypes || {};

  // Clear existing instances
  context.cardInstances.clear();

  // Collect all card references from the battle state
  const allCardRefs = [
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

  // Get unique token IDs
  const uniqueTokenIds = [...new Set(allCardRefs.map((ref) => ref.id))];

  // Load any missing card data
  const missingCardIds = uniqueTokenIds.filter(
    (id) => !context.cardDataCache.has(id)
  );

  if (missingCardIds.length > 0) {
    const cardData = await getCards(missingCardIds);
    cardData.forEach((card) => {
      context.cardDataCache.set(String(card.tokenId), card);
    });
  }

  // Rebuild card instances with runtime data
  for (const cardRef of allCardRefs) {
    const cardData = context.cardDataCache.get(cardRef.id);
    if (!cardData) {
      console.warn(`⚠️ Card data not found for tokenId: ${cardRef.id}`);
      continue;
    }

    const currentHp = state.hpByIid?.[cardRef.iid] ?? cardData.hp;
    const energiesAttached = state.energies?.[cardRef.iid] || 0;
    const energyTypesAttached = state.energyTypes?.[cardRef.iid] || [];

    context.cardInstances.set(cardRef.iid, {
      iid: cardRef.iid,
      cardData,
      hp: currentHp,
      maxHp: cardData.hp,
      energiesAttached,
      energyTypesAttached: Array.isArray(energyTypesAttached)
        ? [...energyTypesAttached]
        : [], // ✅ robust
      statusEffects: [],
    });
  }

  console.log(`✅ Rehydrated ${context.cardInstances.size} card instances`);
}

/**
 * Validate that all card references in the state have corresponding instances
 */
export function validateContextIntegrity(
  state: BattleState,
  context: BattleContext
): string[] {
  const errors: string[] = [];

  const allCardRefs = [
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

  for (const cardRef of allCardRefs) {
    if (!context.cardInstances.has(cardRef.iid)) {
      errors.push(
        `Missing card instance for ${cardRef.iid} (tokenId: ${cardRef.id})`
      );
    }
  }

  for (const [iid, instance] of context.cardInstances) {
    const persistedHp = state.hpByIid?.[iid];
    if (persistedHp !== undefined && instance.hp !== persistedHp) {
      errors.push(
        `HP mismatch for ${iid}: instance=${instance.hp}, persisted=${persistedHp}`
      );
    }
  }

  for (const [iid, instance] of context.cardInstances) {
    const persistedEnergy = state.energies?.[iid] || 0;
    if (instance.energiesAttached !== persistedEnergy) {
      errors.push(
        `Energy mismatch for ${iid}: instance=${instance.energiesAttached}, persisted=${persistedEnergy}`
      );
    }
    const persistedTypes = state.energyTypes?.[iid] || [];
    if (
      JSON.stringify(instance.energyTypesAttached) !==
      JSON.stringify(persistedTypes)
    ) {
      errors.push(
        `Energy types mismatch for ${iid}: instance=${JSON.stringify(
          instance.energyTypesAttached
        )}, persisted=${JSON.stringify(persistedTypes)}`
      );
    }
  }

  return errors;
}

/**
 * Sync runtime card instance data with persisted state
 */
export function syncInstancesWithState(
  state: BattleState,
  context: BattleContext
): void {
  for (const [iid, instance] of context.cardInstances) {
    const persistedHp = state.hpByIid?.[iid];
    if (persistedHp !== undefined) {
      instance.hp = persistedHp;
    }

    const persistedEnergy = state.energies?.[iid] || 0;
    instance.energiesAttached = persistedEnergy;

    const persistedTypes = state.energyTypes?.[iid] || [];
    instance.energyTypesAttached = Array.isArray(persistedTypes)
      ? [...persistedTypes]
      : [];
  }
}

/**
 * Create a battle context suitable for rehydration
 */
export function createRehydrationContext(): BattleContext {
  return {
    cardInstances: new Map(),
    cardDataCache: new Map(),
  };
}

// // src/app/lib/pve/context-rehydrate.ts - Rehydrate Battle Context from Saved State
// import { BattleState, BattleContext } from "./state";
// import { getCards } from "./cards";

// /**
//  * Rehydrate the battle context from a saved battle state
//  * This rebuilds the card instances and syncs runtime data with persisted data
//  */
// export async function rehydrateContextFromState(
//   state: BattleState,
//   context: BattleContext
// ): Promise<void> {
//   console.log("🔄 Rehydrating battle context from saved state...");

//   // Clear existing instances
//   context.cardInstances.clear();

//   // Collect all card references from the battle state
//   const allCardRefs = [
//     ...(state.active.player ? [state.active.player] : []),
//     ...(state.active.ai ? [state.active.ai] : []),
//     ...state.hands.player,
//     ...state.hands.ai,
//     ...state.decks.player,
//     ...state.decks.ai,
//     ...state.discards.player,
//     ...state.discards.ai,
//     ...(state.bench.player.filter((c) => c !== null) as any[]),
//     ...(state.bench.ai.filter((c) => c !== null) as any[]),
//   ];

//   // Get unique token IDs
//   const uniqueTokenIds = [...new Set(allCardRefs.map((ref) => ref.id))];

//   console.log(
//     `🔄 Found ${allCardRefs.length} card references, ${uniqueTokenIds.length} unique cards`
//   );

//   // Load card data if not already cached
//   const missingCardIds = uniqueTokenIds.filter(
//     (id) => !context.cardDataCache.has(id)
//   );

//   if (missingCardIds.length > 0) {
//     console.log(
//       `🔄 Loading ${missingCardIds.length} missing cards from database`
//     );
//     const cardData = await getCards(missingCardIds);
//     cardData.forEach((card) => {
//       context.cardDataCache.set(String(card.tokenId), card);
//     });
//   }

//   // Rebuild card instances with runtime data
//   for (const cardRef of allCardRefs) {
//     const cardData = context.cardDataCache.get(cardRef.id);
//     if (!cardData) {
//       console.warn(`⚠️ Card data not found for tokenId: ${cardRef.id}`);
//       continue;
//     }

//     // Get persisted HP (fallback to max HP if not found)
//     const currentHp = state.hpByIid?.[cardRef.iid] ?? cardData.hp;

//     // Get energy count
//     const energiesAttached = state.energies?.[cardRef.iid] || 0;

//     // Create instance
//     const instance = {
//       iid: cardRef.iid,
//       cardData,
//       hp: currentHp,
//       maxHp: cardData.hp,
//       energiesAttached,
//       statusEffects: [], // TODO: Add status effects support if needed
//     };

//     context.cardInstances.set(cardRef.iid, instance);
//   }

//   console.log(`✅ Rehydrated ${context.cardInstances.size} card instances`);
// }

// /**
//  * Validate that all card references in the state have corresponding instances
//  */
// export function validateContextIntegrity(
//   state: BattleState,
//   context: BattleContext
// ): string[] {
//   const errors: string[] = [];

//   // Collect all card references
//   const allCardRefs = [
//     ...(state.active.player ? [state.active.player] : []),
//     ...(state.active.ai ? [state.active.ai] : []),
//     ...state.hands.player,
//     ...state.hands.ai,
//     ...state.decks.player,
//     ...state.decks.ai,
//     ...state.discards.player,
//     ...state.discards.ai,
//     ...(state.bench.player.filter((c) => c !== null) as any[]),
//     ...(state.bench.ai.filter((c) => c !== null) as any[]),
//   ];

//   // Check that each reference has a corresponding instance
//   for (const cardRef of allCardRefs) {
//     if (!context.cardInstances.has(cardRef.iid)) {
//       errors.push(
//         `Missing card instance for ${cardRef.iid} (tokenId: ${cardRef.id})`
//       );
//     }
//   }

//   // Check that HP values are synced
//   for (const [iid, instance] of context.cardInstances) {
//     const persistedHp = state.hpByIid?.[iid];
//     if (persistedHp !== undefined && instance.hp !== persistedHp) {
//       errors.push(
//         `HP mismatch for ${iid}: instance=${instance.hp}, persisted=${persistedHp}`
//       );
//     }
//   }

//   // Check that energy values are synced
//   for (const [iid, instance] of context.cardInstances) {
//     const persistedEnergy = state.energies?.[iid] || 0;
//     if (instance.energiesAttached !== persistedEnergy) {
//       errors.push(
//         `Energy mismatch for ${iid}: instance=${instance.energiesAttached}, persisted=${persistedEnergy}`
//       );
//     }
//   }

//   return errors;
// }

// /**
//  * Sync runtime card instance data with persisted state
//  * Call this after modifying HP or energy in the state
//  */
// export function syncInstancesWithState(
//   state: BattleState,
//   context: BattleContext
// ): void {
//   for (const [iid, instance] of context.cardInstances) {
//     // Sync HP
//     const persistedHp = state.hpByIid?.[iid];
//     if (persistedHp !== undefined) {
//       instance.hp = persistedHp;
//     }

//     // Sync energy
//     const persistedEnergy = state.energies?.[iid] || 0;
//     instance.energiesAttached = persistedEnergy;
//   }
// }

// /**
//  * Create a battle context suitable for rehydration
//  * This ensures the context has the necessary structure
//  */
// export function createRehydrationContext(): BattleContext {
//   return {
//     cardInstances: new Map(),
//     cardDataCache: new Map(),
//   };
// }
