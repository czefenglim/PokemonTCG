'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useMusic } from '@/features/user/music/contexts/MusicContext';

export default function AuthenticatedMusicStarter() {
  const { status } = useSession();
  const { play, isPlaying, userPaused } = useMusic(); // ✅ add userPaused from context

  useEffect(() => {
    if (status !== 'authenticated' || userPaused) return; // ✅ don't autoplay if user paused

    // try to start immediately
    play().catch(() => {
      /* autoplay blocked, fallback below */
    });

    // fallback: start on first interaction if blocked
    const go = async () => {
      if (!isPlaying && !userPaused) {
        // ✅ respect user pause
        try {
          await play();
        } catch {}
      }
      cleanup();
    };
    const cleanup = () => {
      document.removeEventListener('pointerdown', go);
      document.removeEventListener('keydown', go);
      document.removeEventListener('touchstart', go);
    };
    document.addEventListener('pointerdown', go, { once: true });
    document.addEventListener('keydown', go, { once: true });
    document.addEventListener('touchstart', go, { once: true });
    return cleanup;
  }, [status, play, isPlaying, userPaused]);

  return null;
}
