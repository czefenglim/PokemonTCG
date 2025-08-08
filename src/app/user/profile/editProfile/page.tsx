// app/editProfile/page.js
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  email?: string;
  gems?: number;
  role?: string;
  createdAt?: string;
  username?: string;
  walletAddress?: string;
  profilePicture?: string; // Add this line
};

export default function EditProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    walletAddress: "",
    profilePicture: "",
    country: "", // Add this line
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const avatars = [
    "https://i.pinimg.com/564x/59/40/1c/59401cad1047716d7a916cae339dbf6b.jpg", // Ash
    "https://preview.redd.it/put-my-avatar-in-a-misty-costume-for-halloween-v0-ewqonnongywd1.jpg?width=640&crop=smart&auto=webp&s=4e087c62f463302167a9199e38ea368d9e878485", // Misty
    "https://imagedelivery.net/LBWXYQ-XnKSYxbZ-NuYGqQ/fee497b1-bf1e-44d0-b99c-ab256e6b8d00/avatarhd", // Brock
    "https://cdn.costumewall.com/wp-content/uploads/2016/10/serena-pokemon-costume.jpg", // Serena
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsX070csr2Qhcc4sIfOG5M6L8zLiAExUA6vA&s", // Gary
    "https://i.pinimg.com/736x/64/68/8d/64688d41df504d52071fd84852356ecb.jpg", // Professor Oak
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1BL3FlC2xopRJ43DV2hCy1VtkPqS0eGKtIw&s", // Nurse Joy
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5ymgO-66nRZS9gcstj6Dp5ayW61hRTnIu-w&s", // Meow meow
    "https://image1.gamme.com.tw/news2/2016/05/77/qZqYnaSYk6Kap6Q.jpg", // Musashi
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIwG39-AGz0YIc4wZsP-Y65yiBzXYS-H43dA&s", // James
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRH_keIoiDLL1bfJF2ZGTvFA6BvTvneJIFWAdafOurP_3qxj9qmWnoZIqMT97bnZtlkJU&usqp=CAU", // Wobbuffet
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile/viewProfile");
      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        setFormData({
          username: data.username || "",
          walletAddress: data.walletAddress || "",
          profilePicture: data.profilePicture || "",
          country: data.country || "", // Make sure this matches your API response
        });
      } else {
        setError(data.error || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          setFormData((prev) => ({
            ...prev,
            walletAddress: accounts[0],
          }));
          setSuccess("Wallet connected successfully!");
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet. Please try again.");
      }
    } else {
      setError(
        "MetaMask is not installed. Please install MetaMask to connect your wallet."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/profile/editProfile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          walletAddress: formData.walletAddress,
          profilePicture: formData.profilePicture,
          country: formData.country,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      setProfile(data);

      // Redirect after 1.5 seconds to show success message
      setTimeout(() => {
        router.push("/user/profile/viewProfile");
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 text-center bg-slate-800/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-300 text-lg font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 px-4 py-10">
        {/* Enhanced Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in">
            Edit Trainer Profile
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Customize your Pokémon TCG trainer identity and settings
          </p>
        </div>

        {/* Main Edit Form Card */}
        <div className="max-w-6xl mx-auto bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Form Header with Gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 px-8 py-6 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 left-4 w-32 h-32 border border-white/20 rounded-full"></div>
              <div className="absolute top-8 right-8 w-24 h-24 border border-white/20 rounded-full"></div>
              <div className="absolute bottom-4 left-1/2 w-16 h-16 border border-white/20 rounded-full"></div>
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Profile Details
              </h2>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Status Messages */}
              {success && (
                <div className="bg-green-900/30 border border-green-500/50 text-green-400 p-4 rounded-xl flex items-center backdrop-blur-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {success}
                </div>
              )}
              {error && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center backdrop-blur-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}
              {/* Avatar Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  Trainer Avatar
                </label>
                <div className="flex flex-col items-center">
                  <div
                    className="relative group w-24 h-24 rounded-full border-4 border-yellow-400 shadow-lg cursor-pointer transition-all duration-300 hover:border-yellow-300 hover:shadow-yellow-500/50 mb-2"
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                  >
                    {formData.profilePicture ? (
                      <img
                        src={formData.profilePicture}
                        alt="Trainer Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl">
                        {formData.username
                          ? formData.username.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300">
                      <svg
                        className="w-8 h-8 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarSelector(true)}
                    className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    Change Avatar
                  </button>
                </div>
              </div>
              {/* Avatar Selector Modal */}
              {showAvatarSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="relative bg-slate-800 rounded-2xl border border-yellow-500/30 shadow-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-yellow-400">
                        Choose Your Trainer Avatar
                      </h3>
                      <button
                        onClick={() => setShowAvatarSelector(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {avatars.map((avatar, index) => (
                        <div
                          key={index}
                          className={`relative rounded-full border-4 cursor-pointer transition-all duration-200 ${
                            formData.profilePicture === avatar
                              ? "border-yellow-400 scale-105"
                              : "border-transparent hover:border-yellow-300 hover:scale-105"
                          }`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              profilePicture: avatar,
                            }));
                            setShowAvatarSelector(false);
                          }}
                        >
                          <img
                            src={avatar}
                            alt={`Avatar ${index}`}
                            className="w-full h-full rounded-full object-cover aspect-square"
                          />
                          {formData.profilePicture === avatar && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                              <svg
                                className="w-8 h-8 text-yellow-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => setShowAvatarSelector(false)}
                        className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-300"
                      >
                        Confirm Selection
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Country Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Country
                </label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-green-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="relative w-full px-4 py-3 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-white appearance-none"
                    required
                  >
                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="JP">Japan</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="BR">Brazil</option>
                    <option value="IN">India</option>
                    <option value="SG">Singapore</option>
                    <option value="MY">Malaysia</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Username Field */}
              <div className="space-y-4">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-slate-300"
                >
                  Trainer Name *
                </label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    minLength={3}
                    maxLength={50}
                    className="relative w-full px-4 py-3 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-slate-400"
                    placeholder="Enter your trainer name"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-slate-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  This will be your display name in the Pokémon TCG community
                </p>
              </div>
              {/* Wallet Address Field */}
              <div className="space-y-4">
                <label
                  htmlFor="walletAddress"
                  className="block text-sm font-medium text-slate-300"
                >
                  Digital Wallet
                </label>
                <div className="flex space-x-3">
                  <div className="relative flex-grow group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                    <input
                      type="text"
                      id="walletAddress"
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleInputChange}
                      className="relative w-full px-4 py-3 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm transition-all text-white placeholder-slate-400"
                      placeholder="0x..."
                    />
                    {formData.walletAddress && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Connect your wallet to trade Pokémon cards and collectibles
                </p>
              </div>
              {/* Current Profile Info */}
              <div className="bg-slate-700/50 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  CURRENT TRAINER STATS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-800/70 p-4 rounded-lg shadow-sm border border-white/5">
                    <div className="text-slate-400 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Email
                    </div>
                    <p className="text-white font-medium mt-1">
                      {profile?.email}
                    </p>
                  </div>
                  <div className="bg-slate-800/70 p-4 rounded-lg shadow-sm border border-white/5">
                    <div className="text-slate-400 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Gems
                    </div>
                    <p className="text-white font-medium mt-1 flex items-center">
                      <span className="text-yellow-400 mr-1">💎</span>
                      {profile?.gems?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-800/70 p-4 rounded-lg shadow-sm border border-white/5">
                    <div className="text-slate-400 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Role
                    </div>
                    <p className="text-white font-medium mt-1 capitalize">
                      {profile?.role}
                    </p>
                  </div>
                  <div className="bg-slate-800/70 p-4 rounded-lg shadow-sm border border-white/5">
                    <div className="text-slate-400 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Member Since
                    </div>
                    <p className="text-white font-medium mt-1">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button
                  type="submit"
                  disabled={saving}
                  className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-70 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 flex-1"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {saving ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 group-hover:animate-bounce"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                          />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                </button>

                <Link
                  href="/user/profile/viewProfile"
                  className="relative overflow-hidden group bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-slate-500/30 flex-1 text-center"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 group-hover:animate-bounce"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel
                  </span>
                  <span className="absolute inset-0 bg-slate-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/10">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Trainer Tips
            </h3>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 bg-amber-400/20 text-amber-400 rounded-full p-2 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span className="text-slate-300">
                  Your trainer name will be visible to other players in battles
                  and trades
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 bg-amber-400/20 text-amber-400 rounded-full p-2 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span className="text-slate-300">
                  Connect your wallet to participate in the Pokémon TCG NFT
                  marketplace
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 bg-amber-400/20 text-amber-400 rounded-full p-2 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span className="text-slate-300">
                  Earn more gems by completing daily challenges and winning
                  battles
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
