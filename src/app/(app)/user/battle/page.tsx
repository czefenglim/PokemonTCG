"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sword, ShieldCheck } from "lucide-react";

export default function ArenaPage() {
  const router = useRouter();

  const handleNavigate = (mode: "pvp" | "pve") => {
    router.push(`/user/battle/${mode}`);
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-yellow-400 opacity-20"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              width: Math.random() * 10 + 5,
              height: Math.random() * 10 + 5,
            }}
            animate={{
              x: [null, Math.random() * window.innerWidth],
              y: [null, Math.random() * window.innerHeight],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-white text-center w-full max-w-4xl">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold mb-4 text-yellow-400 drop-shadow-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            BATTLE ARENA
          </motion.h1>
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* PvP Card */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -10 }}
            className="relative cursor-pointer"
            onClick={() => handleNavigate("pvp")}
          >
            <div className="absolute -inset-1 bg-red-500 rounded-xl blur-md opacity-75"></div>
            <div className="relative bg-gradient-to-b from-red-600 to-red-800 p-8 rounded-xl h-full flex flex-col items-center justify-center border-2 border-yellow-400 shadow-lg">
              <div className="bg-white/20 rounded-full p-4 mb-6">
                <Sword className="w-12 h-12 text-yellow-300" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-yellow-300">PvP</h2>
            </div>
          </motion.div>

          {/* PvE Card */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -10 }}
            className="relative cursor-pointer"
            onClick={() => handleNavigate("pve")}
          >
            <div className="absolute -inset-1 bg-blue-500 rounded-xl blur-md opacity-75"></div>
            <div className="relative bg-gradient-to-b from-blue-600 to-blue-800 p-8 rounded-xl h-full flex flex-col items-center justify-center border-2 border-yellow-400 shadow-lg">
              <div className="bg-white/20 rounded-full p-4 mb-6">
                <ShieldCheck className="w-12 h-12 text-yellow-300" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-yellow-300">PvE</h2>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-16 bg-black/30 rounded-xl p-6 mx-auto border border-yellow-400/30 max-w-xl"
        >
          <p className="text-yellow-300 text-lg font-medium">
            Choose your battle style! Will you challenge other trainers or test
            your skills against powerful opponents?
          </p>
          <div className="flex justify-center gap-6 mt-6">
            {["⚔️", "🛡️", "🎯"].map((icon, i) => (
              <motion.div
                key={i}
                className="text-2xl"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              >
                {icon}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
