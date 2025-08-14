"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import FeatureSection from "@/components/FeatureSection";
import { motion } from "framer-motion";
import { UserPlusIcon } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();

  const [avatarUrl, setAvatarUrl] = useState(
    "https://images.pokemontcg.io/base1/58.png"
  );

  // Music state

  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [friendUsername, setFriendUsername] = useState("");
  const [friendRequests, selectFriendRequests] = useState(false);
  const [friends, selectFriends] = useState(true);
  const [friendList, setFriendList] = useState<any[]>([]);
  const [friendRequestsList, setFriendRequestsList] = useState<any[]>([]);
  const [sentRequestsList, setSentRequestsList] = useState<any[]>([]);
  const [sentRequest, selectSentRequest] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/viewProfile");
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();

        if (data.profilePicture) {
          setAvatarUrl(data.profilePicture);
          // Optionally, save it to localStorage
          localStorage.setItem("selectedAvatar", data.profilePicture);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
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

  const handleSendFriendRequest = async () => {
    if (!friendUsername || !session?.user?.id) {
      alert("Missing username or not logged in");
      return;
    }

    try {
      // 1. Fetch the friend's ID by username
      const resUser = await fetch(
        "../api/friends/getFriendID?username=" + friendUsername
      );

      if (!resUser.ok) {
        const msg = await resUser.text();
        alert("Error: " + msg);
        return;
      }

      const friend = await resUser.json();
      const friendId = friend.id;

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
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAddFriendModalOpen(true)}
        className="absolute top-10 right-40 z-30 group"
      >
        <div className="relative">
          {/* Main icon with gradient and shine effect */}
          <div className="relative z-10 w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30 group-hover:shadow-yellow-500/50 transition-all duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>

            {/* Notification badge */}
            {friendRequestsList.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {friendRequestsList.length}
              </span>
            )}
          </div>

          {/* Floating animation elements */}
          <div className="absolute -inset-2 rounded-full bg-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping-slow"></div>

          {/* Glow effect */}
          <div className="absolute -inset-1 rounded-full bg-yellow-400/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Tooltip */}
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-slate-800/90 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Friends Hub
          <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800/90 rotate-45"></div>
        </div>
      </motion.button>

      {/* Add Friend Modal */}
      {addFriendModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 w-full max-w-md rounded-2xl shadow-xl border border-white/10 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={() => setAddFriendModalOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200 z-10"
            >
              &times;
            </button>

            {/* Header */}
            <div className="p-6 pb-0">
              <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent text-center mb-2">
                Friends Hub
              </h1>
              <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6"></div>
            </div>

            <div className="px-6 pb-6">
              {/* Add Friends Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Add New Friend
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Trainer Username"
                    value={friendUsername}
                    onChange={(e) => setFriendUsername(e.target.value)}
                    className="flex-1 p-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <button
                    onClick={() => handleSendFriendRequest()}
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold px-4 rounded-xl transition-all flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex justify-between items-center mb-6 bg-slate-800/50 rounded-xl p-1 border border-white/10">
                <button
                  onClick={() => {
                    selectFriends(true);
                    selectFriendRequests(false);
                    selectSentRequest(false);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                    friends
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "text-yellow-300 hover:text-white"
                  }`}
                >
                  Friends
                </button>
                <button
                  onClick={() => {
                    selectFriendRequests(true);
                    selectFriends(false);
                    selectSentRequest(false);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                    friendRequests
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "text-yellow-300 hover:text-white"
                  }`}
                >
                  Requests
                </button>
                <button
                  onClick={() => {
                    selectFriendRequests(false);
                    selectFriends(false);
                    selectSentRequest(true);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                    sentRequest
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "text-yellow-300 hover:text-white"
                  }`}
                >
                  Sent
                </button>
              </div>

              {/* Content Sections */}
              <div className="max-h-96 overflow-y-auto pr-2">
                {/* Friends List */}
                {friends && (
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Your Friends
                    </h3>
                    {friendList.length === 0 ? (
                      <div className="bg-slate-800/30 rounded-xl p-6 text-center border border-dashed border-white/20">
                        <p className="text-white/70">No friends yet!</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {friendList.map((friend, index) => (
                          <motion.li
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex justify-between items-center"
                          >
                            <span className="font-medium text-white">
                              {friend.friend?.username ?? "Unknown User"}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Friend Requests */}
                {friendRequests && (
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      Pending Requests
                    </h3>
                    {friendRequestsList.length === 0 ? (
                      <div className="bg-slate-800/30 rounded-xl p-6 text-center border border-dashed border-white/20">
                        <p className="text-white/70">No pending requests!</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {friendRequestsList.map((request, index) => (
                          <motion.li
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-white">
                                {request.sender.username}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
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
                                          (r) =>
                                            r.sender.id !== request.sender.id
                                        )
                                      );
                                    } else {
                                      alert("Failed to accept friend request.");
                                    }
                                  }}
                                  className="bg-green-500/90 hover:bg-green-400 text-white font-semibold py-1 px-3 rounded-lg flex items-center gap-1 transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  Accept
                                </button>
                                <button
                                  onClick={async () => {
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
                                          (r) =>
                                            r.sender.id !== request.sender.id
                                        )
                                      );
                                    } else {
                                      alert("Failed to reject friend request.");
                                    }
                                  }}
                                  className="bg-red-500/90 hover:bg-red-400 text-white font-semibold py-1 px-3 rounded-lg flex items-center gap-1 transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                  Reject
                                </button>
                              </div>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Sent Requests */}
                {sentRequest && (
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Sent Requests
                    </h3>
                    {sentRequestsList.length === 0 ? (
                      <div className="bg-slate-800/30 rounded-xl p-6 text-center border border-dashed border-white/20">
                        <p className="text-white/70">No sent requests!</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {sentRequestsList.map((request, index) => (
                          <motion.li
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-white">
                                {request.receiver.username}
                              </span>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-sm px-2 py-1 rounded-full ${
                                    request.status === "PENDING"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : request.status === "ACCEPTED"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-red-500/20 text-red-400"
                                  }`}
                                >
                                  {request.status}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Sent{" "}
                              {new Date(request.createdAt).toLocaleString()}
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 mb-6">
        <h1 className="text-xl font-bold">
          {`Welcome back, ${session?.user?.name || "Trainer"}!`}
        </h1>
        <Link href="/user/profile/viewProfile">
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-15 h-15 rounded-full border-2 border-yellow-400 cursor-pointer"
          />
        </Link>
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
              href="/user/packs"
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
    </main>
  );
}
