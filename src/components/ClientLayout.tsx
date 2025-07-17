'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

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
    // During SSR, render nothing or a loading state
    return null;
  }

  // Define routes where Sidebar should be hidden
  const hideSidebarRoutes = ['/', '/login', '/register'];
  const shouldHideSidebar = hideSidebarRoutes.includes(pathname);

  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  return (
    <div
      className="flex min-h-screen bg-gradient-to-br from-[#2c2c2c] via-[#7c3aed] to-black
 text-white"
    >
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
