'use client';

import { useEffect, useRef } from 'react';
import VanillaTilt from 'vanilla-tilt';

type TiltCardProps = {
  imageUrl: string;
  name: string;
  onClick?: () => void;
};

export default function TiltCard({ imageUrl, name, onClick }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      VanillaTilt.init(cardRef.current, {
        max: 25,
        speed: 400,
        glare: true,
        'max-glare': 0.3,
      });
    }
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="relative cursor-pointer w-full aspect-[3/4] rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-yellow-100 to-yellow-300"
    >
      <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
        <p className="text-white font-semibold">{name}</p>
      </div>
    </div>
  );
}
