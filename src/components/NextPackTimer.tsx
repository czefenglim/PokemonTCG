'use client';
import { useEffect, useState } from 'react';

export function NextPackTimer() {
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 min

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');

  return (
    <span>
      Next pack in {minutes}:{seconds}
    </span>
  );
}
