// // components/wager/BattleWagerCard.tsx
// "use client";

// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { ethers } from "ethers";
// import { useAccount } from "wagmi";
// import { useSocket } from "@/../contexts/SocketContext";
// import pokemonList from "@/app/lib/pokemon-list.json";
// import wagerABI from "@/app/lib/pokemonCardWagerABI.json";
// import router from "next/router";

// // Contract addresses
// const POKEMON_CARD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
// const WAGER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WAGER_CONTRACT_ADDRESS!;

// // Standard ERC1155 ABI - just the functions we need
// const ERC1155_ABI = [
//   "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
//   "function balanceOf(address account, uint256 id) view returns (uint256)",
//   "function isApprovedForAll(address account, address operator) view returns (bool)",
//   "function setApprovalForAll(address operator, bool approved)",
// ];

// type OwnedCard = {
//   tokenId: number;
//   tcgId: string;
//   name: string;
//   imageUrl: string;
//   amount: string;
//   rarity: string;
//   type: string;
// };

// type Player = {
//   id: string;
//   name: string;
//   avatar: string;
//   walletAddress?: string;
// };

// type RoomState = {
//   id: string;
//   name: string;
//   status: string;
//   timer: number;
//   timerActive: boolean;
//   contractLocked: boolean;
//   wagerLocked: boolean;
//   contractAvailable: boolean;
//   wagerCardId1?: string;
//   wagerCardId2?: string;
//   wagerRarity?: string;
//   player1: {
//     id: string;
//     name: string;
//     avatar: string;
//     confirmed: boolean;
//     deckId?: string;
//     present: boolean;
//     walletAddress?: string;
//   } | null;
//   player2: {
//     id: string;
//     name: string;
//     avatar: string;
//     confirmed: boolean;
//     deckId?: string;
//     present: boolean;
//     walletAddress?: string;
//   } | null;
// };

// interface RandomCardSelectorProps {
//   isOpen: boolean;
//   onClose: () => void;
//   roomId: string;
//   player1: Player;
//   player2: Player;
//   currentUserId: string;
//   onCardsLocked: (battleData: any) => void;
//   isPlayer1: boolean;
//   initialWagerId?: number;
//   createWager: (
//     player2Address: string,
//     player1TokenIds: number[],
//     player1Amounts: number[],
//     player2TokenIds: number[],
//     player2Amounts: number[]
//   ) => Promise<{
//     success: boolean;
//     wagerId?: number;
//     txHash?: string;
//     error?: string;
//   }>;
//   joinWager: (wagerId: number) => Promise<{
//     success: boolean;
//     txHash?: string;
//     error?: string;
//   }>;
// }

// export default function RandomCardSelector({
//   isOpen,
//   onClose,
//   roomId,
//   player1,
//   player2,
//   onCardsLocked,
//   isPlayer1,
//   createWager,
//   joinWager,
// }: RandomCardSelectorProps) {
//   const [step, setStep] = useState<
//     "loading" | "revealing" | "processing" | "completed" | "error"
//   >("loading");

//   const [selectedCards, setSelectedCards] = useState<{
//     player1Card: OwnedCard | null;
//     player2Card: OwnedCard | null;
//   }>({
//     player1Card: null,
//     player2Card: null,
//   });

//   const [collections, setCollections] = useState<{
//     player1: OwnedCard[];
//     player2: OwnedCard[];
//   }>({
//     player1: [],
//     player2: [],
//   });

//   const [error, setError] = useState<string | null>(null);
//   const [battleData, setBattleData] = useState<any>(null);
//   const [blockchainAvailable, setBlockchainAvailable] = useState(true);
//   const [status, setStatus] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [roomState, setRoomState] = useState<RoomState | null>(null);
//   const [confirmedRarity, setRarity] = useState<string | null | undefined>(
//     null
//   );

//   // Use refs to prevent multiple calls
//   const wagerCreationInProgress = useRef(false);
//   const hasInitialized = useRef(false);

//   // Use wagmi hook for wallet connection
//   const { address: connectedAddress, isConnected } = useAccount();

//   // Use socket context
//   const { socket } = useSocket();

//   // Socket event listeners
//   useEffect(() => {
//     if (!socket) return;

//     const handleRoomStateUpdate = (data: RoomState) => {
//       console.log("📡 Room state updated:", data);
//       socket.emit("WALLET_ADDRESS_UPDATE", data);

//       setRoomState(data);
//       setRarity(data.wagerRarity);
//     };

//     const handleWagerCardsSync = (data: {
//       roomId: string;
//       player1Card: OwnedCard;
//       player2Card: OwnedCard;
//       contractLocked: boolean;
//       wagerId?: number;
//     }) => {
//       console.log("🔄 Wager cards synced:", data);
//       if (data.roomId === roomId) {
//         setSelectedCards({
//           player1Card: data.player1Card,
//           player2Card: data.player2Card,
//         });

//         if (step === "loading") {
//           setStep("revealing");
//         }
//       }
//     };

//     const handleWagerCardsSelected = (data: {
//       roomId: string;
//       player1Card: OwnedCard;
//       player2Card: OwnedCard;
//       rarity: string;
//     }) => {
//       console.log("🎯 Cards selected and synced:", data);
//       if (data.roomId === roomId) {
//         setSelectedCards({
//           player1Card: data.player1Card,
//           player2Card: data.player2Card,
//         });
//         setStep("revealing");
//       }
//     };

//     socket.on("ROOM_STATE_UPDATE", handleRoomStateUpdate);
//     socket.on("WAGER_CARDS_SYNCED", handleWagerCardsSync);
//     socket.on("WAGER_CARDS_SELECTED", handleWagerCardsSelected);

