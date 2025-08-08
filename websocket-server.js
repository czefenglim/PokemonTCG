import { Server } from "socket.io";
import { createServer } from "http";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORT = 4000;
const DEFAULT_AVATAR =
  "https://www.freeiconspng.com/thumbs/pokeball-png/file-pokeball-png-0.png";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});

const activeRooms = new Map();
const battleWagers = new Map();

// Update room with wager card information
async function updateRoomWagerCards(roomId, player1Card, player2Card) {
  try {
    const updateData = {
      wagerCardId1: player1Card?.tokenId?.toString(),
      wagerCardId2: player2Card?.tokenId?.toString(),
      wagerRarity: player1Card?.rarity || player2Card?.rarity,
    };

    // Only update fields that have values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    await prisma.room.update({
      where: { id: roomId },
      data: filteredData,
    });

    console.log(`💾 Updated wager cards for room ${roomId}`);
  } catch (error) {
    console.error("Failed to update room wager cards:", error);
  }
}
// battle/room/[id] functions ///////////////////////////////////////////////////////////////////////////////////////////////
// room timer
async function startRoomTimer(roomId) {
  const roomData = activeRooms.get(roomId);

  roomData.timer = 5;
  roomData.timerActive = true;

  roomData.timerInterval = setInterval(async () => {
    if (roomData.timer <= 0) {
      clearInterval(roomData.timerInterval);
      roomData.timerActive = false;

      io.to(roomId).emit("TIMER_END");

      for (const [userId, player] of roomData.players.entries()) {
        const hasPickedDeck = roomData.selectedDecks?.[userId];

        // 🔁 Auto-pick deck if not selected
        if (!hasPickedDeck) {
          try {
            const userDecks = await prisma.deck.findMany({
              where: { userId },
              include: { cards: true },
            });

            if (userDecks.length > 0) {
              const randomDeck =
                userDecks[Math.floor(Math.random() * userDecks.length)];
              if (!roomData.selectedDecks) roomData.selectedDecks = {};
              roomData.selectedDecks[userId] = randomDeck;
              io.to(player.socketId).emit("AUTO_PICK_DECK", randomDeck);
            } else {
              console.warn(
                `⚠️ No decks found for ${userId}, skipping auto-pick.`
              );
            }
          } catch (err) {
            console.error(`❌ Failed to auto-pick deck for ${userId}:`, err);
          }
        }

        // ✅ Auto-confirm deck if not confirmed
        if (!player.confirmed) {
          player.confirmed = true;

          const selectedDeck = roomData.selectedDecks?.[userId];
          if (selectedDeck) {
            player.deckId = selectedDeck.id;
            player.cards = selectedDeck.cards;
          }

          const roomRecord = await prisma.room.findUnique({
            where: { id: roomId },
          });

          const updateData = {};
          if (roomRecord.player1Id === userId) {
            updateData.player1Ready = true;
            updateData.player1DeckId = selectedDeck?.id;
          } else if (roomRecord.player2Id === userId) {
            updateData.player2Ready = true;
            updateData.player2DeckId = selectedDeck?.id;
          }

          await prisma.room.update({
            where: { id: roomId },
            data: updateData,
          });

          io.to(roomId).emit("PLAYER_CONFIRMED", {
            playerId: userId,
            deckId: selectedDeck?.id,
          });
        }
      }

      io.to(roomId).emit("BATTLE_START");
    } else {
      roomData.timer -= 1;
      io.to(roomId).emit("TIMER_TICK", roomData.timer);
    }
  }, 1000);
}

function clearRoomTimer(roomId) {
  const roomData = activeRooms.get(roomId);
  if (!roomData) return;

  if (roomData.timerInterval) {
    clearInterval(roomData.timerInterval);
    roomData.timerInterval = null;
  }
  roomData.timerActive = false;
}

