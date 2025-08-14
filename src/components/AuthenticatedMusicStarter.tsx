'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useMusic } from '@/context/MusicContext';

export default function AuthenticatedMusicStarter() {
  const { status } = useSession();
  const { play, isPlaying } = useMusic();

  useEffect(() => {
    if (status !== 'authenticated') return;

    // try to start immediately
    play().catch(() => {
      /* autoplay blocked, fallback below */
    });

    // fallback: start on first interaction if blocked
    const go = async () => {
      if (!isPlaying) {
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
  }, [status, play, isPlaying]);

  return null;
}