//     return () => {
//       socket.off("ROOM_STATE_UPDATE", handleRoomStateUpdate);
//       socket.off("WAGER_CARDS_SYNCED", handleWagerCardsSync);
//       socket.off("WAGER_CARDS_SELECTED", handleWagerCardsSelected);
//     };
//   }, [socket, roomId, step]);

//   // Safe getter for rarity with fallback
//   const getRarity = (rarity?: string) => {
//     const rawRarity = confirmedRarity || rarity || "common";
//     return rawRarity.replace(/_/g, "");
//   };

//   // Safe rarity gradient with fallbacks
//   const getRarityGradient = (rarity?: any) => {
//     const safeRarity = getRarity();

//     const rarityColors: Record<string, string> = {
//       common: "from-gray-400 to-gray-500",
//       uncommon: "from-green-400 to-green-500",
//       rare: "from-blue-400 to-blue-500",
//       rareholo: "from-blue-500 to-cyan-500",
//       rareultra: "from-purple-400 to-purple-600",
//       promo: "from-yellow-400 to-yellow-500",
//       rarehologx: "from-purple-500 to-pink-500",
//       rarebreak: "from-orange-400 to-red-500",
//       rareholoex: "from-red-500 to-pink-500",
//       rarerainbow: "from-pink-400 via-purple-500 to-blue-500",
//       rareshiny: "from-yellow-300 to-yellow-600",
//       classiccollection: "from-amber-400 to-orange-600",
//       raresecret: "from-gray-600 to-black",
//       doublerare: "from-emerald-400 to-teal-600",
//       illustrationrare: "from-rose-400 to-pink-600",
//     };

//     return rarityColors[safeRarity] || "from-gray-400 to-gray-600";
//   };

//   // Load collection for a specific wallet address
//   const loadCollection = async (userAddress: string): Promise<OwnedCard[]> => {
//     try {
//       if (!window.ethereum) {
//         console.warn("⚠️ MetaMask not available, using demo cards");
//         return [];
//       }

//       const provider = new ethers.BrowserProvider(window.ethereum);

//       if (!POKEMON_CARD_CONTRACT_ADDRESS) {
//         throw new Error("Pokemon Card contract address not configured.");
//       }

//       // Create ERC1155 contract instance using minimal ABI
//       const contract = new ethers.Contract(
//         POKEMON_CARD_CONTRACT_ADDRESS,
//         ERC1155_ABI,
//         provider
//       );

//       // Validate pokemonList exists and has valid data
//       if (
//         !pokemonList ||
//         !Array.isArray(pokemonList) ||
//         pokemonList.length === 0
//       ) {
//         console.warn(
//           "⚠️ Pokemon list not available or empty, using demo cards"
//         );
//         return [];
//       }

//       // Filter valid pokemon data and ensure tokenId is valid
//       const validPokemon = pokemonList.filter(
//         (p) =>
//           p &&
//           typeof p.tokenId === "number" &&
//           p.tokenId >= 0 &&
//           p.name &&
//           p.largeImage
//       );

//       if (validPokemon.length === 0) {
//         console.warn("⚠️ No valid pokemon data found, using demo cards");
//         return [];
//       }

//       // Batch size to prevent "out of result range" errors
//       const BATCH_SIZE = 50;
//       const allOwned: OwnedCard[] = [];

//       for (let i = 0; i < validPokemon.length; i += BATCH_SIZE) {
//         const batch = validPokemon.slice(i, i + BATCH_SIZE);

//         try {
//           const ids = batch.map((p) => BigInt(p.tokenId));
//           const addresses = ids.map(() => userAddress);

//           // Add timeout and retry logic
//           const balances: bigint[] = await Promise.race([
//             contract.balanceOfBatch(addresses, ids),
//             new Promise<never>((_, reject) =>
//               setTimeout(() => reject(new Error("Request timeout")), 10000)
//             ),
//           ]);

//           const batchOwned: OwnedCard[] = balances.flatMap((balance, idx) => {
//             const pokemon = batch[idx];

//             if (!pokemon || !balance || balance <= 0n) {
//               return [];
//             }

//             return [
//               {
//                 tokenId: pokemon.tokenId,
//                 tcgId: pokemon.tcgId || `tcg-${pokemon.tokenId}`,
//                 name: pokemon.name,
//                 imageUrl: pokemon.largeImage,
//                 amount: balance.toString(),
//                 rarity: pokemon.rarity || "Common",
//                 type: pokemon.type || "Unknown",
//               },
//             ];
//           });

//           allOwned.push(...batchOwned);

//           // Small delay between batches to prevent rate limiting
//           if (i + BATCH_SIZE < validPokemon.length) {
//             await new Promise((resolve) => setTimeout(resolve, 100));
//           }
//         } catch (batchError) {
//           console.warn(
//             `⚠️ Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
//             batchError
//           );
//         }
//       }

//       // Filter and validate final results
//       const cleanedOwned = allOwned.filter(
//         (card) =>
//           card &&
//           card.imageUrl &&
//           card.name &&
//           typeof card.tokenId === "number" &&
//           card.amount &&
//           parseInt(card.amount) > 0
//       );

//       return cleanedOwned;
//     } catch (err) {
//       console.error(`❌ Error loading collection for ${userAddress}:`, err);
//       console.log("📦 Falling back to demo cards");
//       return [];
//     }
//   };

//   // Get player wallet addresses with proper fallbacks
//   const getPlayerWallets = () => {
//     const player1Wallet =
//       roomState?.player1?.walletAddress ||
//       (isPlayer1 ? connectedAddress : null);

//     const player2Wallet =
//       roomState?.player2?.walletAddress ||
//       (!isPlayer1 ? connectedAddress : null);

//     return { player1Wallet, player2Wallet };
//   };

//   // Check blockchain connection and availability
//   const checkBlockchainAvailability = async () => {
//     try {
//       if (!window.ethereum) {
//         setBlockchainAvailable(false);
//         return false;
//       }

