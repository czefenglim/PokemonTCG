"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SelectFriendPage() {
  const [friendList, setFriendList] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleTradeClick = () => {
    router.push("/tradeCards/selectCard"); // ✅ Navigates correctly
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch("../api/friends/getFriendList");
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
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 py-10 px-4 flex flex-col items-center text-yellow-300">
      <h1 className="text-4xl font-bold text-yellow-300 mb-12 drop-shadow-md text-center">
        Select a Friend to Trade
      </h1>

      {loading && (
        <p className="text-gray-400 italic mb-4">Loading friends...</p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full px-4">
        {friendList.map((friend, index) => (
          <li key={index}>
            <div className="w-2/3 mx-auto border border-yellow-500 rounded-lg p-4 bg-white/10 hover:bg-white/20 transition-colors flex justify-between items-center">
              <span className="text-lg font-semibold text-yellow-300">
                {friend.friend?.username}
              </span>
              <button
                className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
                onClick={() => {
                  setSelectedFriend(friend.friend?.id);
                  handleTradeClick();
                }}
              >
                Trade
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
