// hooks/useClickSound.ts
'use client';
import { useRef } from 'react';

export default function useClickSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio('/sfx/click.mp3');
    audioRef.current.volume = 0.4;
  }

  const playClick = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  return playClick;
}