//       const provider = new ethers.BrowserProvider(window.ethereum);
//       await provider.getNetwork();

//       if (!POKEMON_CARD_CONTRACT_ADDRESS || !WAGER_CONTRACT_ADDRESS) {
//         console.warn("⚠️ Contract addresses not configured");
//         setBlockchainAvailable(false);
//         return false;
//       }

//       setBlockchainAvailable(true);
//       return true;
//     } catch (error) {
//       console.warn("⚠️ Blockchain not available:", error);
//       setBlockchainAvailable(false);
//       return false;
//     }
//   };

//   // Validate token ownership before creating wager
//   const validateTokenOwnership = async (
//     userAddress: string,
//     tokenId: number,
//     provider: ethers.BrowserProvider
//   ): Promise<boolean> => {
//     try {
//       console.log(
//         `🔍 Checking ownership: Address ${userAddress} for token ${tokenId}`
//       );

//       const erc1155Contract = new ethers.Contract(
//         POKEMON_CARD_CONTRACT_ADDRESS,
//         ERC1155_ABI,
//         provider
//       );

//       const balance = await erc1155Contract.balanceOf(
//         userAddress,
//         BigInt(tokenId)
//       );

//       const balanceString = balance.toString();
//       console.log(
//         `👤 ${userAddress} owns ${balanceString} of token ${tokenId}`
//       );

//       return balance > 0n;
//     } catch (error) {
//       console.error("❌ Error checking token ownership:", error);
//       console.error("Token ID:", tokenId);
//       console.error("User Address:", userAddress);
//       console.error("Contract Address:", POKEMON_CARD_CONTRACT_ADDRESS);
//       return false;
//     }
//   };

//   // Auto-process wager when component opens (with protection against multiple calls)
//   useEffect(() => {
//     if (isOpen && confirmedRarity && !hasInitialized.current) {
//       hasInitialized.current = true;
//       checkBlockchainAvailability().then(() => {
//         processAutomaticWager();
//       });
//     }
//   }, [isOpen, confirmedRarity, roomState]);

//   const processAutomaticWager = async () => {
//     if (wagerCreationInProgress.current) {
//       console.log("⚠️ Wager creation already in progress, skipping");
//       return;
//     }

//     setStep("loading");
//     setError(null);
//     setStatus("Loading player collections...");

//     try {
//       const { player1Wallet, player2Wallet } = getPlayerWallets();

//       console.log("🔍 Loading collections for both players...");
//       console.log("🌐 Blockchain available:", blockchainAvailable);
//       console.log("🏠 Player 1 wallet:", player1Wallet);
//       console.log("🏠 Player 2 wallet:", player2Wallet);

//       if (!player1Wallet || !player2Wallet) {
//         throw new Error("Player wallet addresses not available");
//       }

//       setStatus("Fetching card collections...");

//       const [player1Collection, player2Collection] = await Promise.all([
//         loadCollection(player1Wallet),
//         loadCollection(player2Wallet),
//       ]);

//       // Validate collections are not empty
//       if (player1Collection.length === 0 && player2Collection.length === 0) {
//         throw new Error("No cards found for either player");
//       }

//       setCollections({
//         player1: player1Collection,
//         player2: player2Collection,
//       });

//       setStatus("Filtering cards by rarity...");

//       const targetRarity = confirmedRarity?.replace(/_/g, " ") ?? "common";
//       console.log("🗡️ Target rarity in card selection: ", targetRarity);

//       const player1EligibleCards = player1Collection.filter((card) => {
//         if (!card || !card.rarity || !card.amount) return false;
//         const cardRarity = card.rarity.toLowerCase();
//         const hasAmount = parseInt(card.amount) > 0;
//         return cardRarity === targetRarity && hasAmount;
//       });

//       const player2EligibleCards = player2Collection.filter((card) => {
//         if (!card || !card.rarity || !card.amount) return false;
//         const cardRarity = card.rarity.toLowerCase();
//         const hasAmount = parseInt(card.amount) > 0;
//         return cardRarity === targetRarity && hasAmount;
//       });

//       console.log("🎯 Eligible cards - Player 1:", player1EligibleCards.length);
//       console.log("🎯 Eligible cards - Player 2:", player2EligibleCards.length);

//       // Handle case where no eligible cards are found
//       if (
//         player1EligibleCards.length === 0 &&
//         player2EligibleCards.length === 0
//       ) {
//         throw new Error(
//           `No ${targetRarity} rarity cards found for either player. Available rarities: ${[
//             ...new Set([
//               ...player1Collection
//                 .map((c) => c.rarity?.toLowerCase())
//                 .filter(Boolean),
//               ...player2Collection
//                 .map((c) => c.rarity?.toLowerCase())
//                 .filter(Boolean),
//             ]),
//           ].join(", ")}`
//         );
//       }

//       // Use available cards even if one player has none (for demo purposes)
//       let randomPlayer1Card: OwnedCard;
//       let randomPlayer2Card: OwnedCard;

//       if (player1EligibleCards.length > 0) {
//         const randomIndex = Math.floor(
//           Math.random() * player1EligibleCards.length
//         );
//         randomPlayer1Card = player1EligibleCards[randomIndex];
//       } else {
//         // Fallback to any card from player1's collection
//         const fallbackCards = player1Collection.filter(
//           (c) => c && c.amount && parseInt(c.amount) > 0
//         );
//         if (fallbackCards.length > 0) {
//           randomPlayer1Card =
//             fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
//         } else {
//           throw new Error("No valid cards found for Player 1");
//         }
//       }

