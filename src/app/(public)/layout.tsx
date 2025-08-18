// FILE: \app\(public)\layout.tsx - Public Routes Layout
// Description: Layout wrapper for all public-facing pages (landing, about, etc.)

import AboutDialogController from '@/features/public/landingpage/components/AboutDialogController';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-black text-white">
      <main className="flex-1">{children}</main>
      <AboutDialogController /> {/* ← mounts the About modal */}
    </div>
  );
}
