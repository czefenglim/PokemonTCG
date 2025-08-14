import { Server } from "socket.io";
import { createServer } from "http";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch"; // Add this import
import pokemonList from "./src/lib/pokemon-list.json" assert { type: "json" };

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

// Room timer functions
async function startRoomTimer(roomId) {
  const roomData = activeRooms.get(roomId);
  if (!roomData) return;

  roomData.timer = 60; // 60 seconds for deck selection
  roomData.timerActive = true;

  roomData.timerInterval = setInterval(async () => {
    if (roomData.timer <= 0) {
      clearInterval(roomData.timerInterval);
      roomData.timerActive = false;

      io.to(roomId).emit("TIMER_END");

      // Auto-pick and confirm decks for players who haven't done so
      for (const [userId, player] of roomData.players.entries()) {
        const hasPickedDeck = roomData.selectedDecks?.[userId];

        // Auto-pick deck if not selected
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

        // Auto-confirm deck if not confirmed
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

      // Start battle after timer ends
      await checkAndStartBattle(roomId);
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

// ✅ FIXED: Updated main battle start function to use coin flip
async function checkAndStartBattle(roomId) {
  const roomData = activeRooms.get(roomId);
  if (!roomData) return;

  const allConfirmed = Array.from(roomData.players.values()).every(
    (p) => p.confirmed
  );

  if (roomData.playerCount === 2 && allConfirmed) {
    clearRoomTimer(roomId);

    try {
      const roomRecord = await prisma.room.findUnique({
        where: { id: roomId },
      });

      const player1Data = await prisma.user.findUnique({
        where: { id: roomRecord.player1Id },
      });

      const player2Data = await prisma.user.findUnique({
        where: { id: roomRecord.player2Id },
      });

      // Load actual deck data for both players
      const player1Deck = await loadPlayerDeck(
        roomRecord.player1Id,
        roomRecord.player1DeckId
      );
      const player2Deck = await loadPlayerDeck(
        roomRecord.player2Id,
        roomRecord.player2DeckId
      );

      // ✅ FIXED: Use initializeBattleWithCoinFlip instead of creating battle directly
      const player1 = {
        id: roomRecord.player1Id,
        name: player1Data?.username || "Player 1",
        avatar: roomRecord.player1Avatar,
        deckId: roomRecord.player1DeckId,
        deck: player1Deck,
      };

      const player2 = {
        id: roomRecord.player2Id,
        name: player2Data?.username || "Player 2",
        avatar: roomRecord.player2Avatar,
        deckId: roomRecord.player2DeckId,
        deck: player2Deck,
      };

      // Initialize battle with coin flip phase
      initializeBattleWithCoinFlip(roomId, player1, player2);
    } catch (error) {
      console.error("Error starting battle:", error);
    }
  }
}

// Helper function to load and process deck data using the API
async function loadPlayerDeck(userId, deckId) {
  try {
    console.log(`Loading deck for user ${userId}, deckId: ${deckId}`);

    // Use the same API endpoint that the frontend uses
    const response = await fetch(`http://localhost:3000/api/battle/use-deck`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ deckId }),
    });

    const deckData = await response.json();

    // Convert deck cards to battle format using the same logic as frontend
    const battleCards = deckData.cards
      .slice(0, 15)
      .map((cardSelection, index) => {
        const pokemonData = pokemonList.find(
          (p) => p.tokenId === Number(cardSelection.tokenId)
        );

        return {
          tokenId:
            pokemonData?.tokenId ?? cardSelection.tokenId ?? 1000 + index,
          tcgId:
            pokemonData?.tcgId ??
            `card-${cardSelection.tokenId || index}-${userId}`,
          name: pokemonData?.name ?? `Pokemon ${index + 1}`,
          imageUrl:
            pokemonData?.largeImage ||
            pokemonData?.image ||
            "https://images.pokemontcg.io/base1/4.png",
          maxHp: Number(pokemonData?.hp ?? 100),
          hp: Number(pokemonData?.hp ?? 100),
          attacks: pokemonData?.attacks ?? [
            { name: "Tackle", damage: 20, cost: [] },
            { name: "Scratch", damage: 30, cost: [] },
          ],
          type: pokemonData?.type ?? "Normal",
          rarity: pokemonData?.rarity ?? "Common",
          owner: userId,
        };
      });
    return shuffleArray(battleCards);
  } catch (error) {
    console.error(`❌ Error loading deck via API for user ${userId}:`, error);
    // Return fallback deck if API fails
    return [];
  }
}

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ✅ FIXED: Updated coin flip function to use correct userId from socket
function handleCoinFlipComplete(socket, data) {
  const { roomId } = data;
  const roomData = activeRooms.get(roomId);

  if (!roomData || !roomData.battleState) {
    console.log(`❌ No room data found for room ${roomId}`);
    return;
  }

  // Track which players are ready
  if (!roomData.playersReady) {
    roomData.playersReady = new Set();
  }

  // ✅ FIXED: Get userId from socket.data.playerId (set during joinRoom)
  const playerId = socket.data.playerId;

  if (!playerId) {
    console.error(`❌ No playerId found in socket data for room ${roomId}`);
    return;
  }

  roomData.playersReady.add(playerId);

  console.log(
    `✅ Player ${playerId} is ready in room ${roomId}. ${roomData.playersReady.size}/2 ready.`
  );

  // Only start battle when BOTH players are ready
  if (roomData.playersReady.size === 2) {
    // Update game phase to playing
    roomData.battleState.gamePhase = "playing";

    // Clear the ready tracking
    delete roomData.playersReady;

    // Notify all players that the actual battle begins
    io.to(roomId).emit("BATTLE_PHASE_UPDATE", {
      gamePhase: "playing",
      battleState: roomData.battleState,
    });

    console.log(
      `🎮 Both players ready! Battle phase starting in room ${roomId}.`
    );
  } else {
    // Notify this player they're waiting for opponent
    socket.emit("WAITING_FOR_OPPONENT", {
      message: "Waiting for opponent to enter battle...",
    });

    console.log(`⏳ Player ${playerId} waiting for opponent in room ${roomId}`);
  }
}

// ✅ FIXED: Enhanced battle initialization with coin flip phase
function initializeBattleWithCoinFlip(roomId, player1, player2) {
  // Randomly determine who goes first
  const players = [player1, player2];
  const firstPlayerIndex = Math.floor(Math.random() * 2);
  const firstPlayerId = players[firstPlayerIndex].id;

  console.log(`🪙 Coin flip result: Player ${firstPlayerId} goes first`);

  // Create initial battle state with coin flip phase
  const battleState = {
    roomId: roomId,
    currentTurnPlayerId: firstPlayerId,
    turnNumber: 1,
    gamePhase: "coin_flip", // ✅ Start with coin flip phase
    lastAction: null,
    players: {
      [player1.id]: {
        id: player1.id,
        name: player1.name,
        avatar: player1.avatar,
        deckId: player1.deckId,
        active: null,
        hand: player1.deck.slice(0, 3), // Initial hand
        deck: player1.deck.slice(3), // Remaining deck
        bench: [null, null, null], // 5 bench slots
        energy: 0,
        attachedEnergies: {},
      },
      [player2.id]: {
        id: player2.id,
        name: player2.name,
        avatar: player2.avatar,
        deckId: player2.deckId,
        active: null,
        hand: player2.deck.slice(0, 3),
        deck: player2.deck.slice(3),
        bench: [null, null, null],
        energy: 0,
        attachedEnergies: {},
      },
    },
    knockouts: {
      [player1.id]: 0,
      [player2.id]: 0,
    },
  };

  // Store the battle state
  const roomData = activeRooms.get(roomId);
  roomData.battleState = battleState;

  // ✅ Emit battle start with coin flip phase
  io.to(roomId).emit("BATTLE_START", battleState);

  console.log(`🎮 Battle initialized with coin flip for room ${roomId}`);
  console.log(`👤 Players: ${player1.name} vs ${player2.name}`);
  console.log(`🏁 First turn: ${firstPlayerId}`);

  return battleState;
}

// Battle action handlers
function handlePlayerAction(roomId, playerId, action) {
  const roomData = activeRooms.get(roomId);
  if (!roomData || !roomData.battleState) return false;

  const battleState = roomData.battleState;

  if (battleState.gamePhase === "coin_flip") {
    return false;
  }

  if (battleState.currentTurnPlayerId !== playerId) {
    return false;
  }

  switch (action.type) {
    case "PLAY_CARD":
      return handlePlayCard(roomData, playerId, action);
    case "ATTACK":
      return handleAttack(roomData, playerId, action, roomId);
    case "ATTACH_ENERGY":
      return handleAttachEnergy(roomData, playerId, action);
    case "SWITCH_ACTIVE":
      return handleSwitchActive(roomData, playerId, action);
    case "RETREAT":
      return handleRetreat(roomData, playerId, action);
    case "END_TURN":
      return handleEndTurn(roomData, playerId, action);
    case "SURRENDER":
      return handleSurrender(roomData, playerId, action);
    default:
      return false;
  }
}

function handleRetreat(roomData, playerId, action) {
  const battleState = roomData.battleState;
  const player = battleState.players[playerId];
  const { targetBenchIndex } = action.data;

  // Check if player has an active pokemon
  if (!player.active) return false;

  // Check if target bench slot has a pokemon
  if (!player.bench[targetBenchIndex]) return false;

  // Calculate retreat cost based on HP
  const currentHp = player.active.currentHp || player.active.hp;
  let retreatCost = 1; // 0-99 HP
  if (currentHp >= 200) {
    retreatCost = 3;
  } else if (currentHp >= 100) {
    retreatCost = 2;
  }

  // Check if player has enough attached energies on active pokemon
  const attachedEnergies = player.attachedEnergies[player.active.tcgId] || [];
  if (attachedEnergies.length < retreatCost) return false;

  // Remove retreat cost energies from active pokemon
  const energiesToRemove = attachedEnergies.splice(0, retreatCost);

  // Add removed energies to discard pile
  if (!player.discard) player.discard = [];
  player.discard.push(...energiesToRemove);

  // Switch active pokemon with bench pokemon
  const oldActive = player.active;
  const newActive = player.bench[targetBenchIndex];

  player.active = newActive;
  player.bench[targetBenchIndex] = oldActive;

  // Update last action
  battleState.lastAction = {
    type: "RETREAT",
    playerId,
    retreatCost,
    targetBenchIndex,
    timestamp: Date.now(),
  };

  return true;
}

function handlePlayCard(roomData, playerId, action) {
  const battleState = roomData.battleState;
  const player = battleState.players[playerId];

  const { cardIndex, targetSlot } = action.data;

  if (!player.hand[cardIndex]) return false;

  const card = player.hand[cardIndex];

  // Remove card from hand
  player.hand.splice(cardIndex, 1);

  if (targetSlot === "active") {
    // Move current active to bench if exists
    if (player.active) {
      const emptyBenchSlot = player.bench.findIndex((slot) => slot === null);
      if (emptyBenchSlot !== -1) {
        player.bench[emptyBenchSlot] = player.active;
      } else {
        // No space on bench, return card to hand
        player.hand.push(card);
        return false;
      }
    }
    player.active = card;
  } else if (
    typeof targetSlot === "number" &&
    targetSlot >= 0 &&
    targetSlot < 5
  ) {
    if (player.bench[targetSlot] === null) {
      player.bench[targetSlot] = card;
    } else {
      // Slot occupied, return card to hand
      player.hand.push(card);
      return false;
    }
  }

  battleState.lastAction = {
    type: "PLAY_CARD",
    playerId,
    card: card.name,
    targetSlot,
    timestamp: Date.now(),
  };

  return true;
}

function isEnoughEnergy(attachedEnergies, attackCost, pokemonType) {
  const energiesCopy = [...attachedEnergies];

  for (const costType of attackCost) {
    if (costType === "Colorless") {
      // Use any energy
      if (energiesCopy.length === 0) return false;
    } else if (costType === pokemonType) {
      const index = energiesCopy.findIndex((e) => e.type === pokemonType);
      if (index === -1) return false;
    } else {
      const index = energiesCopy.findIndex((e) => e.type === costType);
      if (index === -1) return false;
    }
  }

  return true;
}

function handleAttack(roomData, playerId, action, roomId) {
  const battleState = roomData.battleState;
  const player = battleState.players[playerId];
  const opponentId = Object.keys(battleState.players).find(
    (id) => id !== playerId
  );
  const opponent = battleState.players[opponentId];

  const { attackIndex } = action.data;

  if (!player.active || !opponent.active) return false;

  const attack = player.active.attacks?.[attackIndex];
  if (!attack) return false;

  const attackCost = attack.cost || [];
  const attachedEnergies = player.attachedEnergies[player.active.tcgId] || [];
  const pokemonType = player.active.type;

  // Check and consume energy properly
  const enoughEnergy = isEnoughEnergy(
    attachedEnergies,
    attackCost,
    pokemonType
  );
  if (!enoughEnergy) return "Less Energy";

  // Calculate damage
  const damage = attack.damage || 0;
  opponent.active.hp = Math.max(0, opponent.active.hp - damage);

  // damage done effect
  io.to(roomId).emit("DAMAGE_EFFECT", {
    targetPlayerId: opponentId, // the player who just got damaged
  });

  battleState.lastAction = {
    type: "ATTACK",
    playerId,
    attackName: attack.name,
    damage,
    targetPlayerId: opponentId,
    timestamp: Date.now(),
  };

  // Check knockout and game over logic ...
  if (opponent.active.hp <= 0) {
    opponent.active = null;

    // Increment knockout count for the opponent
    if (!battleState.knockouts) {
      battleState.knockouts = {};
    }
    if (!battleState.knockouts[opponentId]) {
      battleState.knockouts[opponentId] = 0;
    }

    battleState.knockouts[opponentId] += 1;
    // Check if opponent has any alive pokemon on bench
    const hasAlivePokemon = opponent.bench.some((card) => card && card.hp > 0);

    // End game if opponent knocked out 3 pokemon or no alive pokemon left
    if (battleState.knockouts[opponentId] >= 3 || !hasAlivePokemon) {
      battleState.gamePhase = "finished";
      battleState.winner = playerId;
      battleState.lastAction.gameOver = true;
    }
  }

  return true;
}

function handleAttachEnergy(roomData, playerId, action) {
  const battleState = roomData.battleState;
  const player = battleState.players[playerId];

  const { energyType, targetCardId } = action.data;

  // Find target card (active or bench)
  let targetCard = null;
  if (player.active?.tcgId === targetCardId) {
    targetCard = player.active;
  } else {
    targetCard = player.bench.find((card) => card?.tcgId === targetCardId);
  }

  if (!targetCard) return false;

  // Allow attaching if energy matches pokemon type OR is Colorless
  if (energyType !== targetCard.type && energyType !== "Colorless") {
    return false;
  }

  // Initialize energy array if not exists
  if (!player.attachedEnergies[targetCardId]) {
    player.attachedEnergies[targetCardId] = [];
  }

  // Add energy (one per turn limit could be enforced here)
  player.attachedEnergies[targetCardId].push({
    type: energyType,
    id: Date.now().toString(),
  });

  battleState.lastAction = {
    type: "ATTACH_ENERGY",
    playerId,
    energyType,
    targetCardId,
    timestamp: Date.now(),
  };

  return true;
}

function handleSwitchActive(roomData, playerId, action) {
  const battleState = roomData.battleState;
  const player = battleState.players[playerId];

  const { benchIndex } = action.data;

  if (!player.bench[benchIndex]) return false;

  // Swap active with bench
  const newActive = player.bench[benchIndex];
  player.bench[benchIndex] = player.active;
  player.active = newActive;

  battleState.lastAction = {
    type: "SWITCH_ACTIVE",
    playerId,
    newActiveName: newActive.name,
    timestamp: Date.now(),
  };

  return true;
}

function handleEndTurn(roomData, playerId, action) {
  const battleState = roomData.battleState;

  // Switch turns
  const opponentId = Object.keys(battleState.players).find(
    (id) => id !== playerId
  );
  battleState.currentTurnPlayerId = opponentId;
  battleState.turnNumber += 1;

  // Draw card for next player only every 3 turns
  const nextPlayer = battleState.players[opponentId];
  if (battleState.turnNumber % 3 === 0) {
    if (nextPlayer.deck.length > 0) {
      const drawnCard = nextPlayer.deck.pop();
      nextPlayer.hand.push(drawnCard);
    }
  }

  // Add energy for next turn (you can keep this or adjust as needed)
  nextPlayer.energy += 1;

  battleState.lastAction = {
    type: "END_TURN",
    playerId,
    nextPlayerId: opponentId,
    turnNumber: battleState.turnNumber,
    timestamp: Date.now(),
  };

  return true;
}

function handleSurrender(roomData, playerId, action) {
  const battleState = roomData.battleState;
  const opponentId = Object.keys(battleState.players).find(
    (id) => id !== playerId
  );

  battleState.gamePhase = "finished";
  battleState.winner = opponentId;
  battleState.lastAction = {
    type: "SURRENDER",
    playerId,
    winnerId: opponentId,
    timestamp: Date.now(),
  };

  return true;
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("✅ WebSocket connected:", socket.id);

  // Handle disconnection
  socket.on("disconnect", async () => {
    console.log("❌ Disconnected:", socket.id);

    for (const [roomId, roomData] of activeRooms.entries()) {
      for (const [userId, player] of roomData.players.entries()) {
        if (player.socketId === socket.id) {
          roomData.players.delete(userId);
          roomData.playerCount = roomData.players.size;

          io.to(roomId).emit("PLAYER_DISCONNECTED", { playerId: userId });

          // If in battle, handle disconnection
          if (
            roomData.battleState &&
            roomData.battleState.gamePhase === "playing"
          ) {
            const opponentId = Object.keys(roomData.battleState.players).find(
              (id) => id !== userId
            );
            if (opponentId) {
              roomData.battleState.gamePhase = "finished";
              roomData.battleState.winner = opponentId;
              io.to(roomId).emit("BATTLE_STATE_UPDATE", roomData.battleState);
            }
          }

          // Clean up room if empty
          if (roomData.playerCount === 0) {
            clearRoomTimer(roomId);
            activeRooms.delete(roomId);
            console.log(`🧹 Cleaned up room ${roomId}`);
          }
          break;
        }
      }
    }
  });

  // Handle joining room
  socket.on("joinRoom", async ({ roomId, player }) => {
    const userId = player.id;

    // ✅ FIXED: Store userId in socket.data for later use
    socket.data.playerId = userId;

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
          selectedDecks: {},
          battleState: null,
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

      // Prepare room state
      const roomStatePayload = {
        id: room.id,
        name: room.name,
        status: room.isFinished ? "finished" : "waiting",
        timer: roomData.timer,
        timerActive: roomData.timerActive,
        player1: room.player1Id
          ? {
              id: room.player1Id,
              name: player1Data?.username || "Player 1",
              avatar: room.player1Avatar || DEFAULT_AVATAR,
              confirmed: room.player1Ready || false,
              deckId: room.player1DeckId,
              present: roomData.players.has(room.player1Id),
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
            }
          : null,
      };

      // Broadcast to all clients in room
      io.to(roomId).emit("ROOM_STATE_UPDATE", roomStatePayload);
      socket.emit("ROOM_STATE_SYNC", roomStatePayload);

      // If battle is in progress, send battle state
      if (roomData.battleState) {
        socket.emit("BATTLE_STATE_UPDATE", roomData.battleState);
      }

      // Start timer when both players are present
      if (
        room.player1Id &&
        room.player2Id &&
        roomData.players.has(room.player1Id) &&
        roomData.players.has(room.player2Id) &&
        !roomData.timerActive &&
        !roomData.battleState
      ) {
        startRoomTimer(roomId);
      }
    } catch (err) {
      console.error("🚨 Join error:", err);
      socket.emit("error", "Failed to join room");
    }
  });

  // Handle timer sync request
  socket.on("REQUEST_TIMER", ({ roomId }) => {
    if (!activeRooms.has(roomId)) return;

    const roomData = activeRooms.get(roomId);
    socket.emit("TIMER_SYNC", {
      timer: roomData.timer,
      timerActive: roomData.timerActive,
    });
  });

  // Handle deck selection
  socket.on("SELECT_DECK", async ({ roomId, playerId, deckId, deckName }) => {
    if (!activeRooms.has(roomId)) return;

    const roomData = activeRooms.get(roomId);
    const player = roomData.players.get(playerId);
    if (player) {
      player.deckId = deckId;
    }

    // Store selected deck
    if (!roomData.selectedDecks) roomData.selectedDecks = {};

    try {
      const selectedDeck = await prisma.deck.findUnique({
        where: { id: deckId },
        include: { cards: true },
      });

      if (selectedDeck) {
        roomData.selectedDecks[playerId] = selectedDeck;
      }
    } catch (error) {
      console.error("Error fetching selected deck:", error);
    }

    io.to(roomId).emit("DECK_SELECTED", {
      playerId,
      deckId,
      deckName,
    });
  });

  // Handle deck confirmation
  socket.on("CONFIRM_DECK", async ({ roomId, playerId, deckId, cards }) => {
    if (!activeRooms.has(roomId)) return;

    try {
      const roomData = activeRooms.get(roomId);
      const player = roomData.players.get(playerId);
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

      // Check if all players are confirmed and start battle
      await checkAndStartBattle(roomId);
    } catch (err) {
      console.error("🚨 Confirm deck error:", err);
    }
  });

  // ✅ FIXED: Coin flip completion handler
  socket.on("COIN_FLIP_COMPLETE", (data) => {
    console.log(
      "🪙 Received COIN_FLIP_COMPLETE from client:",
      socket.data.playerId
    );
    handleCoinFlipComplete(socket, data);
  });

  // Handle battle actions
  socket.on("BATTLE_ACTION", ({ roomId, playerId, action }) => {
    const success = handlePlayerAction(roomId, playerId, action);

    if (success) {
      const roomData = activeRooms.get(roomId);
      if (roomData && roomData.battleState) {
        // Broadcast updated battle state to all players
        io.to(roomId).emit("BATTLE_STATE_UPDATE", roomData.battleState);

        // Check for game over
        if (roomData.battleState.gamePhase === "finished") {
          io.to(roomId).emit("BATTLE_COMPLETED", {
            winner: roomData.battleState.winner,
            battleState: roomData.battleState,
          });
        }
      }
    } else {
      // Send error back to the player
      socket.emit("BATTLE_ACTION_ERROR", {
        action,
        error: "Invalid action",
      });
    }
  });

  // Handle battle completion
  socket.on(
    "BATTLE_COMPLETED",
    async ({ roomId, winnerId, loserId, battleData }) => {
      try {
        console.log("🏆 Battle completed:", { roomId, winnerId, loserId });

        const roomData = activeRooms.get(roomId);
        if (!roomData) return;

        // Update room status in database
        await prisma.room.update({
          where: { id: roomId },
          data: {
            isFinished: true,
            winnerId: winnerId,
          },
        });

        // Prepare battle result
        const battleResult = {
          winnerId,
          loserId,
          message: `Battle completed! Winner: ${winnerId}`,
          battleData,
        };

        // Broadcast result to all players in room
        io.to(roomId).emit("BATTLE_RESULT", battleResult);

        // Clean up room after battle
        setTimeout(() => {
          clearRoomTimer(roomId);
          activeRooms.delete(roomId);
          console.log(`🧹 Cleaned up completed battle room ${roomId}`);
        }, 30000); // Clean up after 30 seconds
      } catch (error) {
        console.error("Error handling battle completion:", error);
      }
    }
  );

  // Handle room state requests
  socket.on("REQUEST_ROOM_STATE", async ({ roomId }) => {
    try {
      const roomData = activeRooms.get(roomId);
      if (!roomData) return;

      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) return;

      const player1Data = room.player1Id
        ? await prisma.user.findUnique({ where: { id: room.player1Id } })
        : null;
      const player2Data = room.player2Id
        ? await prisma.user.findUnique({ where: { id: room.player2Id } })
        : null;

      const response = {
        id: roomId,
        name: room.name || "Battle Room",
        status: room.isFinished ? "finished" : "waiting",
        timer: roomData.timer,
        timerActive: roomData.timerActive,
        player1: room.player1Id
          ? {
              id: room.player1Id,
              name: player1Data?.username || "Player 1",
              avatar: room.player1Avatar || DEFAULT_AVATAR,
              confirmed: room.player1Ready || false,
              deckId: room.player1DeckId,
              present: roomData.players.has(room.player1Id),
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
            }
          : null,
      };

      socket.emit("ROOM_STATE_UPDATE", response);
    } catch (error) {
      console.error("Error fetching room state:", error);
      socket.emit("error", "Failed to get room state");
    }
  });

  // Handle battle data requests for fight page
  socket.on("REQUEST_BATTLE_DATA", ({ roomId }) => {
    console.log(`🔍 Battle data requested for room ${roomId}`);
    const roomData = activeRooms.get(roomId);
    if (roomData && roomData.battleState) {
      socket.emit("BATTLE_START", roomData.battleState);
    } else {
      console.log(`❌ No battle state found for room ${roomId}`);
    }
  });
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
