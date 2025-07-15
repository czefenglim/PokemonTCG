// app/dashboard/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [friendUsername, setFriendUsername] = useState("");
  const router = useRouter();
  const [friendRequests, selectFriendRequests] = useState(false);
  const [friends, selectFriends] = useState(true);
  const [friendList, setFriendList] = useState<any[]>([]);
  const [friendRequestsList, setFriendRequestsList] = useState<any[]>([]);
  const [sentRequestsList, setSentRequestsList] = useState<any[]>([]);
  const [sentRequest, selectSentRequest] = useState(false);

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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.4,
        ease: "easeOut" as const,
      },
    }),
  };

  if (status === "loading") {
    return <p className="text-yellow-200">Loading...</p>;
  }

  if (status === "unauthenticated") {
    return <p className="text-red-400">You must be logged in.</p>;
  }

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
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 py-10 px-4 flex flex-col items-center relative">
      <UserPlusIcon
        className="absolute top-4 right-4 w-10 h-10 text-yellow-300 cursor-pointer"
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-8"
      >
        <div className="flex items-center gap-4">
          <img
            src="https://images.pokemontcg.io/base1/58.png"
            alt="Trainer Avatar"
            className="w-16 h-16 rounded-full border-2 border-yellow-400"
          />
          <div>
            <h1 className="text-3xl font-bold text-yellow-300">
              {session?.user?.name
                ? `Welcome, ${session.user.name}`
                : "Welcome, Trainer"}
            </h1>
            <p className="text-yellow-200 text-sm">
              Your Pokémon adventure begins here.
            </p>
          </div>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <div className="bg-yellow-500/10 border border-yellow-400 px-4 py-2 rounded-lg text-yellow-200">
            Gems: <span className="font-semibold">120</span>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-400 px-4 py-2 rounded-lg text-yellow-200">
            Next Pack: <span className="font-semibold">2h 15m</span>
          </div>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {[
          {
            title: "Open Card Pack",
            desc: "Reveal new cards and expand your collection.",
            img: "4.png",
            href: "/packs",
          },
          {
            title: "Marketplace",
            desc: "Buy and sell cards with other trainers.",
            img: "2.png",
            href: "/marketplace",
          },
          {
            title: "My Inventory",
            desc: "View all cards you own.",
            img: "5.png",
            href: "/inventory",
          },
          {
            title: "PvE Battle",
            desc: "Challenge AI opponents for rewards.",
            img: "15.png",
            href: "/game/pve",
          },
          {
            title: "PvP Battle",
            desc: "Compete against other trainers in real time.",
            img: "7.png",
            href: "/game/pvp",
          },
        ].map((card, i) => (
          <motion.button
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(card.href)}
            className="group bg-gradient-to-br from-yellow-600/20 to-yellow-400/10 border border-yellow-500/40 rounded-xl shadow-lg p-6 flex flex-col items-center focus:outline-none"
          >
            <motion.img
              src={`https://images.pokemontcg.io/base1/${card.img}`}
              alt={card.title}
              className="w-24 mb-4"
              whileHover={{ rotate: 5 }}
              transition={{ type: "spring", stiffness: 200 }}
            />
            <h2 className="text-lg font-semibold text-yellow-200">
              {card.title}
            </h2>
            <p className="text-sm text-yellow-100 opacity-80">{card.desc}</p>
          </motion.button>
        ))}
      </div>
    </main>
  );
}
