'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

type MusicContextType = {
  isPlaying: boolean;
  play: () => Promise<void>; // <- make it async/Promise
  pause: () => void;
};
const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const shouldAutoPlay = localStorage.getItem('shouldAutoPlayMusic');

    if (shouldAutoPlay === 'true' && audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          localStorage.removeItem('shouldAutoPlayMusic'); // ✅ prevent repeat
        })
        .catch((err) => {
          console.warn('🎵 Autoplay blocked:', err);
        });
    }
  }, []);

  const play = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      await el.play();
      setIsPlaying(true); // or rely on 'play' event
    } catch (err) {
      console.warn('Play error:', err);
      throw err; // let callers handle autoplay block
    }
  }, []);

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  return (
    <MusicContext.Provider value={{ isPlaying, play, pause }}>
      <audio ref={audioRef} loop>
        <source src="/audio/background-music.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
