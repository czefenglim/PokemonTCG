"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { SocketProvider } from "@/../contexts/SocketContext";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const hideSidebarRoutes = ["/", "/login", "/register"];
  const shouldHideSidebar = hideSidebarRoutes.includes(pathname);

  return (
    <SocketProvider>
      {" "}
      {/* ✅ Wrap everything inside here */}
      {shouldHideSidebar ? (
        <>{children}</>
      ) : (
        <div className="flex min-h-screen bg-gradient-to-br from-[#2c2c2c] via-[#7c3aed] to-black text-white">
          <Sidebar />
          <main className="flex-1">{children}</main>
        </div>
      )}
    </SocketProvider>
  );
}
