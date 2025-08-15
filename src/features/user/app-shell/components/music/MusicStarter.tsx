'use client';
import { useEffect } from 'react';
import { useMusic } from '@/features/user/music/contexts/MusicContext';

export default function MusicStarter() {
  const { play, isPlaying } = useMusic();

  useEffect(() => {
    // Try immediately (works if flag is set and browser allows)
    play().catch(() => {});

    // Fallback: start on first interaction if blocked
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
  }, [play, isPlaying]);

  return null;
}
