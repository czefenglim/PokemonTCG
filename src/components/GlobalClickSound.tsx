'use client';
import { useEffect, useRef } from 'react';

export default function GlobalClickSound() {
  const audioBuffer = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload audio once
    const audio = new Audio('/sfx/click.mp3');
    audio.volume = 0.6;
    audio.preload = 'auto';

    // Preload silently to warm up the decoder
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {});

    audioBuffer.current = audio;

    const playSound = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.closest('button, a, [role="button"], [data-sfx="true"]');

      if (isInteractive && audioBuffer.current) {
        const clonedAudio = audioBuffer.current.cloneNode() as HTMLAudioElement;
        clonedAudio.currentTime = 0;
        clonedAudio.play().catch((err) => {
          console.warn('🔇 Audio play blocked:', err);
        });
      }
    };

    document.addEventListener('click', playSound);
    return () => document.removeEventListener('click', playSound);
  }, []);

  return null;
}
