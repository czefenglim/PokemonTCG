'use client';

import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

type Pack = {
  id: string;
  name: string;
  image: string;
};

interface Props {
  packs: Pack[];
  onSelect: (id: string) => void;
}

export default function PackCarousel({ packs, onSelect }: Props) {
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    mode: 'snap',
    slides: {
      perView: 3,
      spacing: 20,
    },
    centered: true,
  });

  return (
    <div className="w-full max-w-3xl py-6 mx-auto">
      <div ref={sliderRef} className="keen-slider">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="keen-slider__slide flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
            onClick={() => onSelect(pack.id)}
          >
            <img
              src={pack.image}
              alt={pack.name}
              className="w-32 h-48 object-contain rounded-lg shadow-md"
            />
            <p className="text-yellow-200 mt-2 font-medium">{pack.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