io.on("connection", (socket) => {
  console.log("✅ WebSocket connected:", socket.id);

  // battle/room/[id] socket/////////////////////////////////////////////////////////////////////////////////////////////
  socket.on("joinRoom", async ({ roomId, player }) => {
    const userId = player.id;

    try {
      // Leave previous rooms
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.leave(room);
      });

      socket.join(roomId);

      // Check if room exists in database
      let room = await prisma.room.findUnique({ where: { id: roomId } });

      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      // Initialize activeRooms if not exists
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          players: new Map(),
          playerCount: 0,
          timer: 60,
          timerActive: false,
          timerInterval: null,
          wagerTriggered: false,
          wagerData: null,
        });
      }

      const roomData = activeRooms.get(roomId);

      // Update player data
      if (roomData.players.has(userId)) {
        const existingPlayer = roomData.players.get(userId);
        roomData.players.set(userId, {
          ...existingPlayer,
          socketId: socket.id,
          avatar: player.avatar,
          deckChoices: player.deckChoices || existingPlayer.deckChoices || [],
          walletAddress: player.walletAddress || null,
        });

        // Update avatar in database
        const updateData = {};
        if (room.player1Id === userId) {
          updateData.player1Avatar = player.avatar;
        } else if (room.player2Id === userId) {
          updateData.player2Avatar = player.avatar;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.room.update({
            where: { id: roomId },
            data: updateData,
          });
        }
      } else {
        // Add new player
        roomData.players.set(userId, {
          socketId: socket.id,
          userId,
          confirmed: false,
          avatar: player.avatar,
          deckChoices: player.deckChoices || [],
          walletAddress: player.walletAddress || null,
        });

        roomData.playerCount = roomData.players.size;

        // Update database with player assignment
        const updateData = { players: roomData.playerCount };

        if (!room.player1Id) {
          updateData.player1Id = userId;
          updateData.player1Avatar = player.avatar;
        } else if (!room.player2Id && room.player1Id !== userId) {
          updateData.player2Id = userId;
          updateData.player2Avatar = player.avatar;
        } else if (room.player1Id === userId) {
          updateData.player1Avatar = player.avatar;
        } else if (room.player2Id === userId) {
          updateData.player2Avatar = player.avatar;
        }

        await prisma.room.update({
          where: { id: roomId },
          data: updateData,
        });
      }

      // Fetch fresh room data
      room = await prisma.room.findUnique({ where: { id: roomId } });

      const player1Data = room.player1Id
        ? await prisma.user.findUnique({ where: { id: room.player1Id } })
        : null;
      const player2Data = room.player2Id
        ? await prisma.user.findUnique({ where: { id: room.player2Id } })
        : null;

      const roomStatePayload = {
        id: room.id,
        name: room.name,
        status: room.isFinished ? "finished" : "waiting",
        timer: roomData.timer,
        timerActive: roomData.timerActive,
        wagerLocked: roomData.wagerData !== null,
        wagerCardId1: room.wagerCardId1,
        wagerCardId2: room.wagerCardId2,
        wagerRarity: room.wagerRarity,
        player1: room.player1Id
          ? {
              id: room.player1Id,
              name: player1Data?.username || "Player 1",
              avatar: room.player1Avatar || DEFAULT_AVATAR,
              confirmed: room.player1Ready || false,
              deckId: room.player1DeckId,
              present: roomData.players.has(room.player1Id),
              walletAddress:
                roomData.players.get(room.player1Id)?.walletAddress || null, // ✅ Use this
            }
          : null,
        player2: room.player2Id
          ? {
              id: room.player2Id,
              name: player2Data?.username || "Player 2",
              avatar: room.player2Avatar || DEFAULT_AVATAR,
              confirmed: room.player2Ready || false,
              deckId: room.player2DeckId,
              present: roomData.players.has(room.player2Id),
              walletAddress:
                roomData.players.get(room.player2Id)?.walletAddress || null,
            }
          : null,
      };

      // Broadcast to all clients in room
      io.to(roomId).emit("ROOM_STATE_UPDATE", roomStatePayload);
      socket.emit("ROOM_STATE_SYNC", roomStatePayload);

      // If there's existing wager data, send it to newly joined player
      if (roomData.wagerData) {
        socket.emit("BATTLE_WAGER_EXISTING", roomData.wagerData);
      }

      // Trigger battle wager when both players are present
      if (
        room.player1Id &&
        room.player2Id &&
        roomData.players.has(room.player1Id) &&
        roomData.players.has(room.player2Id) &&
        !roomData.wagerTriggered
      ) {
        roomData.wagerTriggered = true;

        const player1 = roomData.players.get(room.player1Id);
        const player2 = roomData.players.get(room.player2Id);

        const wagerData = {
          roomId,
          player1: {
            id: room.player1Id,
            name: player1Data?.username || "Player 1",
            avatar: room.player1Avatar,
            cards: player1.deckChoices || [],
          },
          player2: {
            id: room.player2Id,
            name: player2Data?.username || "Player 2",
            avatar: room.player2Avatar,
            cards: player2.deckChoices || [],
          },
        };

        battleWagers.set(roomId, wagerData);
        io.to(roomId).emit("BATTLE_WAGER_TRIGGER", wagerData);
      }
    } catch (err) {
      console.error("🚨 Join error:", err);
      socket.emit("error", "Failed to join room");
    }
  });

  socket.on("REQUEST_TIMER", ({ roomId }) => {
    if (!activeRooms.has(roomId)) return;

    const roomData = activeRooms.get(roomId);
    socket.emit("TIMER_SYNC", {
      timer: roomData.timer,
      timerActive: roomData.timerActive,
    });
  });

  socket.on("BATTLE_WAGER_CONFIRMED", async ({ roomId, battleData }) => {
    try {
      const roomData = activeRooms.get(roomId);
      if (!roomData) {
        console.error(`🚫 Room data not found for ${roomId}`);
        return;
      }

      console.log("🔒 Battle wager confirmed:", {
        roomId,
        wagerId: battleData.wagerId,
      });

      // Store the complete battle data
      roomData.wagerData = battleData;

      // Update database with selected cards
      await updateRoomWagerCards(
        roomId,
        battleData.player1Card,
        battleData.player2Card
      );

      // Broadcast confirmation to all clients
      io.to(roomId).emit("WAGER_CARDS_SYNCED", {
        roomId,
        player1Card: battleData.player1Card,
        player2Card: battleData.player2Card,
        wagerId: battleData.wagerId,
      });

      // Send the complete confirmation
      io.to(roomId).emit("BATTLE_WAGER_LOCKED", {
        battleData,
        message: "Cards locked! Select your decks to begin battle.",
      });

      // Start timer AFTER all the wager processing is complete
      startRoomTimer(roomId);
    } catch (error) {
      console.error("Wager confirmation error:", error);
      socket.emit("error", "Failed to confirm wager");
    }
  });

  socket.on("VERIFY_WAGER_CONTRACT", async ({ roomId, wagerId }) => {
    try {
      if (!wagerContract) {
        throw new Error("Wager contract not available");
      }

      console.log("🔍 Verifying wager contract for wagerId:", wagerId);

      const wagerData = await wagerContract.wagers(wagerId);

      if (wagerData.player1 === ethers.ZeroAddress) {
        throw new Error("Invalid wager data");
      }

      io.to(roomId).emit("WAGER_CONTRACT_VERIFIED", {
        roomId,
        wagerId,
        isValid: true,
        player1: wagerData.player1,
        player2: wagerData.player2,
        player1TokenId: Number(wagerData.player1TokenId),
        player2TokenId: Number(wagerData.player2TokenId),
        isActive: wagerData.isActive,
      });
    } catch (error) {
      console.error("Wager verification failed:", error);
      io.to(roomId).emit("WAGER_CONTRACT_VERIFIED", {
        roomId,
        wagerId,
        isValid: false,
        error: error.message,
      });
    }
  });

  socket.on("SELECT_DECK", (payload) => {
    const { roomId, playerId, deckId, deckName } = payload;
    if (!activeRooms.has(roomId)) return;

    const room = activeRooms.get(roomId);
    const player = room.players.get(playerId);
    if (player) {
      player.deckId = deckId;
    }

    io.to(roomId).emit("DECK_SELECTED", {
      playerId,
      deckId,
      deckName,
    });
  });

  socket.on("CONFIRM_DECK", async (payload) => {
    const { roomId, playerId, deckId, cards } = payload;
    if (!activeRooms.has(roomId)) return;

    try {
      const room = activeRooms.get(roomId);
      const player = room.players.get(playerId);
      if (player) {
        player.confirmed = true;
        player.deckId = deckId;
        player.cards = cards;
      }

      // Update database
      const roomRecord = await prisma.room.findUnique({
        where: { id: roomId },
      });
      const updateData = {};

      if (roomRecord.player1Id === playerId) {
        updateData.player1Ready = true;
        updateData.player1DeckId = deckId;
      } else if (roomRecord.player2Id === playerId) {
        updateData.player2Ready = true;
        updateData.player2DeckId = deckId;
      }

      await prisma.room.update({
        where: { id: roomId },
        data: updateData,
      });

      io.to(roomId).emit("PLAYER_CONFIRMED", {
        playerId,
        deckId,
      });

      const allConfirmed = Array.from(room.players.values()).every(
        (p) => p.confirmed
      );

      if (room.playerCount === 2 && allConfirmed) {
        clearRoomTimer(roomId);

        const roomMeta = await prisma.room.findUnique({
          where: { id: roomId },
        });
        const player1Data = await prisma.user.findUnique({
          where: { id: roomMeta.player1Id },
        });
        const player2Data = await prisma.user.findUnique({
          where: { id: roomMeta.player2Id },
        });

        const battleData = {
          roomId,
          currentTurnPlayerId: roomMeta.player1Id,
          turnNumber: 1,
          battleWager: room.wagerData,
          contractLocked: room.contractLocked,
          wagers: room.wagerData
            ? {
                [roomMeta.player1Id]: room.wagerData.player1Card,
                [roomMeta.player2Id]: room.wagerData.player2Card,
              }
            : {},
          players: {
            [roomMeta.player1Id]: roomMeta.player1DeckId,
            [roomMeta.player2Id]: roomMeta.player2DeckId,
          },
          player1: {
            id: roomMeta.player1Id,
            name: player1Data.name,
            avatar: roomMeta.player1Avatar,
            deck: [],
            hand: [],
            bench: [],
            prizeCards: [],
          },
          player2: {
            id: roomMeta.player2Id,
            name: player2Data.name,
            avatar: roomMeta.player2Avatar,
            deck: [],
            hand: [],
            bench: [],
            prizeCards: [],
          },
        };

        io.to(roomId).emit("battle-data", battleData);
        io.to(roomId).emit("BATTLE_START");
      }
    } catch (err) {
      console.error("🚨 Confirm deck error:", err);
    }
  });

  // Enhance the existing ROOM_STATE_UPDATE handler
  socket.on("REQUEST_ROOM_STATE", async ({ roomId }) => {
    try {
      const roomData = activeRooms.get(roomId);
      if (!roomData) return;

      const room = await prisma.room.findUnique({ where: { id: roomId } });
      const player1Data = room?.player1Id
        ? await prisma.user.findUnique({
            where: { id: room.player1Id },
          })
        : null;
      const player2Data = room?.player2Id
        ? await prisma.user.findUnique({
            where: { id: room.player2Id },
          })
        : null;

      const response = {
        id: roomId,
        name: room?.name || "Battle Room",
        status: room?.isFinished ? "finished" : "waiting",
        timer: roomData.timer,
        timerActive: roomData.timerActive,
        contractLocked: roomData.contractLocked,
        wagerLocked: roomData.wagerData !== null,
        contractAvailable: !!wagerContract,
        wagerCardId1: room?.wagerCardId1,
        wagerCardId2: room?.wagerCardId2,
        wagerRarity: room?.wagerRarity,
        player1: room?.player1Id
          ? {
              id: room.player1Id,
              name: player1Data?.username || "Player 1",
              avatar: room.player1Avatar || DEFAULT_AVATAR,
              confirmed: room.player1Ready || false,
              deckId: room.player1DeckId,
              present: roomData.players.has(room.player1Id),
              walletAddress: player1Data?.walletAddress,
            }
          : null,
        player2: room?.player2Id
          ? {
              id: room.player2Id,
              name: player2Data?.username || "Player 2",
              avatar: room.player2Avatar || DEFAULT_AVATAR,
              confirmed: room.player2Ready || false,
              deckId: room.player2DeckId,
              present: roomData.players.has(room.player2Id),
              walletAddress: player2Data?.walletAddress,
            }
          : null,
      };

      socket.emit("ROOM_STATE_UPDATE", response);
    } catch (error) {
      console.error("Error fetching room state:", error);
      socket.emit("error", "Failed to get room state");
    }
  });

  // BattleWagerCard component
  socket.on(
    "WAGER_CARDS_SELECTED",
    async ({ roomId, player1Card, player2Card, rarity }) => {
      try {
        const roomData = activeRooms.get(roomId);
        if (!roomData) return;

        console.log("🎯 Cards selected for room:", roomId, {
          player1Card: player1Card?.name,
          player2Card: player2Card?.name,
          rarity,
        });

        // Store the selected cards in room data
        roomData.selectedCards = {
          player1Card,
          player2Card,
          rarity,
        };

        // Update database with selected cards
        await updateRoomWagerCards(roomId, player1Card, player2Card);

        // Broadcast to all clients in the room
        io.to(roomId).emit("WAGER_CARDS_SELECTED", {
          roomId,
          player1Card,
          player2Card,
          rarity,
        });
      } catch (error) {
        console.error("Error handling WAGER_CARDS_SELECTED:", error);
        socket.emit("error", "Failed to process card selection");
      }
    }
  );
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // put the socket for fight page below here
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");

  // Clear all timers
  for (const [roomId, roomData] of activeRooms.entries()) {
    clearRoomTimer(roomId);
  }

  // Close database connection
  await prisma.$disconnect();

  // Close server
  httpServer.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket server running at ws://localhost:${PORT}`);
});
