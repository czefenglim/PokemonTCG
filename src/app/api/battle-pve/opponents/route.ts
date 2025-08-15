// /app/api/pve/opponents/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireDbUser } from '@/lib/auth/auth-compat'; // CHANGED: Use requireDbUser instead of getCurrentUser

interface OpponentResponse {
  id: string;
  name: string;
  element: string;
  difficulty: string;
  portraitUrl: string;
  intro: string;
  rewardCoins: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export async function GET(req: NextRequest) {
  try {
    console.log('=== DEBUG: GET /api/pve/opponents ===');

    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get('difficulty') as
      | 'EASY'
      | 'MEDIUM'
      | 'HARD';

    if (!difficulty || !['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid or missing difficulty parameter' },
        { status: 400 }
      );
    }

    // CHANGED: Use requireDbUser to match battle system
    let user = null;
    try {
      user = await requireDbUser(req);
      console.log('Authenticated user:', user);
    } catch (error) {
      console.log('No authenticated user, using defaults');
    }

    // Get all opponents for this difficulty
    const opponents = await prisma.opponent.findMany({
      where: { difficulty },
      orderBy: { element: 'asc' },
    });

    // Get user's progress for this difficulty (to check defeated opponents)
    let userProgress = null;
    if (user) {
      userProgress = await prisma.pveProgress.findFirst({
        where: {
          userId: user.id,
          difficulty,
        },
      });
      console.log('User progress for', difficulty, ':', userProgress);
    }

    // Transform opponents with unlock and completion status
    const opponentsWithStatus: OpponentResponse[] = opponents.map(
      (opponent) => {
        let isUnlocked = opponent.unlocked; // Default from database (most should be true)
        let isCompleted = false;

        // If user has progress, check completion status
        if (userProgress) {
          const defeatedIds = Array.isArray(userProgress.unlockedIds)
            ? userProgress.unlockedIds
            : JSON.parse((userProgress.unlockedIds as string) || '[]');

          // Check if this opponent has been defeated
          isCompleted = defeatedIds.includes(opponent.id);
          console.log(`Opponent ${opponent.name} completed:`, isCompleted);

          // For now, keep most opponents unlocked by default
          isUnlocked = true;
        }

        return {
          id: opponent.id,
          name: opponent.name,
          element: opponent.element,
          difficulty: opponent.difficulty,
          portraitUrl: opponent.portraitUrl,
          intro: opponent.intro,
          rewardCoins: opponent.rewardCoins,
          isUnlocked,
          isCompleted,
        };
      }
    );

    console.log(
      `Returning ${opponentsWithStatus.length} opponents for ${difficulty}`
    );
    return NextResponse.json(opponentsWithStatus);
  } catch (error) {
    console.error('GET /api/pve/opponents error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// // /app/api/pve/opponents/route.ts - Phase 6: Added Completion Status
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/app/lib/prisma";
// import { getCurrentUser } from "@/app/lib/auth-compat";

// interface OpponentResponse {
//   id: string;
//   name: string;
//   element: string;
//   difficulty: string;
//   portraitUrl: string;
//   intro: string;
//   rewardCoins: number;
//   isUnlocked: boolean;
//   isCompleted: boolean; // NEW: Track if opponent has been defeated
// }

// export async function GET(req: NextRequest) {
//   try {
//     console.log("=== DEBUG: GET /api/pve/opponents ===");

//     const { searchParams } = new URL(req.url);
//     const difficulty = searchParams.get("difficulty") as
//       | "EASY"
//       | "MEDIUM"
//       | "HARD";

//     if (!difficulty || !["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
//       return NextResponse.json(
//         { error: "Invalid or missing difficulty parameter" },
//         { status: 400 }
//       );
//     }

//     // Use your existing auth system
//     const user = await getCurrentUser(req);
//     console.log("Authenticated user:", user);

//     // Get all opponents for this difficulty
//     const opponents = await prisma.opponent.findMany({
//       where: { difficulty },
//       orderBy: { element: "asc" },
//     });

//     // Get user's progress for this difficulty (to check defeated opponents)
//     let userProgress = null;
//     if (user) {
//       userProgress = await prisma.pveProgress.findFirst({
//         where: {
//           userId: user.id,
//           difficulty,
//         },
//       });
//     }

//     // Transform opponents with unlock and completion status
//     const opponentsWithStatus: OpponentResponse[] = opponents.map(
//       (opponent) => {
//         let isUnlocked = opponent.unlocked; // Default from database (most should be true)
//         let isCompleted = false;

//         // If user has progress, check completion status
//         if (userProgress) {
//           const defeatedIds = Array.isArray(userProgress.unlockedIds)
//             ? userProgress.unlockedIds
//             : JSON.parse((userProgress.unlockedIds as string) || "[]");

//           // Check if this opponent has been defeated
//           isCompleted = defeatedIds.includes(opponent.id);

//           // For now, keep most opponents unlocked by default
//           // You can modify this logic later if you want progressive unlocking within a difficulty
//           isUnlocked = true;
//         }

//         return {
//           id: opponent.id,
//           name: opponent.name,
//           element: opponent.element,
//           difficulty: opponent.difficulty,
//           portraitUrl: opponent.portraitUrl,
//           intro: opponent.intro,
//           rewardCoins: opponent.rewardCoins,
//           isUnlocked,
//           isCompleted, // NEW: Shows if opponent has been defeated
//         };
//       }
//     );

//     console.log(
//       `Returning ${opponentsWithStatus.length} opponents for ${difficulty}`
//     );
//     return NextResponse.json(opponentsWithStatus);
//   } catch (error) {
//     console.error("GET /api/pve/opponents error:", error);
//     return NextResponse.json(
//       {
//         error: "Server error",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }

// // /app/api/pve/opponents/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/app/lib/prisma";
// import { getCurrentUser } from "@/app/lib/auth-compat";

// interface OpponentResponse {
//   id: string;
//   name: string;
//   element: string;
//   difficulty: string;
//   portraitUrl: string;
//   intro: string;
//   rewardCoins: number;
//   isUnlocked: boolean;
// }

// export async function GET(req: NextRequest) {
//   try {
//     console.log("=== DEBUG: GET /api/pve/opponents ===");

//     const { searchParams } = new URL(req.url);
//     const difficulty = searchParams.get("difficulty") as
//       | "EASY"
//       | "MEDIUM"
//       | "HARD";

//     if (!difficulty || !["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
//       return NextResponse.json(
//         { error: "Invalid or missing difficulty parameter" },
//         { status: 400 }
//       );
//     }

//     // Use your existing auth system
//     const user = await getCurrentUser(req);
//     console.log("Authenticated user:", user);

//     // Get all opponents for this difficulty
//     const opponents = await prisma.opponent.findMany({
//       where: { difficulty },
//       orderBy: { element: "asc" },
//     });

//     // Get user's progress for this difficulty (to check unlocked opponents)
//     let userProgress = null;
//     if (user) {
//       userProgress = await prisma.pveProgress.findFirst({
//         where: {
//           userId: user.id,
//           difficulty,
//         },
//       });
//     }

//     // Transform opponents with unlock status
//     const opponentsWithUnlockStatus: OpponentResponse[] = opponents.map(
//       (opponent) => {
//         let isUnlocked = opponent.unlocked; // Default from database

//         // If user has progress, check if this opponent is specifically unlocked
//         if (userProgress) {
//           const unlockedIds = Array.isArray(userProgress.unlockedIds)
//             ? userProgress.unlockedIds
//             : JSON.parse((userProgress.unlockedIds as string) || "[]");

//           // If opponent ID is in unlocked list, it's unlocked
//           if (unlockedIds.includes(opponent.id)) {
//             isUnlocked = true;
//           }
//         }

//         return {
//           id: opponent.id,
//           name: opponent.name,
//           element: opponent.element,
//           difficulty: opponent.difficulty,
//           portraitUrl: opponent.portraitUrl,
//           intro: opponent.intro,
//           rewardCoins: opponent.rewardCoins,
//           isUnlocked,
//         };
//       }
//     );

//     console.log(
//       `Returning ${opponentsWithUnlockStatus.length} opponents for ${difficulty}`
//     );
//     return NextResponse.json(opponentsWithUnlockStatus);
//   } catch (error) {
//     console.error("GET /api/pve/opponents error:", error);
//     return NextResponse.json(
//       {
//         error: "Server error",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }
