// src/app/lib/pve/progress.ts - Phase 6: Updated Progress Tracking
import { prisma } from '@/lib/db/prisma';
import { BattleState, Side } from './state';

// ================================
// PROGRESS TRACKING TYPES
// ================================

export interface BattleResult {
  battleId: string;
  userId: string;
  opponentId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  winner: Side;
  duration: number; // Battle duration in seconds
  turnsPlayed: number;
  playerFinalHP: number;
  aiFinalHP: number;
}

export interface ProgressUpdate {
  userId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  wins: number;
  losses: number;
  defeatedOpponents: string[]; // Array of opponent IDs that have been defeated
  coinsEarned: number;
  xpEarned: number;
  newDifficultiesUnlocked: string[]; // Array of newly unlocked difficulties
}

// ================================
// PROGRESS UPDATE FUNCTIONS
// ================================

/**
 * Update user progress after a battle ends
 */
export async function updateProgressOnBattleEnd(
  battleResult: BattleResult
): Promise<ProgressUpdate> {
  console.log('📊 Updating progress for battle:', battleResult.battleId);

  const isPlayerWin = battleResult.winner === 'PLAYER';

  // Get or create user progress record
  let progressRecord = await prisma.pveProgress.findFirst({
    where: {
      userId: battleResult.userId,
      difficulty: battleResult.difficulty,
    },
  });

  if (!progressRecord) {
    // Create new progress record
    progressRecord = await prisma.pveProgress.create({
      data: {
        userId: battleResult.userId,
        difficulty: battleResult.difficulty,
        unlockedIds: JSON.stringify([]),
        wins: 0,
        losses: 0,
      },
    });
  }

  // Parse current defeated opponents
  const currentDefeatedIds = Array.isArray(progressRecord.unlockedIds)
    ? progressRecord.unlockedIds
    : JSON.parse((progressRecord.unlockedIds as string) || '[]');

  // Calculate rewards
  const rewards = calculateBattleRewards(battleResult, isPlayerWin);

  // Update progress
  const newWins = progressRecord.wins + (isPlayerWin ? 1 : 0);
  const newLosses = progressRecord.losses + (isPlayerWin ? 0 : 1);

  // Add current opponent to defeated list if player won and not already there
  let newDefeatedIds = [...currentDefeatedIds];
  if (isPlayerWin && !currentDefeatedIds.includes(battleResult.opponentId)) {
    newDefeatedIds = [...currentDefeatedIds, battleResult.opponentId];
    console.log(`🏆 New opponent defeated: ${battleResult.opponentId}`);
  }

  // Check for difficulty progression unlock
  const newDifficultiesUnlocked = await checkDifficultyUnlocks(
    battleResult.userId,
    battleResult.difficulty,
    newDefeatedIds
  );

  // Update database
  await prisma.pveProgress.update({
    where: { id: progressRecord.id },
    data: {
      wins: newWins,
      losses: newLosses,
      unlockedIds: JSON.stringify(newDefeatedIds),
      lastClearedAt: isPlayerWin ? new Date() : progressRecord.lastClearedAt,
    },
  });

  // Update battle record in database
  await updateBattleRecord(battleResult);

  console.log(
    `📊 Progress updated: ${newWins}W/${newLosses}L, defeated: ${newDefeatedIds.length} opponents, +${rewards.coins} coins`
  );

  return {
    userId: battleResult.userId,
    difficulty: battleResult.difficulty,
    wins: newWins,
    losses: newLosses,
    defeatedOpponents: newDefeatedIds,
    coinsEarned: rewards.coins,
    xpEarned: rewards.xp,
    newDifficultiesUnlocked,
  };
}

/**
 * Calculate rewards based on battle result
 */
function calculateBattleRewards(
  battleResult: BattleResult,
  isPlayerWin: boolean
): { coins: number; xp: number } {
  if (!isPlayerWin) {
    return { coins: 0, xp: 5 }; // Small XP for participation
  }

  // Base rewards by difficulty
  const baseRewards = {
    EASY: { coins: 50, xp: 100 },
    MEDIUM: { coins: 75, xp: 150 },
    HARD: { coins: 100, xp: 200 },
  };

  const rewards = baseRewards[battleResult.difficulty];

  // Bonus for quick victories (under 10 turns)
  if (battleResult.turnsPlayed < 10) {
    rewards.coins = Math.floor(rewards.coins * 1.2);
    rewards.xp = Math.floor(rewards.xp * 1.1);
  }

  // Bonus for perfect health (no damage taken)
  if (battleResult.playerFinalHP > 0.8) {
    // More than 80% health remaining
    rewards.coins = Math.floor(rewards.coins * 1.1);
  }

  return rewards;
}

/**
 * Check if user has unlocked new difficulties based on defeated opponents
 */
async function checkDifficultyUnlocks(
  userId: string,
  currentDifficulty: 'EASY' | 'MEDIUM' | 'HARD',
  defeatedOpponentIds: string[]
): Promise<string[]> {
  const unlockedDifficulties: string[] = [];

  // Get total opponents count for each difficulty
  const easyOpponentsCount = await prisma.opponent.count({
    where: { difficulty: 'EASY' },
  });
  const mediumOpponentsCount = await prisma.opponent.count({
    where: { difficulty: 'MEDIUM' },
  });

  // Unlock Medium difficulty after ALL Easy opponents are defeated
  if (currentDifficulty === 'EASY') {
    const easyProgress = await prisma.pveProgress.findFirst({
      where: { userId, difficulty: 'EASY' },
    });

    if (easyProgress) {
      const easyDefeatedIds = Array.isArray(easyProgress.unlockedIds)
        ? easyProgress.unlockedIds
        : JSON.parse((easyProgress.unlockedIds as string) || '[]');

      // Check if ALL Easy opponents are defeated
      if (
        easyDefeatedIds.length >= easyOpponentsCount &&
        easyOpponentsCount > 0
      ) {
        const mediumProgress = await prisma.pveProgress.findFirst({
          where: { userId, difficulty: 'MEDIUM' },
        });

        if (!mediumProgress) {
          await prisma.pveProgress.create({
            data: {
              userId,
              difficulty: 'MEDIUM',
              unlockedIds: JSON.stringify([]),
              wins: 0,
              losses: 0,
            },
          });
          unlockedDifficulties.push('MEDIUM');
          console.log('🔓 Medium difficulty unlocked for user:', userId);
        }
      }
    }
  }

  // Unlock Hard difficulty after ALL Medium opponents are defeated
  if (currentDifficulty === 'MEDIUM') {
    const mediumProgress = await prisma.pveProgress.findFirst({
      where: { userId, difficulty: 'MEDIUM' },
    });

    if (mediumProgress) {
      const mediumDefeatedIds = Array.isArray(mediumProgress.unlockedIds)
        ? mediumProgress.unlockedIds
        : JSON.parse((mediumProgress.unlockedIds as string) || '[]');

      // Check if ALL Medium opponents are defeated
      if (
        mediumDefeatedIds.length >= mediumOpponentsCount &&
        mediumOpponentsCount > 0
      ) {
        const hardProgress = await prisma.pveProgress.findFirst({
          where: { userId, difficulty: 'HARD' },
        });

        if (!hardProgress) {
          await prisma.pveProgress.create({
            data: {
              userId,
              difficulty: 'HARD',
              unlockedIds: JSON.stringify([]),
              wins: 0,
              losses: 0,
            },
          });
          unlockedDifficulties.push('HARD');
          console.log('🔓 Hard difficulty unlocked for user:', userId);
        }
      }
    }
  }

  return unlockedDifficulties;
}

/**
 * Update the battle record in database with final result
 */
