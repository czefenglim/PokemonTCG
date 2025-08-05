"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react"; // You can replace with any icons

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/home", label: "Home", icon: "🏠" },
    { href: "/packs", label: "Packs", icon: "📦" },
    { href: "/marketplace", label: "Marketplace", icon: "🛒" },
    { href: "/collection", label: "Collection", icon: "📂" },
    { href: "/buy-gems", label: "Buy Gems", icon: "💎" },
    { href: "/tradeCards", label: "Trade Cards", icon: "🔄" },
  ];

  return (
    <aside
      className={clsx(
        "min-h-screen flex flex-col border-r border-white/10 px-4 py-10 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 mb-8 px-2 text-white hover:bg-white/5 rounded-lg transition w-full justify-between"
      >
        <div className="flex items-center gap-2">
          {!collapsed && (
            <span className="text-lg font-extrabold text-yellow-400 tracking-wide">
              Pokémon TCG
            </span>
          )}
        </div>
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Navigation */}
      <nav className="flex flex-col gap-3 mb-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "group flex items-center gap-3 px-3 py-2 rounded-lg relative transition-all duration-200",
              pathname === item.href
                ? "bg-white/5 text-yellow-300 font-semibold"
                : "text-white/80 hover:bg-white/5"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-white/10 my-4" />

      {/* Gems Balance */}
      {!collapsed && (
        <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg mb-4">
          <span className="text-yellow-300 font-medium">💎 Gems</span>
          <span className="font-semibold text-white">500</span>
        </div>
      )}

      {/* Connect Button */}
      <div className="mb-6">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== "loading";
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === "authenticated");

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
                className="w-full"
              >
                {connected ? (
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 w-full rounded-lg transition",
                      collapsed
                        ? "justify-center bg-white/5 hover:bg-white/10"
                        : "justify-between bg-white/5 hover:bg-white/10"
                    )}
                  >
                    {collapsed ? (
                      // Compact avatar only
                      <span>{account.displayName?.[0]}</span>
                    ) : (
                      <>
                        <span>{account.displayName}</span>
                        <span className="text-xs text-white/60">
                          {chain.name}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className={clsx(
                      "flex items-center justify-center px-3 py-2 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition",
                      collapsed && "justify-center"
                    )}
                  >
                    {collapsed ? "🔗" : "Connect Wallet"}
                  </button>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>

      <div className="flex-1" />

      {!collapsed && (
        <div className="fixed bottom-6 left-4 w-60 z-50">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-blue-400 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-200"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