//       if (player2EligibleCards.length > 0) {
//         const randomIndex = Math.floor(
//           Math.random() * player2EligibleCards.length
//         );
//         randomPlayer2Card = player2EligibleCards[randomIndex];
//       } else {
//         // Fallback to any card from player2's collection
//         const fallbackCards = player2Collection.filter(
//           (c) => c && c.amount && parseInt(c.amount) > 0
//         );
//         if (fallbackCards.length > 0) {
//           randomPlayer2Card =
//             fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
//         } else {
//           throw new Error("No valid cards found for Player 2");
//         }
//       }

//       // Validate selected cards
//       if (!randomPlayer1Card || !randomPlayer2Card) {
//         throw new Error("Failed to select valid cards for both players");
//       }

//       console.log("🎲 Selected cards:", {
//         player1: `${randomPlayer1Card.name} (${randomPlayer1Card.rarity})`,
//         player2: `${randomPlayer2Card.name} (${randomPlayer2Card.rarity})`,
//       });

//       if (socket) {
//         socket.emit("WAGER_CARDS_SELECTED", {
//           roomId,
//           player1Card: randomPlayer1Card,
//           player2Card: randomPlayer2Card,
//           rarity: getRarity(),
//         });
//       }

//       setSelectedCards({
//         player1Card: randomPlayer1Card,
//         player2Card: randomPlayer2Card,
//       });

//       setStatus("Cards selected successfully!");

//       setTimeout(() => {
//         setStep("revealing");
//         setTimeout(() => {
//           handleAutomaticWagerCreation(
//             randomPlayer1Card,
//             randomPlayer2Card,
//             player1Wallet,
//             player2Wallet
//           );
//         }, 3000);
//       }, 1000);
//     } catch (error) {
//       console.error("Error in processAutomaticWager:", error);
//       setError(
//         error instanceof Error ? error.message : "Failed to load collections"
//       );
//       setStep("error");
//       setStatus(null);
//     }
//   };

//   const handleAutomaticWagerCreation = async (
//     player1Card: OwnedCard,
//     player2Card: OwnedCard,
//     player1Wallet: string,
//     player2Wallet: string
//   ) => {
//     if (wagerCreationInProgress.current) {
//       console.log("⚠️ Wager creation already in progress");
//       return;
//     }

//     wagerCreationInProgress.current = true;
//     setLoading(true);
//     setStep("processing");
//     setStatus("Preparing wager...");
//     setError(null);

//     try {
//       console.log("🎯 Creating wager for connected user:", connectedAddress);
//       console.log("🔄 Is Player 1:", isPlayer1);

//       const completeBattleData = {
//         roomId,
//         player1Card: {
//           ...player1Card,
//           owner: player1.id,
//           walletAddress: player1Wallet,
//         },
//         player2Card: {
//           ...player2Card,
//           owner: player2.id,
//           walletAddress: player2Wallet,
//         },
//         rarity: getRarity(),
//         contractLocked: false,
//         timestamp: Date.now(),
//         autoCreated: true,
//         blockchainAvailable,
//       };

//       // Try blockchain if available and user is connected
//       if (blockchainAvailable && isConnected && connectedAddress) {
//         try {
//           await createBlockchainWager(
//             player1Card,
//             player2Card,
//             player1Wallet,
//             player2Wallet,
//             completeBattleData
//           );
//         } catch (blockchainError: any) {
//           console.warn("⚠️ Blockchain integration failed:", blockchainError);

//           // Handle user rejection specifically
//           if (
//             blockchainError?.code === "ACTION_REJECTED" ||
//             blockchainError?.code === 4001 ||
//             blockchainError?.message?.includes("user rejected") ||
//             blockchainError?.message?.includes("User denied")
//           ) {
//             setStatus("❌ Transaction rejected by user");
//             setError(
//               "You rejected the transaction. Please try again if you want to proceed."
//             );
//             setStep("error");
//             return;
//           } else {
//             setStatus("⚠️ Blockchain failed, using demo mode");
//             setError(
//               "Blockchain integration failed: " +
//                 (blockchainError?.message || "Unknown error")
//             );
//             // Continue with demo mode
//             completeBattleData.contractLocked = false;
//             setBattleData(completeBattleData);
//             setStep("completed");
//             setStatus("✅ Demo wager created!");
//           }
//         }
//       } else {
//         console.log("📱 Using off-chain wager");
//         completeBattleData.contractLocked = false;
//         setBattleData(completeBattleData);
//         setStep("completed");
//         setStatus("✅ Demo wager created!");
//       }
//     } catch (error) {
//       console.error("Error creating wager:", error);
//       setError(
//         error instanceof Error ? error.message : "Failed to create wager"
//       );
//       setStep("error");
//     } finally {
//       setLoading(false);
//       wagerCreationInProgress.current = false;
//     }
//   };

//   const createBlockchainWager = async (
//     player1Card: OwnedCard,
//     player2Card: OwnedCard,
//     player1Wallet: string,
//     player2Wallet: string,
//     battleData: any
//   ) => {
//     console.log("🔗 Starting blockchain wager creation...");

//     if (!window.ethereum || !connectedAddress) {
//       throw new Error("MetaMask not available or not connected");
//     }

//     const ethersProvider = new ethers.BrowserProvider(window.ethereum);
//     const signer = await ethersProvider.getSigner();

//     // 1. Determine which card the connected user owns and what their role is
//     setStatus("Validating token ownership...");

//     let selectedCard: OwnedCard;
//     let selectedTokenId: number;
//     let userIsPlayer1: boolean;

//     console.log("🔍 Debug Info:");
//     console.log("Connected Address:", connectedAddress);
//     console.log("Player 1 Wallet:", player1Wallet);
//     console.log("Player 2 Wallet:", player2Wallet);
//     console.log("Player 1 Card:", player1Card);
//     console.log("Player 2 Card:", player2Card);

//     // Enhanced validation with better error messages
//     const ownsP1Card = await validateTokenOwnership(
//       connectedAddress,
//       player1Card.tokenId,
//       ethersProvider
//     );

