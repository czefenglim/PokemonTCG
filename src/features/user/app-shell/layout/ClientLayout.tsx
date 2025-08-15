'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { lazy, Suspense } from 'react';
import { SocketProviderWrapper } from '@/features/user/battle-pvp/contexts/SocketProviderWrapper';

// Lazy load Sidebar only when needed
const Sidebar = lazy(
  () => import('@/features/user/app-shell/components/sidebar/Sidebar')
);

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

  // Define routes where Sidebar should be hidden
  const shouldHideSidebar =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/user/battle/pve/battle/'); // <-- key change

  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  // return (
  //   <div className="flex min-h-screen text-white">
  //     <Suspense fallback={<div className="w-64 bg-gray-800 animate-pulse" />}>
  //       <Sidebar />
  //     </Suspense>
  //     <main className="flex-1">{children}</main>
  //   </div>
  // );

  return (
    <SocketProviderWrapper>
      {shouldHideSidebar ? (
        <>{children}</>
      ) : (
        <div className="flex min-h-screen text-white">
          <Suspense
            fallback={<div className="w-64 bg-gray-800 animate-pulse" />}
          >
            <Sidebar />
          </Suspense>
          <main className="flex-1">{children}</main>
        </div>
      )}
    </SocketProviderWrapper>
  );
}