async function updateBattleRecord(battleResult: BattleResult): Promise<void> {
  try {
    await prisma.battle.update({
      where: { id: battleResult.battleId },
      data: {
        status: battleResult.winner === 'PLAYER' ? 'WON' : 'LOST',
        winner: battleResult.winner === 'PLAYER' ? 'PLAYER' : 'AI',
        endedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to update battle record:', error);
    // Don't throw - progress update is more important than battle record
  }
}

// ================================
// PROGRESS QUERIES
// ================================

/**
 * Get user's progress across all difficulties
 */
export async function getUserProgress(userId: string) {
  const progressRecords = await prisma.pveProgress.findMany({
    where: { userId },
    orderBy: { difficulty: 'asc' },
  });

  return progressRecords.map((record) => ({
    difficulty: record.difficulty,
    wins: record.wins,
    losses: record.losses,
    defeatedOpponents: Array.isArray(record.unlockedIds)
      ? record.unlockedIds
      : JSON.parse((record.unlockedIds as string) || '[]'),
    lastClearedAt: record.lastClearedAt,
    winRate:
      record.wins + record.losses > 0
        ? (record.wins / (record.wins + record.losses)) * 100
        : 0,
  }));
}

/**
 * Get user's total battle statistics
 */
export async function getUserBattleStats(userId: string) {
  const progressRecords = await prisma.pveProgress.findMany({
    where: { userId },
  });

  const totalWins = progressRecords.reduce(
    (sum, record) => sum + record.wins,
    0
  );
  const totalLosses = progressRecords.reduce(
    (sum, record) => sum + record.losses,
    0
  );
  const totalBattles = totalWins + totalLosses;

  // Count total defeated opponents across all difficulties
  const totalDefeatedOpponents = progressRecords.reduce((sum, record) => {
    const defeatedIds = Array.isArray(record.unlockedIds)
      ? record.unlockedIds
      : JSON.parse((record.unlockedIds as string) || '[]');
    return sum + defeatedIds.length;
  }, 0);

  return {
    totalBattles,
    totalWins,
    totalLosses,
    totalDefeatedOpponents,
    overallWinRate: totalBattles > 0 ? (totalWins / totalBattles) * 100 : 0,
    difficultiesUnlocked: progressRecords.length,
  };
}

/**
 * Check if user has access to a specific difficulty
 */
export async function hasAccessToDifficulty(
  userId: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
): Promise<boolean> {
  // Easy is always accessible
  if (difficulty === 'EASY') return true;

  // Check if Medium is unlocked (requires ALL Easy opponents defeated)
  if (difficulty === 'MEDIUM') {
    const easyProgress = await prisma.pveProgress.findFirst({
      where: { userId, difficulty: 'EASY' },
    });

    if (!easyProgress) return false;

    const easyDefeatedIds = Array.isArray(easyProgress.unlockedIds)
      ? easyProgress.unlockedIds
      : JSON.parse((easyProgress.unlockedIds as string) || '[]');

    const easyOpponentsCount = await prisma.opponent.count({
      where: { difficulty: 'EASY' },
    });

    return (
      easyDefeatedIds.length >= easyOpponentsCount && easyOpponentsCount > 0
    );
  }

  // Check if Hard is unlocked (requires ALL Medium opponents defeated)
  if (difficulty === 'HARD') {
    const mediumProgress = await prisma.pveProgress.findFirst({
      where: { userId, difficulty: 'MEDIUM' },
    });

    if (!mediumProgress) return false;

    const mediumDefeatedIds = Array.isArray(mediumProgress.unlockedIds)
      ? mediumProgress.unlockedIds
      : JSON.parse((mediumProgress.unlockedIds as string) || '[]');

    const mediumOpponentsCount = await prisma.opponent.count({
      where: { difficulty: 'MEDIUM' },
    });

    return (
      mediumDefeatedIds.length >= mediumOpponentsCount &&
      mediumOpponentsCount > 0
    );
  }

  return false;
}

/**
 * Get next opponent suggestions based on user progress
 */
export async function getRecommendedOpponents(
  userId: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
) {
  // Get user's progress for this difficulty
  const progressRecord = await prisma.pveProgress.findFirst({
    where: { userId, difficulty },
  });

  const defeatedIds = progressRecord
    ? Array.isArray(progressRecord.unlockedIds)
      ? progressRecord.unlockedIds
      : JSON.parse((progressRecord.unlockedIds as string) || '[]')
    : [];

  // Get all opponents for this difficulty
  const allOpponents = await prisma.opponent.findMany({
    where: { difficulty },
    orderBy: { element: 'asc' },
  });

  // Mark which opponents are defeated and suggest next challenges
  return allOpponents.map((opponent) => ({
    ...opponent,
    isDefeated: defeatedIds.includes(opponent.id),
    isRecommended: !defeatedIds.includes(opponent.id) && opponent.unlocked,
  }));
}

// ================================
// LEADERBOARD & ACHIEVEMENTS
// ================================

/**
 * Get top players for a specific difficulty (future feature)
 */
export async function getLeaderboard(
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  limit: number = 10
) {
  const topPlayers = await prisma.pveProgress.findMany({
    where: { difficulty },
    orderBy: [{ wins: 'desc' }, { losses: 'asc' }],
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  return topPlayers.map((record, index) => ({
    rank: index + 1,
    username: record.user.username,
    wins: record.wins,
    losses: record.losses,
    defeatedOpponents: Array.isArray(record.unlockedIds)
      ? record.unlockedIds.length
      : JSON.parse((record.unlockedIds as string) || '[]').length,
    winRate:
      record.wins + record.losses > 0
        ? (record.wins / (record.wins + record.losses)) * 100
        : 0,
  }));
}
