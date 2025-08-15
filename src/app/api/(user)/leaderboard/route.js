// app/api/leaderboard/route.js
import { PrismaClient } from '@prisma/client';

import { DateTime } from 'luxon';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Get the period filter from URL parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'all-time';

    console.log(`🔍 Fetching leaderboard for period: ${period}`);

    // Calculate date filters based on period
    let dateFilter = {};

    const now = DateTime.now().setZone('Asia/Kuala_Lumpur');

    switch (period) {
      case 'weekly': {
        // Start of current week (Monday 00:00)
        const startOfWeek = now.startOf('week'); // Luxon treats Monday as start of week
        dateFilter = {
          createdAt: {
            gte: startOfWeek.toJSDate(),
          },
        };
        console.log(`📅 Weekly filter (MY): From ${startOfWeek.toISO()}`);
        break;
      }

      case 'monthly': {
        // Start of current month (1st 00:00)
        const startOfMonth = now.startOf('month');
        dateFilter = {
          createdAt: {
            gte: startOfMonth.toJSDate(),
          },
        };
        console.log(`📅 Monthly filter (MY): From ${startOfMonth.toISO()}`);
        break;
      }

      case 'all-time':
      default: {
        dateFilter = {};
        console.log(`📅 All-time filter: No date restrictions`);
        break;
      }
    }

    const finishedRooms = await prisma.room.findMany({
      where: {
        isFinished: true,
        winnerId: {
          not: null,
        },
        ...dateFilter, // Apply the date filter here
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
        winnerId: true,
        player1Id: true,
        player2Id: true,
        player1Avatar: true,
        player2Avatar: true,
      },
    });

    console.log(`📊 Found ${finishedRooms.length} games for ${period} period`);

    // Step 2: Get all unique players
    const playerIds = new Set();
    finishedRooms.forEach((room) => {
      if (room.player1Id) playerIds.add(room.player1Id);
      if (room.player2Id) playerIds.add(room.player2Id);
    });

    console.log(`Found ${playerIds.size} unique players`);

    // Step 3: Get user information for display names (using lowercase 'user' model)
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(playerIds),
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    console.log(`Found ${users.length} users with data`);

    // Create user lookup map
    const userMap = new Map();
    users.forEach((user) => {
      userMap.set(user.id, user);
    });

    // Step 4: Calculate win streaks for each player
    const leaderboardData = [];

    for (const playerId of playerIds) {
      // Get all games for this player, ordered by most recent first
      const playerGames = finishedRooms
        .filter(
          (room) => room.player1Id === playerId || room.player2Id === playerId
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Calculate current win streak (consecutive wins from most recent game)
      let currentStreak = 0;
      let totalWins = 0;
      let totalGames = playerGames.length;

      // Count total wins first
      totalWins = playerGames.filter(
        (game) => game.winnerId === playerId
      ).length;

      // Count consecutive wins from most recent game
      for (const game of playerGames) {
        const isWinner = game.winnerId === playerId;

        if (isWinner) {
          currentStreak++;
        } else {
          // Stop counting streak when we hit a loss
          break;
        }
      }

      // Calculate win rate
      const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

      // Get player avatar (prefer the most recent one)
      let avatar = null;
      for (const game of playerGames) {
        if (game.player1Id === playerId && game.player1Avatar) {
          avatar = game.player1Avatar;
          break;
        }
        if (game.player2Id === playerId && game.player2Avatar) {
          avatar = game.player2Avatar;
          break;
        }
      }

      // Get user info
      const userInfo = userMap.get(playerId);

      // Add to leaderboard if player has played games
      if (totalGames > 0) {
        leaderboardData.push({
          playerId,
          username: userInfo?.username || `Trainer${playerId.slice(0, 8)}`,
          email: userInfo?.email,
          winStreak: currentStreak,
          totalWins,
          totalGames,
          winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
          avatar,
          lastPlayed: playerGames[0]?.createdAt,
          joinedAt: userInfo?.createdAt,
        });
      }
    }

    console.log(`Generated leaderboard for ${leaderboardData.length} players`);

    // Step 5: Sort by win streak (descending), then by total wins, then by win rate
    leaderboardData.sort((a, b) => {
      if (b.winStreak !== a.winStreak) return b.winStreak - a.winStreak;
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      return b.winRate - a.winRate;
    });

    // Step 6: Add ranking
    const rankedLeaderboard = leaderboardData.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

    return Response.json({
      success: true,
      data: rankedLeaderboard,
      period: period,
      stats: {
        totalPlayers: playerIds.size,
        totalGames: finishedRooms.length,
        topStriker: rankedLeaderboard[0]?.username || null,
        totalRegisteredUsers: users.length,
        averageStreak:
          rankedLeaderboard.length > 0
            ? Math.round(
                (rankedLeaderboard.reduce((acc, p) => acc + p.winStreak, 0) /
                  rankedLeaderboard.length) *
                  10
              ) / 10
            : 0,
        dateRange:
          period === 'all-time'
            ? 'All Time'
            : period === 'weekly'
            ? 'Last 7 Days'
            : period === 'monthly'
            ? 'Last 30 Days'
            : period,
        gamesInPeriod: finishedRooms.length,
      },
    });
  } catch (error) {
    console.error('Error calculating leaderboard:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
