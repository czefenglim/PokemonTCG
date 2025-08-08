"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import abi from "@/app/lib/pokemonCardABI.json";
import { useAccount } from "wagmi";
import TiltCard from "@/components/TiltCard";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

type Card = {
  tokenId: number;
  tcgId: string;
  name: string;
  imageUrl: string;
  rarity?: string;
};

function Pokeball({
  onOpen,
  resetTrigger,
}: {
  onOpen: () => void;
  resetTrigger: number;
}) {
  const group = useRef<any>();
  const { scene } = useGLTF("/models/pokeball/scene.gltf");
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    // Reset Pokeball when resetTrigger changes
    setOpened(false);
  }, [resetTrigger]);

  useFrame(() => {
    if (group.current && !opened) {
      group.current.rotation.y += 0.005;
    }
  });

  return (
    <group
      ref={group}
      onClick={() => {
        if (!opened) {
          setOpened(true);
          onOpen();
        }
      }}
      scale={opened ? [0.25, 0.25, 0.25] : [0.2, 0.2, 0.2]}
      position={[0, -0.5, 0]}
      rotation={[0, 0, 0]}
    >
      <primitive object={scene} />
    </group>
  );
}

export default function PacksPage() {
  const [nextPackAt, setNextPackAt] = useState<number | null>(null);
  const [gems, setGems] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [resetCount, setResetCount] = useState(0);

  const { isConnected } = useAccount();

  useEffect(() => {
    fetch("/api/packs/status")
      .then((res) => res.json())
      .then((data) => {
        setNextPackAt(data.nextPackAt);
        setGems(data.gems);
      });
  }, []);

  const openPack = async () => {
    if (!isConnected || typeof window === "undefined" || !window.ethereum) {
      alert("Please connect your wallet first.");
      return;
    }

    setLoading(true);
    setStatus("Opening pack...");

    try {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();

      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        abi,
        signer
      );

      const res = await fetch("/api/packs/open", { method: "POST" });
      const data = await res.json();
      const fetchedCards: Card[] = data.cards;

      console.log("Fetched cards:", fetchedCards);

      const ids = fetchedCards.map((c) => BigInt(c.tokenId));
      const amounts = ids.map(() => 1);

      setStatus("Minting cards...");

      const tx = await contract.mintBatchCards(ids, amounts);
      await tx.wait();

      setCards(fetchedCards);
      setRevealed([]);
      setNextPackAt(Date.now() + 24 * 60 * 60 * 1000);
      setStatus("✅ Mint successful! Click cards to reveal.");
    } catch (err: any) {
      if (err?.code === "ACTION_REJECTED") {
        setStatus("❌ Transaction rejected.");
        setResetCount((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        console.error(err);
        alert(`Error: ${err?.message || "Unknown error"}`);
        setStatus(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const canOpen = !nextPackAt || nextPackAt < Date.now();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-4xl space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold">Pokémon TCG Pack Opening</h1>
          <p className="text-gray-400">
            Experience the thrill of opening your pack
          </p>
        </header>

        {status && (
          <div className="flex items-center justify-center">
            <div
              className={`
        max-w-md w-full rounded-lg border
        ${
          status.startsWith("✅")
            ? "border-green-500 bg-green-600/20 text-green-200"
            : status.startsWith("❌")
            ? "border-red-500 bg-red-600/20 text-red-200"
            : "border-blue-500 bg-blue-600/20 text-blue-200"
        }
        px-4 py-3 shadow
      `}
            >
              <p className="text-center text-sm font-medium">{status}</p>
            </div>
          </div>
        )}

        {cards.length === 0 ? (
          canOpen ? (
            <div className="w-full h-96 relative">
              <Canvas camera={{ position: [0, 0, 5], fov: 15 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[0, 5, 5]} intensity={1} />
                <Pokeball
                  onOpen={() => {
                    if (!loading) openPack();
                  }}
                  resetTrigger={resetCount}
                />
                <OrbitControls enableZoom={false} />
              </Canvas>
              <p className="text-center text-sm text-gray-300 mt-4">
                Click the Pokéball to open your pack
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <p>
                Next free pack at:{" "}
                <span className="font-mono">
                  {new Date(nextPackAt).toLocaleTimeString()}
                </span>
              </p>
              <button
                onClick={async () => {
                  await fetch("/api/packs/skip", { method: "POST" });
                  setNextPackAt(Date.now());
                }}
                className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded"
              >
                Spend Gems ({gems}) to Open Now
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 mt-6">
            {cards.map((card) => {
              const isRevealed = revealed.includes(card.tokenId);
              return (
                <motion.div
                  key={card.tokenId}
                  initial={false}
                  animate={{ rotateY: isRevealed ? 0 : 180 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-full aspect-[3/4] cursor-pointer [transform-style:preserve-3d]"
                  onClick={() =>
                    setRevealed((prev) =>
                      prev.includes(card.tokenId)
                        ? prev
                        : [...prev, card.tokenId]
                    )
                  }
                >
                  <div className="absolute inset-0 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-base text-gray-300 [backface-visibility:hidden] rotate-y-180">
                    Click to reveal
                  </div>
                  <div className="absolute inset-0 bg-gray-800 border border-gray-700 rounded-lg [backface-visibility:hidden] flex flex-col">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-contain rounded"
                    />
                    <p className="mt-2 text-center text-base font-medium">
                      {card.name}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
