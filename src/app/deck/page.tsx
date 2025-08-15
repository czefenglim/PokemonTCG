"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { ethers } from "ethers"; // 👈 import ethers

type Deck = {
  id: string;
  name: string;
  cards: any[];
};

export default function DeckList() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const session = await getSession();

        if (!session) throw new Error("User is not authenticated");

        // 🔐 Get wallet address from MetaMask
        if (!window.ethereum) {
          throw new Error("MetaMask is not installed");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        console.log(address);
        const res = await fetch("/api/decks/show-deck", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "X-Wallet-Address": address, // optional if you want to validate further
          },
        });

        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

        const data = await res.json();
        const decksData = Array.isArray(data) ? data : data.decks;

        if (!Array.isArray(decksData)) {
          throw new Error(
            "Invalid response format: expected an array of decks"
          );
        }

        setDecks(decksData);
      } catch (err: any) {
        console.error("Failed to fetch decks:", err);
        setError("Failed to load decks.");
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deck?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/decks/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error(`Failed to delete deck: ${res.status}`);
      }

      setDecks((prevDecks) => prevDecks.filter((deck) => deck.id !== id));
    } catch (err) {
      console.error("Error deleting deck:", err);
      setError("Failed to delete deck.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 mb-4 animate-pulse">
              Card Decks
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              Manage your collection of trading card decks. Create, view, and
              organize your cards in style.
            </p>

            <Link
              href="/deck/new-deck"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl hover:from-purple-500 hover:to-pink-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
            >
              <span className="absolute inset-0 w-full h-full transition duration-300 transform -translate-x-1 -translate-y-1 bg-gradient-to-r from-purple-800 to-pink-800 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"></span>
              <span className="relative flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm">✨</span>
                </div>
                Create New Deck
              </span>
            </Link>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 text-red-200 p-6 rounded-2xl mb-8 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-red-400">⚠️</span>
                </div>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-200/20 rounded-full animate-spin">
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"></div>
                </div>
              </div>
              <p className="text-gray-400 mt-6 text-lg">
                Loading your decks...
              </p>
            </div>
          ) : decks.length === 0 ? (
            /* Empty State */
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/10">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎴</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No decks yet
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Start building your collection by creating your first deck.
                Organize your favorite cards and showcase your strategy.
              </p>
              <Link
                href="/deck/new-deck"
                className="inline-flex items-center justify-center px-6 py-3 text-white font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25"
              >
                <span className="mr-2">🚀</span>
                Create Your First Deck
              </Link>
            </div>
          ) : (
            /* Decks Grid */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {decks.map((deck, index) => (
                <div
                  key={deck.id}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-purple-400/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Deck Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-2 group-hover:from-purple-300 group-hover:to-pink-300 transition-all duration-300">
                        {deck.name}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          {deck.cards?.length || 0} cards
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          Ready to play
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(deck.id)}
                      disabled={deletingId === deck.id}
                      className="relative group/btn p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === deck.id ? (
                        <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          className="w-5 h-5 text-red-400 group-hover/btn:text-red-300 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Cards Preview with Auto-Scroll */}
                  <div className="relative overflow-hidden h-52">
                    <div
                      className="flex gap-3 transition-transform duration-500 ease-out"
                      style={{
                        transform: `translateX(var(--scroll-offset, 0px))`,
                      }}
                    >
                      {deck.cards?.map((card: any, cardIndex: number) => (
                        <div
                          key={card.tokenId}
                          className="relative flex-shrink-0 group/card"
                          style={{
                            transform: `translateX(${
                              cardIndex * -8
                            }px) rotate(${cardIndex * 2 - 4}deg)`,
                            zIndex: deck.cards.length - cardIndex,
                          }}
                          onMouseEnter={(e) => {
                            const container = e.currentTarget
                              .parentElement as HTMLElement;
                            if (container) {
                              // Calculate scroll offset based on card position
                              let scrollOffset = 0;
                              if (cardIndex >= 4) {
                                // Start scrolling from the 5th card (index 4)
                                scrollOffset = -(cardIndex - 3) * 150; // 24px per card to show more
                              }
                              container.style.setProperty(
                                "--scroll-offset",
                                `${scrollOffset}px`
                              );
                            }
                          }}
                          onMouseLeave={(e) => {
                            const container = e.currentTarget
                              .parentElement as HTMLElement;
                            if (container && cardIndex <= 2) {
                              // Reset scroll when leaving first 3 cards
                              container.style.setProperty(
                                "--scroll-offset",
                                "0px"
                              );
                            }
                          }}
                        >
                          <div className="relative overflow-hidden rounded-xl border-2 border-white/20 group-hover/card:border-purple-400/50 transition-all duration-300">
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="w-32 h-44 object-cover transition-all duration-300 group-hover/card:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
