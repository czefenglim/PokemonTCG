'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';

type GemContextType = {
  gems: number | undefined;
  setGems: (value: number) => void;
  gemsLoading: boolean;
};

const GemContext = createContext<GemContextType | undefined>(undefined);

export function GemProvider({ children }: { children: ReactNode }) {
  const [gems, setGems] = useState<number | undefined>(undefined);
  const [gemsLoading, setGemsLoading] = useState(true);

  const { status } = useSession(); // ✅ 2. Add this line HERE

  useEffect(() => {
    if (status !== 'authenticated') return; // ✅ 3. Prevent fetch if not logged in

    async function fetchGems() {
      try {
        console.log('[GemContext] 🔄 Fetching gems from /api/packs/status...');
        const res = await fetch('/api/packs/status');
        const data = await res.json();
        console.log('[GemContext] 🧾 API Response:', data);

        if (typeof data.gems === 'number') {
          console.log('[GemContext] ✅ Setting gems to:', data.gems);
          setGems(data.gems);
        } else {
          console.warn('[GemContext] ⚠️ data.gems is not a number:', data.gems);
        }
      } catch (error) {
        console.error('[GemContext] ❌ Failed to fetch gems:', error);
      } finally {
        console.log(
          '[GemContext] ✅ Finished fetching. Setting gemsLoading = false'
        );
        setGemsLoading(false);
      }
    }

    fetchGems();
  }, [status]); // ✅ 4. Add status as dependency

  return (
    <GemContext.Provider value={{ gems, setGems, gemsLoading }}>
      {children}
    </GemContext.Provider>
  );
}

export function useGems() {
  const context = useContext(GemContext);
  if (!context) {
    throw new Error('useGems must be used within a GemProvider');
  }
  return context;
}