//     const ownsP2Card = await validateTokenOwnership(
//       connectedAddress,
//       player2Card.tokenId,
//       ethersProvider
//     );

//     console.log("👤 Ownership Check Results:");
//     console.log(
//       `User owns Player 1 card (${player1Card.tokenId}):`,
//       ownsP1Card
//     );
//     console.log(
//       `User owns Player 2 card (${player2Card.tokenId}):`,
//       ownsP2Card
//     );

//     if (ownsP1Card) {
//       selectedCard = player1Card;
//       selectedTokenId = player1Card.tokenId;
//       userIsPlayer1 = true;
//       console.log("✅ User owns Player 1 card:", player1Card.name);
//     } else if (ownsP2Card) {
//       selectedCard = player2Card;
//       selectedTokenId = player2Card.tokenId;
//       userIsPlayer1 = false;
//       console.log("✅ User owns Player 2 card:", player2Card.name);
//     } else {
//       throw new Error(
//         `You don't own either selected card.
//       Player 1 card: ${player1Card.name} (ID: ${player1Card.tokenId})
//       Player 2 card: ${player2Card.name} (ID: ${player2Card.tokenId})
//       Your address: ${connectedAddress}

//       Please ensure you have the required cards in your wallet.`
//       );
//     }

//     // 2. Enhanced approval check
//     setStatus("Checking token approvals...");
//     const erc1155Contract = new ethers.Contract(
//       POKEMON_CARD_CONTRACT_ADDRESS,
//       ERC1155_ABI,
//       signer
//     );

//     const isApproved = await erc1155Contract.isApprovedForAll(
//       connectedAddress,
//       WAGER_CONTRACT_ADDRESS
//     );

//     console.log("🔐 Approval Status:", isApproved);

//     if (!isApproved) {
//       console.log("❗ Approval required");
//       setStatus("Requesting token approval...");
//       const approvalTx = await erc1155Contract.setApprovalForAll(
//         WAGER_CONTRACT_ADDRESS,
//         true
//       );
//       console.log("📤 Approval transaction:", approvalTx.hash);
//       await approvalTx.wait();
//       console.log("✅ Token approval confirmed");
//     } else {
//       console.log("✅ Tokens already approved");
//     }

//     // 3. Enhanced balance verification
//     setStatus("Verifying token balance...");
//     const currentBalance = await erc1155Contract.balanceOf(
//       connectedAddress,
//       BigInt(selectedTokenId)
//     );

//     console.log(
//       `💰 Current balance for token ${selectedTokenId}:`,
//       currentBalance.toString()
//     );

//     if (currentBalance < 1n) {
//       throw new Error(
//         `Insufficient balance for token ${selectedTokenId}.
//       Current balance: ${currentBalance.toString()}
//       Required: 1
//       Token: ${selectedCard.name}`
//       );
//     }

//     // 4. Additional validation checks before contract call
//     console.log("🔍 Pre-contract validation:");
//     console.log("User is Player 1:", userIsPlayer1);
//     console.log("Contract Address:", WAGER_CONTRACT_ADDRESS);
//     console.log("Pokemon Contract Address:", POKEMON_CARD_CONTRACT_ADDRESS);

//     // Validate addresses
//     if (!ethers.isAddress(player1Wallet)) {
//       throw new Error(`Invalid Player 1 wallet address: ${player1Wallet}`);
//     }
//     if (!ethers.isAddress(player2Wallet)) {
//       throw new Error(`Invalid Player 2 wallet address: ${player2Wallet}`);
//     }
//     if (player1Wallet.toLowerCase() === player2Wallet.toLowerCase()) {
//       throw new Error(
//         "Player 1 and Player 2 cannot have the same wallet address"
//       );
//     }

//     // 5. Create or join the wager based on user role
//     if (userIsPlayer1) {
//       // Player 1 creates the wager
//       setStatus("Creating wager on blockchain...");

//       console.log("🎯 Creating wager with parameters:");
//       console.log("Player 2 Address:", player2Wallet);
//       console.log("Player 1 Token IDs:", [player1Card.tokenId]);
//       console.log("Player 1 Amounts:", [1]);
//       console.log("Player 2 Token IDs:", [player2Card.tokenId]);
//       console.log("Player 2 Amounts:", [1]);

//       const wagerResult = await createWager(
//         player2Wallet,
//         [player1Card.tokenId],
//         [1],
//         [player2Card.tokenId],
//         [1]
//       );

//       if (!wagerResult.success) {
//         throw new Error(wagerResult.error || "Failed to create wager");
//       }

//       console.log("✅ Wager created successfully:", wagerResult);

//       // Update battle data
//       battleData.contractLocked = true;
//       battleData.wagerId = wagerResult.wagerId;
//       battleData.txHash = wagerResult.txHash;
//       battleData.selectedCard = selectedCard;
//       battleData.isPlayer1 = true;

//       setBattleData(battleData);
//       setStep("completed");
//       setStatus(
//         `✅ Wager created successfully! Waiting for Player 2 to join...`
//       );
//     } else {
//       // Player 2 joins an existing wager
//       setStatus("Waiting for Player 1 to create wager...");

//       // Wait for wagerId to be available from battleData or roomState
//       let existingWagerId = battleData.wagerId || battleData?.wagerId;
//       console.log("⚔️⚔️⚔️⚔️battleData.wagerId", battleData.wagerId);
//       // If no wagerId yet, we need to wait or get it from the parent component
//       if (!existingWagerId) {
//         // Try to get it from the socket/room state
//         existingWagerId = lockedBattleData?.wagerId;
//       }

//       if (!existingWagerId) {
//         throw new Error(
//           "Player 1 must create the wager first. Please wait for the wager to be created."
//         );
//       }

