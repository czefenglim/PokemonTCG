'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { lazy, Suspense } from 'react';

// Lazy load Sidebar only when needed
const Sidebar = lazy(() => import('@/components/Sidebar'));

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

  const hideSidebarRoutes = ['/', '/login', '/register'];
  const shouldHideSidebar = hideSidebarRoutes.includes(pathname);

  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen text-white">
      <Suspense fallback={<div className="w-64 bg-gray-800 animate-pulse" />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1">{children}</main>
    </div>
  );
}
