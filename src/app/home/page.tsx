"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";
import FeatureSection from "@/components/FeatureSection";
import AvatarPickerModal from "@/components/AvatarPickerModal";
import { motion } from "framer-motion";
import { UserPlusIcon } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [avatarUrl, setAvatarUrl] = useState(
    "https://images.pokemontcg.io/base1/58.png"
  );
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Music state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [friendUsername, setFriendUsername] = useState("");
  const [friendRequests, selectFriendRequests] = useState(false);
  const [friends, selectFriends] = useState(true);
  const [friendList, setFriendList] = useState<any[]>([]);
  const [friendRequestsList, setFriendRequestsList] = useState<any[]>([]);
  const [sentRequestsList, setSentRequestsList] = useState<any[]>([]);
  const [sentRequest, selectSentRequest] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("selectedAvatar");
    if (stored) {
      setAvatarUrl(stored);
    }
  }, []);

  // Fetch friends and friend requests
  useEffect(() => {
    const fetchFriends = async () => {
      if (!friends) return;

      try {
        const res = await fetch("/api/friends/getFriendList");
        if (!res.ok) {
          throw new Error("Failed to fetch friend list");
        }
        const data = await res.json();
        setFriendList(data);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchFriends();
  }, [friends]);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (!friendRequests) return;

      try {
        const res = await fetch("/api/friends/getReceivedRequest");
        if (!res.ok) {
          throw new Error("Failed to fetch friend requests");
        }
        const data = await res.json();
        setFriendRequestsList(data);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      }
    };

    fetchFriendRequests();
  }, [friendRequests]);

  useEffect(() => {
    const fetchSentRequests = async () => {
      if (!sentRequest) return;

      try {
        const res = await fetch("/api/friends/getSentRequest");
        if (!res.ok) {
          throw new Error("Failed to fetch sent requests");
        }
        const data = await res.json();
        setSentRequestsList(data);
      } catch (error) {
        console.error("Error fetching sent requests:", error);
      }
    };

    fetchSentRequests();
  }, [sentRequest]);

  if (status === "loading") {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-yellow-300 text-lg">Loading your dashboard...</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-lg">
          You must be logged in to access this page.
        </p>
      </main>
    );
  }

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!friendUsername || !session?.user?.id) {
      alert("Missing username or not logged in");
      return;
    }

    console.log("Sending friend request to:", friendUsername);
    console.log("Current user ID:", session.user.id);

    try {
      // 1. Fetch the friend's ID by username
      const resUser = await fetch(
        "/api/friends/getFriendID?username=" + friendUsername
      );

      if (!resUser.ok) {
        const msg = await resUser.text();
        alert("Error: " + msg);
        return;
      }

      const friend = await resUser.json();
      const friendId = friend.id;

      console.log("Friend data response:", friend);
      console.log("Extracted friend ID:", friend.id);

      // 2. Send the actual friend request using friendId
      const resRequest = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          friendId,
        }),
      });

      if (!resRequest.ok) {
        const errorMsg = await resRequest.text();
        alert("Failed to send request: " + errorMsg);
        return;
      }

      alert("Friend request sent!");
      setAddFriendModalOpen(false);
      setFriendUsername("");
    } catch (err) {
      console.error("Error sending friend request:", err);
      alert("An error occurred.");
    }
  };

  return (
    <main className="min-h-screen text-white p-6 relative">
      {/* Background music element */}
      <audio ref={audioRef} loop>
        <source src="/audio/background-music.mp3" type="audio/mpeg" />
      </audio>

      {/* Volume Button */}
      <button
        onClick={togglePlay}
        className="fixed bottom-4 right-4 bg-yellow-400 p-3 rounded-full shadow hover:bg-yellow-300 transition z-50"
      >
        {playing ? (
          <SpeakerWaveIcon className="w-6 h-6 text-black" />
        ) : (
          <SpeakerXMarkIcon className="w-6 h-6 text-black" />
        )}
      </button>

      <UserPlusIcon
        className="absolute top-4 right-50 w-10 h-10 text-yellow-300 cursor-pointer"
        onClick={() => setAddFriendModalOpen(true)}
      />

      {/* Add Friend Modal */}
      {addFriendModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 w-full max-w-md p-6 rounded-xl shadow-xl relative">
            <button
              onClick={() => setAddFriendModalOpen(false)}
              className="absolute text-3xl top-2 right-5 text-yellow-300 hover:text-yellow-200"
            >
              &times;
            </button>
            <h1 className="text-3xl font-bold text-yellow-300 mb-6 flex justify-center">
              Friends
            </h1>

            {/* Add Friends */}
            <div className="flex flex-col items-start">
              <h2 className="text-xl font-bold text-yellow-200 mb-4">
                Add Friend
              </h2>
              <input
                type="text"
                placeholder="Enter Trainer Username"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-700 text-yellow-200 mb-4"
              />
              <button
                onClick={() => handleSendFriendRequest()}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 rounded-lg transition-colors"
              >
                Send Request
              </button>
            </div>

            {/* Nav bar */}
            <div className="flex justify-center items-center mt-12 gap-6">
              <button
                onClick={() => {
                  selectFriends(true);
                  selectFriendRequests(false);
                  selectSentRequest(false);
                }}
                className={`text-yellow-300 hover:text-yellow-200 border border-yellow-300 rounded-lg px-4 py-2 ${
                  friends ? "bg-yellow-500 !text-black" : ""
                }`}
              >
                View Friends
              </button>
              <button
                onClick={() => {
                  selectFriendRequests(true);
                  selectFriends(false);
                  selectSentRequest(false);
                }}
                className={`text-yellow-300 hover:text-yellow-200 border border-yellow-300 rounded-lg px-4 py-2 ${
                  friendRequests ? "bg-yellow-500 !text-black" : ""
                }`}
              >
                Friend Requests
              </button>
              <button
                onClick={() => {
                  selectFriendRequests(false);
                  selectFriends(false);
                  selectSentRequest(true);
                }}
                className={`text-yellow-300 hover:text-yellow-200 border border-yellow-300 rounded-lg px-4 py-2 ${
                  sentRequest ? "bg-yellow-500 !text-black" : ""
                }`}
              >
                Sent Requests
              </button>
            </div>

            {/* Friends List */}
            {friends && (
              <div className="mt-6">
                <h2 className="text-xl font-bold text-yellow-200 mb-4">
                  Your Friends
                </h2>
                {friendList.length === 0 ? (
                  <p className="text-yellow-100">No friends yet!</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <ul className="space-y-2">
                      {friendList.map((friend, index) => (
                        <li
                          key={index}
                          className="bg-gray-800 border border-yellow-400 rounded-lg p-3 text-yellow-100"
                        >
                          {friend.friend?.username ?? "Unknown User"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Friend Requests */}
            {friendRequests && (
              <div className="mt-6">
                <h2 className="text-xl font-bold text-yellow-200 mb-4">
                  Friend Requests
                </h2>
                {friendRequestsList.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <ul className="space-y-2">
                      {friendRequestsList.map((request, index) => (
                        <li
                          key={index}
                          className="bg-gray-800 border border-yellow-400 rounded-lg p-3 text-yellow-100 flex justify-between items-center"
                        >
                          <span>{request.sender.username}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                // Handle accept request logic
                                const res = await fetch(
                                  "/api/friends/response/accept",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      senderId: request.sender.id,
                                      receiverId: session?.user?.id,
                                    }),
                                  }
                                );
                                if (res.ok) {
                                  alert("Friend request accepted!");
                                  setFriendRequestsList((prev) =>
                                    prev.filter(
                                      (r) => r.sender.id !== request.sender.id
                                    )
                                  );
                                } else {
                                  alert("Failed to accept friend request.");
                                }
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-lg"
                            >
                              Accept
                            </button>
                            <button
                              onClick={async () => {
                                // Handle reject request logic
                                const res = await fetch(
                                  "/api/friends/response/reject",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      senderId: request.sender.id,
                                      receiverId: session?.user?.id,
                                    }),
                                  }
                                );
                                if (res.ok) {
                                  alert("Friend request rejected!");
                                  setFriendRequestsList((prev) =>
                                    prev.filter(
                                      (r) => r.sender.id !== request.sender.id
                                    )
                                  );
                                } else {
                                  alert("Failed to reject friend request.");
                                }
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg"
                            >
                              Reject
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-yellow-100">No friend requests yet!</p>
                )}
              </div>
            )}
            {/* Sent Requests */}
            {sentRequest && (
              <div className="mt-6">
                <h2 className="text-xl font-bold text-yellow-200 mb-4">
                  Sent Requests
                </h2>
                {sentRequestsList.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <ul className="space-y-2">
                      {sentRequestsList.map((request, index) => (
                        <li
                          key={index}
                          className="bg-gray-800 border border-yellow-400 rounded-lg p-3 text-yellow-100"
                        >
                          <div className="flex items-center justify-between">
                            <span>{request.receiver.username}</span>
                            <div className="flex gap-3">
                              <span className="text-sm text-yellow-300">
                                {request.status}
                              </span>
                              <span className="text-sm text-gray-400">
                                {new Date(request.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-yellow-100">No sent requests yet!</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 mb-6">
        <h1 className="text-xl font-bold">
          {`Welcome back, ${session?.user?.name || "Trainer"}!`}
        </h1>
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-9 h-9 rounded-full border-2 border-yellow-400 cursor-pointer"
          onClick={() => setIsAvatarModalOpen(true)}
        />
      </div>

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl mt-6 mb-10  shadow-2xl"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://i.imgur.com/BwnxyqD.png')",
          }}
        ></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-8">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-300 text-xs font-semibold uppercase px-3 py-1 rounded-full tracking-wide">
              🔥 Hot Right Now
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow">
              Collect Rare NFT Packs
            </h2>
            <p className="text-white/80 text-base leading-relaxed max-w-lg">
              Unlock exclusive collectibles, showcase your collection, and trade
              with other trainers.
            </p>
            <Link
              href="/packs"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-3 rounded-xl transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 shadow-md hover:shadow-lg"
            >
              <span>Open Packs Now</span>
            </Link>
          </div>

          {/* Pokémon Images */}
          <div className="relative flex-shrink-0 flex items-end mt-6 md:mt-0 z-0 overflow-visible">
            <div className="relative w-36 md:w-48 lg:w-56 z-30 animate-float">
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png"
                alt="Charizard"
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
            <div className="relative w-28 md:w-36 lg:w-44 -ml-6 z-20 translate-y-3 animate-float-slower">
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png"
                alt="Gengar"
                className="w-full h-auto object-contain drop-shadow-xl"
              />
            </div>
            <div className="relative w-24 md:w-32 lg:w-40 -ml-6 z-10 -translate-y-2 animate-float-faster">
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png"
                alt="Snorlax"
                className="w-full h-auto object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features */}
      <FeatureSection />

      {/* Avatar Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={(url) => {
          setAvatarUrl(url);
          localStorage.setItem("selectedAvatar", url);
        }}
        currentAvatar={avatarUrl}
      />
    </main>
  );
}
