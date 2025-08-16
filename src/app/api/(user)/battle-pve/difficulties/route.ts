// /app/api/pve/difficulties/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireDbUser } from '@/lib/auth/auth-compat'; // CHANGED: Use requireDbUser instead of getCurrentUser

interface DifficultyItem {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  unlocked: boolean;
  totalOpponents: number;
  clearedOpponents: number;
}

export async function GET(req: NextRequest) {
  try {
    console.log('=== DEBUG: GET /api/pve/difficulties ===');

    // CHANGED: Use requireDbUser to match battle system
    let user = null;
    try {
      user = await requireDbUser(req);
      console.log('Authenticated user:', user);
    } catch (error) {
      console.log('No authenticated user, using defaults');
    }

    // Get total opponents count per difficulty
    const opponentCounts = await prisma.opponent.groupBy({
      by: ['difficulty'],
      _count: {
        id: true,
      },
    });

    // Get user's progress for all difficulties (if user is authenticated)
    const userProgresses = user
      ? await prisma.pveProgress.findMany({
          where: { userId: user.id },
        })
      : [];

    console.log('User progresses found:', userProgresses);

    const difficulties: DifficultyItem[] = [
      {
        difficulty: 'EASY',
        unlocked: true, // Easy is always unlocked
        totalOpponents:
          opponentCounts.find((c) => c.difficulty === 'EASY')?._count.id || 0,
        clearedOpponents: 0,
      },
      {
        difficulty: 'MEDIUM',
        unlocked: false,
        totalOpponents:
          opponentCounts.find((c) => c.difficulty === 'MEDIUM')?._count.id || 0,
        clearedOpponents: 0,
      },
      {
        difficulty: 'HARD',
        unlocked: false,
        totalOpponents:
          opponentCounts.find((c) => c.difficulty === 'HARD')?._count.id || 0,
        clearedOpponents: 0,
      },
    ];

    // Update with user's actual progress and proper unlock logic
    if (user && userProgresses.length > 0) {
      for (const progress of userProgresses) {
        const diffIndex = difficulties.findIndex(
          (d) => d.difficulty === progress.difficulty
        );

        if (diffIndex !== -1) {
          // Parse defeated opponents
          const defeatedIds = Array.isArray(progress.unlockedIds)
            ? progress.unlockedIds
            : JSON.parse((progress.unlockedIds as string) || '[]');

          // Set cleared opponents count
          difficulties[diffIndex].clearedOpponents = defeatedIds.length;
          console.log(
            `${progress.difficulty} has ${defeatedIds.length} defeated opponents`
          );
        }
      }

      // Apply proper unlock logic:
      // Medium unlocked when ALL Easy opponents are defeated
      const easyDiff = difficulties.find((d) => d.difficulty === 'EASY');
      if (
        easyDiff &&
        easyDiff.clearedOpponents >= easyDiff.totalOpponents &&
        easyDiff.totalOpponents > 0
      ) {
        const mediumIndex = difficulties.findIndex(
          (d) => d.difficulty === 'MEDIUM'
        );
        if (mediumIndex !== -1) {
          difficulties[mediumIndex].unlocked = true;
        }
      }

      // Hard unlocked when ALL Medium opponents are defeated
      const mediumDiff = difficulties.find((d) => d.difficulty === 'MEDIUM');
      if (
        mediumDiff &&
        mediumDiff.clearedOpponents >= mediumDiff.totalOpponents &&
        mediumDiff.totalOpponents > 0
      ) {
        const hardIndex = difficulties.findIndex(
          (d) => d.difficulty === 'HARD'
        );
        if (hardIndex !== -1) {
          difficulties[hardIndex].unlocked = true;
        }
      }
    }

    console.log(
      'Returning difficulties with proper unlock logic:',
      difficulties
    );
    return NextResponse.json(difficulties);
  } catch (error) {
    console.error('GET /api/pve/difficulties error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// // /app/api/pve/difficulties/route.ts - Phase 6: Fixed Progress & Unlocks
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/app/lib/prisma";
// import { getCurrentUser } from "@/app/lib/auth-compat";

// interface DifficultyItem {
//   difficulty: "EASY" | "MEDIUM" | "HARD";
//   unlocked: boolean;
//   totalOpponents: number;
//   clearedOpponents: number;
// }

// export async function GET(req: NextRequest) {
//   try {
//     console.log("=== DEBUG: GET /api/pve/difficulties ===");

//     // Use your existing auth system
//     const user = await getCurrentUser(req);
//     console.log("Authenticated user:", user);

//     // Get total opponents count per difficulty
//     const opponentCounts = await prisma.opponent.groupBy({
//       by: ["difficulty"],
//       _count: {
//         id: true,
//       },
//     });

//     // Get user's progress for all difficulties (if user is authenticated)
//     const userProgresses = user
//       ? await prisma.pveProgress.findMany({
//           where: { userId: user.id },
//         })
//       : [];

//     const difficulties: DifficultyItem[] = [
//       {
//         difficulty: "EASY",
//         unlocked: true, // Easy is always unlocked
//         totalOpponents:
//           opponentCounts.find((c) => c.difficulty === "EASY")?._count.id || 0,
//         clearedOpponents: 0,
//       },
//       {
//         difficulty: "MEDIUM",
//         unlocked: false,
//         totalOpponents:
//           opponentCounts.find((c) => c.difficulty === "MEDIUM")?._count.id || 0,
//         clearedOpponents: 0,
//       },
//       {
//         difficulty: "HARD",
//         unlocked: false,
//         totalOpponents:
//           opponentCounts.find((c) => c.difficulty === "HARD")?._count.id || 0,
//         clearedOpponents: 0,
//       },
//     ];

//     // Update with user's actual progress and proper unlock logic
//     if (user && userProgresses.length > 0) {
//       for (const progress of userProgresses) {
//         const diffIndex = difficulties.findIndex(
//           (d) => d.difficulty === progress.difficulty
//         );

//         if (diffIndex !== -1) {
//           // Parse defeated opponents
//           const defeatedIds = Array.isArray(progress.unlockedIds)
//             ? progress.unlockedIds
//             : JSON.parse((progress.unlockedIds as string) || "[]");

//           // Set cleared opponents count
//           difficulties[diffIndex].clearedOpponents = defeatedIds.length;
//         }
//       }

//       // Apply proper unlock logic:
//       // Medium unlocked when ALL Easy opponents are defeated
//       const easyDiff = difficulties.find((d) => d.difficulty === "EASY");
//       if (
//         easyDiff &&
//         easyDiff.clearedOpponents >= easyDiff.totalOpponents &&
//         easyDiff.totalOpponents > 0
//       ) {
//         const mediumIndex = difficulties.findIndex(
//           (d) => d.difficulty === "MEDIUM"
//         );
//         if (mediumIndex !== -1) {
//           difficulties[mediumIndex].unlocked = true;
//         }
//       }

//       // Hard unlocked when ALL Medium opponents are defeated
//       const mediumDiff = difficulties.find((d) => d.difficulty === "MEDIUM");
//       if (
//         mediumDiff &&
//         mediumDiff.clearedOpponents >= mediumDiff.totalOpponents &&
//         mediumDiff.totalOpponents > 0
//       ) {
//         const hardIndex = difficulties.findIndex(
//           (d) => d.difficulty === "HARD"
//         );
//         if (hardIndex !== -1) {
//           difficulties[hardIndex].unlocked = true;
//         }
//       }
//     }

//     console.log(
//       "Returning difficulties with proper unlock logic:",
//       difficulties
//     );
//     return NextResponse.json(difficulties);
//   } catch (error) {
//     console.error("GET /api/pve/difficulties error:", error);
//     return NextResponse.json(
//       {
//         error: "Server error",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }

// // /app/api/pve/difficulties/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/app/lib/prisma";
// import { getCurrentUser } from "@/app/lib/auth-compat";

// interface DifficultyItem {
//   difficulty: "EASY" | "MEDIUM" | "HARD";
//   unlocked: boolean;
//   totalOpponents: number;
//   clearedOpponents: number;
// }

// export async function GET(req: NextRequest) {
//   try {
//     console.log("=== DEBUG: GET /api/pve/difficulties ===");

//     // Use your existing auth system
//     const user = await getCurrentUser(req);
//     console.log("Authenticated user:", user);

//     // Get user's progress for all difficulties (if user is authenticated)
//     const userProgresses = user
//       ? await prisma.pveProgress.findMany({
//           where: { userId: user.id },
//         })
//       : [];

//     // Get total opponents count per difficulty
//     const opponentCounts = await prisma.opponent.groupBy({
//       by: ["difficulty"],
//       _count: {
//         id: true,
//       },
//     });

//     const difficulties: DifficultyItem[] = [
//       {
//         difficulty: "EASY",
//         unlocked: true, // Easy is always unlocked
//         totalOpponents:
//           opponentCounts.find((c) => c.difficulty === "EASY")?._count.id || 0,
//         clearedOpponents: 0,
//       },
//       {
//         difficulty: "MEDIUM",
//         unlocked: false,
//         totalOpponents:
//           opponentCounts.find((c) => c.difficulty === "MEDIUM")?._count.id || 0,
//         clearedOpponents: 0,
//       },
//       {
//         difficulty: "HARD",
//         unlocked: false,
//         totalOpponents:
//           opponentCounts.find((c) => c.difficulty === "HARD")?._count.id || 0,
//         clearedOpponents: 0,
//       },
//     ];

//     // Update with user's actual progress
//     if (user && userProgresses.length > 0) {
//       userProgresses.forEach((progress) => {
//         const diffIndex = difficulties.findIndex(
//           (d) => d.difficulty === progress.difficulty
//         );
//         if (diffIndex !== -1) {
//           difficulties[diffIndex].clearedOpponents = progress.wins;

//           // Unlock logic: Easy always unlocked, Medium unlocked if Easy has wins, Hard unlocked if Medium has wins
//           if (progress.difficulty === "EASY" && progress.wins > 0) {
//             const mediumIndex = difficulties.findIndex(
//               (d) => d.difficulty === "MEDIUM"
//             );
//             if (mediumIndex !== -1) difficulties[mediumIndex].unlocked = true;
//           }

//           if (progress.difficulty === "MEDIUM" && progress.wins > 0) {
//             const hardIndex = difficulties.findIndex(
//               (d) => d.difficulty === "HARD"
//             );
//             if (hardIndex !== -1) difficulties[hardIndex].unlocked = true;
//           }
//         }
//       });
//     }

//     console.log("Returning difficulties:", difficulties);
//     return NextResponse.json(difficulties);
//   } catch (error) {
//     console.error("GET /api/pve/difficulties error:", error);
//     return NextResponse.json(
//       {
//         error: "Server error",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }
