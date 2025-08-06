// app/viewProfile/page.js
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ViewProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  type Profile = {
    username?: string;
    email: string;
    role: string;
    createdAt: string;
    gems: number;
    friendCount?: number;
    nextPackAt: string;
    walletAddress?: string;
  };

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatWalletAddress = (address) => {
    if (!address) return "Not connected";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCopyWallet = async () => {
    if (profile?.walletAddress) {
      await navigator.clipboard.writeText(profile.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getNextPackStatus = () => {
    if (!profile?.nextPackAt)
      return { text: "Unknown", color: "gray", bgColor: "bg-gray-100" };

    const nextPackTime = new Date(profile.nextPackAt);
    const now = new Date();

    if (nextPackTime <= now) {
      return {
        text: "Available Now! 🎉",
        color: "text-green-600",
        bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
        pulse: true,
      };
    } else {
      const hoursLeft = Math.ceil(
        (nextPackTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      );
      return {
        text: `${hoursLeft}h remaining`,
        color: "text-blue-600",
        bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
      };
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center bg-slate-800/70 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Profile Loading Error
          </h2>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={fetchProfile}
            className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="group-hover:animate-bounce">🔄</span>
              Try Again
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative z-10 text-center bg-slate-800/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <p className="text-slate-300 text-lg">Profile not found</p>
        </div>
      </div>
    );
  }

  const nextPackStatus = getNextPackStatus();

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
            Trainer Profile
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Your personal dashboard for managing your Pokémon TCG collection and
            account
          </p>
        </div>

        {/* Main Profile Card */}
        <div className="max-w-6xl mx-auto bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Profile Header with Gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 px-8 py-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 left-4 w-32 h-32 border border-white/20 rounded-full"></div>
              <div className="absolute top-8 right-8 w-24 h-24 border border-white/20 rounded-full"></div>
              <div className="absolute bottom-4 left-1/2 w-16 h-16 border border-white/20 rounded-full"></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Avatar with Animation */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative w-32 h-32 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                  <span className="text-5xl font-bold text-white">
                    {profile.username
                      ? profile.username.charAt(0).toUpperCase()
                      : profile.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-400 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-lg">
                  <div className="w-4 h-4 bg-green-600 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="text-white text-center md:text-left">
                <h2 className="text-4xl font-bold mb-2">
                  {profile.username || "Pokémon Trainer"}
                </h2>
                <p className="text-blue-200 text-lg mb-4">{profile.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full text-sm font-medium border border-white/30 hover:bg-white/30 transition-all duration-300">
                    {profile.role}
                  </span>
                  <span className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm px-5 py-2 rounded-full text-sm font-medium border border-yellow-300/30 hover:from-yellow-400/30 hover:to-orange-400/30 transition-all duration-300">
                    ⭐ Premium Member
                  </span>
                  {profile.walletAddress && (
                    <span className="bg-gradient-to-r from-purple-400/20 to-pink-400/20 backdrop-blur-sm px-5 py-2 rounded-full text-sm font-medium border border-purple-300/30 hover:from-purple-400/30 hover:to-pink-400/30 transition-all duration-300">
                      🔗 Wallet Connected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            {/* Stats Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {/* Gems Card */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-amber-300">
                      Gems
                    </h3>
                    <div className="text-4xl">💎</div>
                  </div>
                  <p className="text-4xl font-bold text-amber-400 mb-2">
                    {profile.gems.toLocaleString()}
                  </p>
                  <p className="text-amber-300/70 text-sm">Premium currency</p>
                </div>
              </div>

              {/* Friends Card */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-emerald-300">
                      Friends
                    </h3>
                    <div className="text-4xl">👥</div>
                  </div>
                  <p className="text-4xl font-bold text-emerald-400 mb-2">
                    {profile.friendCount || 0}
                  </p>
                  <p className="text-emerald-300/70 text-sm">
                    Trading partners
                  </p>
                </div>
              </div>

              {/* Next Pack Card */}
              <div
                className={`relative group ${
                  nextPackStatus.pulse ? "animate-pulse" : ""
                }`}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                <div
                  className={`relative h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-300">
                      Next Pack
                    </h3>
                    <div className="text-4xl">📦</div>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      nextPackStatus.text.includes("🎉")
                        ? "text-green-400"
                        : "text-blue-400"
                    } mb-2`}
                  >
                    {nextPackStatus.text}
                  </p>
                  <p className="text-blue-300/70 text-sm">Card pack reward</p>
                </div>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-lg mr-3">
                    👤
                  </span>
                  Personal Information
                </h3>

                <div className="space-y-4">
                  {/* Username Card */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                    <div className="relative bg-slate-700/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                      <label className="block text-sm font-semibold text-blue-300 mb-2">
                        Username
                      </label>
                      <p className="text-white font-medium text-xl">
                        {profile.username || "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Email Card */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                    <div className="relative bg-slate-700/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                      <label className="block text-sm font-semibold text-purple-300 mb-2">
                        Email
                      </label>
                      <p className="text-white font-medium text-xl break-all">
                        {profile.email}
                      </p>
                    </div>
                  </div>

                  {/* Member Since Card */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                    <div className="relative bg-slate-700/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                      <label className="block text-sm font-semibold text-cyan-300 mb-2">
                        Member Since
                      </label>
                      <p className="text-white font-medium text-xl">
                        {formatDate(profile.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockchain Wallet Section */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-lg mr-3">
                    🔗
                  </span>
                  Blockchain Wallet
                </h3>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                  <div className="relative bg-slate-700/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                    <label className="block text-sm font-semibold text-purple-300 mb-3">
                      Wallet Address
                    </label>
                    {profile.walletAddress ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg blur opacity-10"></div>
                          <p className="relative text-white font-mono text-lg bg-slate-800/80 p-4 rounded-lg border border-white/10">
                            {formatWalletAddress(profile.walletAddress)}
                          </p>
                        </div>
                        <button
                          onClick={handleCopyWallet}
                          className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200 group"
                        >
                          <span className="relative">
                            <span className="relative z-10 block w-6 h-6">
                              {copied ? "✅" : "📋"}
                            </span>
                            <span className="absolute inset-0 bg-purple-500/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></span>
                          </span>
                          <span>
                            {copied ? "Copied!" : "Copy full address"}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-slate-400 mb-4">
                          No wallet connected
                        </p>
                        <button className="relative overflow-hidden group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <span className="group-hover:animate-bounce">
                              🔗
                            </span>
                            Connect Wallet
                          </span>
                          <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-12 pt-8 border-t border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/profile/editProfile"
                  className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-5 px-6 rounded-xl text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-xl group-hover:animate-bounce">
                      ✏️
                    </span>
                    Edit Profile
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                </Link>

                <Link
                  href="/marketplace"
                  className="relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-5 px-6 rounded-xl text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/30"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-xl group-hover:animate-bounce">
                      🃏
                    </span>
                    View My Cards
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                </Link>

                <Link
                  href="/dashboard"
                  className="relative overflow-hidden group bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white font-semibold py-5 px-6 rounded-xl text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-slate-500/30"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-xl group-hover:animate-bounce">
                      🏠
                    </span>
                    Dashboard
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-slate-500 to-gray-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                </Link>
              </div>
            </div>
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