//       setStatus("Joining existing wager...");
//       console.log("🤝 Joining wager with ID:", existingWagerId);

//       const joinResult = await joinWager(existingWagerId);

//       if (!joinResult.success) {
//         throw new Error(joinResult.error || "Failed to join wager");
//       }

//       console.log("✅ Successfully joined wager:", joinResult);

//       // Update battle data
//       battleData.contractLocked = true;
//       battleData.wagerId = existingWagerId;
//       battleData.txHashJoin = joinResult.txHash;
//       battleData.selectedCard = selectedCard;
//       battleData.isPlayer1 = false;

//       setBattleData(battleData);
//       setStep("completed");
//       setStatus(`✅ Successfully joined the wager!`);
//     }
//   };

//   const handleConfirmBattle = () => {
//     if (battleData) {
//       onCardsLocked(battleData);
//       onClose();
//     }
//   };

//   const handleLeaveRoom = async () => {
//     try {
//       // Optional: confirm with user
//       const confirmLeave = window.confirm(
//         "Are you sure you want to leave and cancel the wager?"
//       );
//       if (!confirmLeave) return;

//       // 1. Cancel wager via API if exists
//       if (battleData?.wagerId) {
//         const res = await fetch("/api/battle/cancel-wager", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ wagerId: battleData.wagerId }),
//         });

//         let data;
//         try {
//           data = await res.json();
//         } catch (e) {
//           console.error("Failed to parse JSON response", e);
//           return alert("Unknown error occurred");
//         }

//         if (!res.ok) {
//           console.error("Failed to cancel wager:", data?.error);
//           alert(data?.error || "Failed to cancel wager. Please try again.");
//           return;
//         }

//         console.log("✅ Wager cancelled:", data);
//       }

//       // 2. Emit to WebSocket
//       socket.emit("LEAVE_ROOM", {
//         roomId: roomState?.id,
//         playerId: roomState?.player1?.id,
//       });

//       // 3. Navigate back to lobby
//       router.push("/battle/pvp");
//     } catch (err) {
//       console.error("Leave room error:", err);
//       alert("Error leaving room");
//     }
//   };

//   const handleRetry = () => {
//     // Reset state and try again
//     wagerCreationInProgress.current = false;
//     hasInitialized.current = false;
//     setError(null);
//     setStatus(null);
//     setStep("loading");
//     processAutomaticWager();
//   };

//   if (!isOpen) return null;

//   return (
//     <AnimatePresence>
//       <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           exit={{ opacity: 0, scale: 0.9 }}
//           className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl border-2 border-yellow-400/50 p-8 max-w-4xl w-full mx-4 shadow-2xl relative"
//         >
//           {/* Header */}
//           <div className="text-center mb-8">
//             <h2 className="text-4xl font-black text-yellow-400 mb-2">
//               BATTLE WAGER
//             </h2>
//             <p className="text-cyan-300 text-lg">
//               Selecting cards and creating wager...
//             </p>
//             <div
//               className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${getRarityGradient(
//                 confirmedRarity
//               )} text-white font-bold mt-2`}
//             >
//               {getRarity().toUpperCase()} RARITY BATTLE
//             </div>
//           </div>

//           {/* Status Message */}
//           {status && (
//             <div className="flex items-center justify-center mb-6">
//               <div
//                 className={`
//                   max-w-md w-full rounded-lg border
//                   ${
//                     status.startsWith("✅")
//                       ? "border-green-500 bg-green-600/20 text-green-200"
//                       : status.startsWith("❌")
//                       ? "border-red-500 bg-red-600/20 text-red-200"
//                       : "border-blue-500 bg-blue-600/20 text-blue-200"
//                   }
//                   px-4 py-3 shadow
//                 `}
//               >
//                 <p className="text-center text-sm font-medium">{status}</p>
//               </div>
//             </div>
//           )}

//           {/* Step Content */}
//           <AnimatePresence mode="wait">
//             {step === "loading" && (
//               <motion.div
//                 key="loading"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="text-center py-12"
//               >
//                 <div className="relative">
//                   <div className="animate-spin rounded-full h-24 w-24 border-4 border-yellow-400 border-t-transparent mx-auto mb-6"></div>
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <span className="text-2xl">🎴</span>
//                   </div>
//                 </div>
//                 <h3 className="text-2xl font-bold text-yellow-400 mb-4">
//                   Loading Collections...
//                 </h3>
//                 <p className="text-cyan-300">
//                   Checking available {getRarity()} cards for both players
//                 </p>
//                 <p className="text-sm text-gray-400 mt-2">
//                   {blockchainAvailable
//                     ? "Loading from blockchain..."
//                     : "Using demo cards..."}
//                 </p>
//               </motion.div>
//             )}

//             {step === "revealing" &&
//               selectedCards.player1Card &&
//               selectedCards.player2Card && (
//                 <motion.div
//                   key="revealing"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   className="space-y-8"
//                 >
//                   <div className="text-center mb-6">
//                     <h3 className="text-2xl font-bold text-green-400 mb-2">
//                       Cards Selected!
//                     </h3>
//                     <p className="text-cyan-300">
//                       Random cards have been chosen for both players
//                     </p>
//                   </div>

//                   {/* Card Display */}
//                   <div className="grid md:grid-cols-2 gap-8 relative">
//                     {/* Player 1 Card */}
//                     <motion.div
//                       initial={{ x: -100, opacity: 0 }}
//                       animate={{ x: 0, opacity: 1 }}
//                       transition={{ delay: 0.5 }}
//                       className="bg-black/40 rounded-xl p-6 border-2 border-blue-400/50"
//                     >
//                       <div className="text-center mb-4">
//                         <h4 className="text-xl font-bold text-blue-300">
//                           {player1.name}
//                         </h4>
//                         <div className="flex items-center justify-center gap-2 mt-2">
//                           <img
//                             src={player1.avatar}
//                             alt={player1.name}
//                             className="w-8 h-8 rounded-full"
//                           />
//                           <span className="text-sm text-gray-300">
//                             Player 1
//                           </span>
//                         </div>
//                       </div>

//                       <motion.div
//                         initial={{ rotateY: 180 }}
//                         animate={{ rotateY: 0 }}
//                         transition={{ delay: 1, duration: 0.8 }}
//                         className="relative"
//                       >
//                         <img
//                           src={selectedCards.player1Card.imageUrl}
//                           alt={selectedCards.player1Card.name}
//                           className="w-full max-w-48 mx-auto rounded-lg shadow-2xl"
//                         />
//                       </motion.div>

//                       <div className="mt-4 text-center">
//                         <p className="text-white font-bold">
//                           {selectedCards.player1Card.name}
//                         </p>
//                         <p className="text-blue-300 text-sm">
//                           Token ID: #{selectedCards.player1Card.tokenId}
//                         </p>
//                         <div
//                           className={`inline-block px-2 py-1 rounded-full text-xs mt-1 bg-gradient-to-r ${getRarityGradient(
//                             selectedCards.player1Card.rarity
//                           )} text-white`}
//                         >
//                           {selectedCards.player1Card.rarity.toUpperCase()}
//                         </div>
//                       </div>
//                     </motion.div>

//                     {/* VS Divider */}
//                     <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
//                       <motion.div
//                         initial={{ scale: 0 }}
//                         animate={{ scale: 1 }}
//                         transition={{ delay: 1.5, type: "spring" }}
//                         className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full w-16 h-16 flex items-center justify-center font-black text-xl shadow-lg"
//                       >
//                         VS
//                       </motion.div>
//                     </div>

//                     {/* Player 2 Card */}
//                     <motion.div
//                       initial={{ x: 100, opacity: 0 }}
//                       animate={{ x: 0, opacity: 1 }}
//                       transition={{ delay: 0.5 }}
//                       className="bg-black/40 rounded-xl p-6 border-2 border-red-400/50"
//                     >
//                       <div className="text-center mb-4">
//                         <h4 className="text-xl font-bold text-red-300">
//                           {player2.name}
//                         </h4>
//                         <div className="flex items-center justify-center gap-2 mt-2">
//                           <img
//                             src={player2.avatar}
//                             alt={player2.name}
//                             className="w-8 h-8 rounded-full"
//                           />
//                           <span className="text-sm text-gray-300">
//                             Player 2
//                           </span>
//                         </div>
//                       </div>

//                       <motion.div
//                         initial={{ rotateY: 180 }}
//                         animate={{ rotateY: 0 }}
//                         transition={{ delay: 1.2, duration: 0.8 }}
//                         className="relative"
//                       >
//                         <img
//                           src={selectedCards.player2Card.imageUrl}
//                           alt={selectedCards.player2Card.name}
//                           className="w-full max-w-48 mx-auto rounded-lg shadow-2xl"
//                         />
//                       </motion.div>

//                       <div className="mt-4 text-center">
//                         <p className="text-white font-bold">
//                           {selectedCards.player2Card.name}
//                         </p>
//                         <p className="text-red-300 text-sm">
//                           Token ID: #{selectedCards.player2Card.tokenId}
//                         </p>
//                         <div
//                           className={`inline-block px-2 py-1 rounded-full text-xs mt-1 bg-gradient-to-r ${getRarityGradient(
//                             selectedCards.player2Card.rarity
//                           )} text-white`}
//                         >
//                           {selectedCards.player2Card.rarity.toUpperCase()}
//                         </div>
//                       </div>
//                     </motion.div>
//                   </div>
//                 </motion.div>
//               )}

//             {step === "processing" && (
//               <motion.div
//                 key="processing"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="text-center py-12"
//               >
//                 <div className="relative">
//                   <div className="animate-spin rounded-full h-24 w-24 border-4 border-blue-400 border-t-transparent mx-auto mb-6"></div>
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <span className="text-2xl">⚔️</span>
//                   </div>
//                 </div>
//                 <h3 className="text-2xl font-bold text-blue-400 mb-4">
//                   Creating Battle Wager...
//                 </h3>
//                 <p className="text-cyan-300 mb-2">
//                   {blockchainAvailable
//                     ? isPlayer1
//                       ? "Creating wager on blockchain as Player 1..."
//                       : "Joining wager on blockchain as Player 2..."
//                     : "Preparing battle data for demo mode"}
//                 </p>
//                 <p className="text-sm text-gray-400">
//                   {blockchainAvailable && isConnected
//                     ? isPlayer1
//                       ? "Checking token ownership, approvals, and creating wager"
//                       : "Checking token ownership, approvals, and joining wager"
//                     : "Processing wager data..."}
//                 </p>
//                 {loading && blockchainAvailable && (
//                   <div className="mt-4 text-xs text-yellow-300">
//                     ⏳ Waiting for blockchain confirmation...
//                   </div>
//                 )}
//               </motion.div>
//             )}

//             {step === "completed" && (
//               <motion.div
//                 key="completed"
//                 initial={{ opacity: 0, scale: 0.8 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 exit={{ opacity: 0, scale: 0.8 }}
//                 className="text-center py-12"
//               >
//                 <motion.div
//                   initial={{ rotate: 0 }}
//                   animate={{ rotate: 360 }}
//                   transition={{ duration: 1, ease: "easeInOut" }}
//                   className="text-8xl mb-6"
//                 >
//                   🔒
//                 </motion.div>
//                 <h3 className="text-3xl font-bold text-green-400 mb-4">
//                   Wager {isPlayer1 ? "Created" : "Joined"} Successfully!
//                 </h3>
//                 <p className="text-cyan-300 mb-4">
//                   {battleData?.contractLocked
//                     ? isPlayer1
//                       ? "Wager created on blockchain - waiting for Player 2 to join"
//                       : "Successfully joined the blockchain wager - ready for battle"
//                     : "Demo wager created - cards are ready for battle"}
//                 </p>
//                 {battleData?.wagerId && (
//                   <div className="bg-black/40 rounded-lg p-4 max-w-sm mx-auto mb-4">
//                     <p className="text-sm text-gray-300">
//                       Wager ID:{" "}
//                       <span className="text-green-400 font-mono">
//                         #{battleData.wagerId}
//                       </span>
//                     </p>
//                     {battleData.txHash && (
//                       <p className="text-xs text-gray-400 mt-2 break-all">
//                         Create TX: {battleData.txHash.slice(0, 10)}...
//                       </p>
//                     )}
//                     {battleData.txHashJoin && (
//                       <p className="text-xs text-gray-400 mt-1 break-all">
//                         Join TX: {battleData.txHashJoin.slice(0, 10)}...
//                       </p>
//                     )}
//                   </div>
//                 )}
//               </motion.div>
//             )}

//             {step === "error" && (
//               <motion.div
//                 key="error"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="text-center py-12"
//               >
//                 <div className="text-8xl mb-6">❌</div>
//                 <h3 className="text-3xl font-bold text-red-400 mb-4">
//                   Wager Creation Failed
//                 </h3>
//                 <p className="text-red-300 mb-6">
//                   {error || "An unexpected error occurred"}
//                 </p>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Action Buttons */}
//           <div className="flex justify-center gap-4 mt-8">
//             {step === "completed" && (
//               <>
//                 {/* Show different buttons based on player role and blockchain status */}
//                 {battleData?.contractLocked && isPlayer1 ? (
//                   // Player 1 with blockchain wager - waiting for Player 2
//                   <div className="text-center">
//                     <div className="animate-pulse text-yellow-400 text-lg font-semibold mb-2">
//                       ⏳ Waiting for {player2.name} to join the wager...
//                     </div>
//                     <p className="text-gray-400 text-sm mb-4">
//                       Player 2 needs to connect their wallet and join the
//                       blockchain wager
//                     </p>
//                     <button
//                       onClick={handleLeaveRoom}
//                       className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors"
//                     >
//                       🚪 Cancel & Leave Room
//                     </button>
//                   </div>
//                 ) : !isPlayer1 ? (
//                   // Player 2 (joiner) buttons
//                   <>
//                     <button
//                       onClick={handleLeaveRoom}
//                       className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors"
//                     >
//                       🚪 Leave Room
//                     </button>
//                     <button
//                       onClick={handleConfirmBattle}
//                       className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg"
//                     >
//                       ⚔️ Confirm & Start Battle
//                     </button>
//                   </>
//                 ) : (
//                   // Player 1 with demo wager or both players ready
//                   <div className="text-center">
//                     <div className="animate-pulse text-yellow-400 text-lg font-semibold mb-2">
//                       ⏳ Waiting for {player2.name} to confirm the battle...
//                     </div>
//                     <p className="text-gray-400 text-sm mb-4">
//                       The battle will begin once both players are ready
//                     </p>
//                     <button
//                       onClick={handleLeaveRoom}
//                       className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors"
//                     >
//                       🚪 Leave Room
//                     </button>
//                   </div>
//                 )}
//               </>
//             )}

//             {step === "error" && (
//               <>
//                 <button
//                   onClick={handleLeaveRoom}
//                   className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
//                 >
//                   🚪 Leave Room
//                 </button>
//                 <button
//                   onClick={handleRetry}
//                   className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
//                 >
//                   🔄 Retry
//                 </button>
//               </>
//             )}

//             {(step === "loading" ||
//               step === "revealing" ||
//               step === "processing") && (
//               <button
//                 onClick={handleLeaveRoom}
//                 className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
//               >
//                 🚪 Cancel & Leave
//               </button>
//             )}
//           </div>

//           {/* Connection Status */}
//           {blockchainAvailable &&
//             (step === "loading" || step === "revealing") &&
//             !isConnected && (
//               <motion.div
//                 initial={{ y: 20, opacity: 0 }}
//                 animate={{ y: 0, opacity: 1 }}
//                 className="mt-6 bg-orange-500/20 rounded-xl p-4 border border-orange-400/50 text-center"
//               >
//                 <p className="text-orange-300 mb-3">
//                   Connect your wallet to enable blockchain features
//                 </p>
//                 <p className="text-xs text-gray-400 mt-2">
//                   Wallet connection required for card ownership verification and
//                   wager {isPlayer1 ? "creation" : "joining"}
//                 </p>
//               </motion.div>
//             )}

//           {/* Error Display */}
//           {error && step !== "error" && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
//             >
//               <div className="flex items-center gap-2">
//                 <span className="text-red-400 text-xl">⚠️</span>
//                 <p className="text-red-300">{error}</p>
//               </div>
//             </motion.div>
//           )}

//           {/* Loading Prevention Message */}
//           {wagerCreationInProgress.current && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg"
//             >
//               <div className="flex items-center gap-2">
//                 <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
//                 <p className="text-blue-300">
//                   Wager {isPlayer1 ? "creation" : "joining"} in progress...
//                   Please wait.
//                 </p>
//               </div>
//             </motion.div>
//           )}

//           {/* Player Role Indicator */}
//           <div className="absolute top-4 right-4">
//             <div
//               className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                 isPlayer1
//                   ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
//                   : "bg-red-500/20 text-red-300 border border-red-400/30"
//               }`}
//             >
//               {isPlayer1 ? "🟦 Player 1" : "🟥 Player 2"}
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </AnimatePresence>
//   );
// }
