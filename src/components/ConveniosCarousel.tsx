'use client';

import { useEffect, useState } from 'react';
import ConvenioBanner from '@/components/ConvenioBanner';
import { Convenio } from '@/types';

interface ConveniosCarouselProps {
  convenios: Convenio[];
}

const CAROUSEL_INTERVAL_MS = 4000;
const FADE_DURATION_MS = 250;

export default function ConveniosCarousel({
  convenios,
}: ConveniosCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const showConvenio = (nextIndex: number) => {
    if (nextIndex === activeIndex) {
      return;
    }

    setIsFading(true);

    window.setTimeout(() => {
      setActiveIndex(nextIndex);
      setIsFading(false);
    }, FADE_DURATION_MS);
  };

  useEffect(() => {
    if (convenios.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setIsFading(true);

      window.setTimeout(() => {
        setActiveIndex((currentIndex) => (currentIndex + 1) % convenios.length);
        setIsFading(false);
      }, FADE_DURATION_MS);
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [convenios.length]);

  if (convenios.length === 0) {
    return null;
  }

  const activeConvenio = convenios[activeIndex] || convenios[0];

  return (
    <div className="w-full">
      <a
        href={activeConvenio.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block transition-opacity duration-300 hover:opacity-95 ${
          isFading ? 'opacity-0' : 'opacity-100'
        }`}
        aria-label={`Abrir convenio ${activeConvenio.nombre}`}
      >
        <ConvenioBanner convenio={activeConvenio} priority />
      </a>

      {convenios.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {convenios.map((convenio, index) => (
            <button
              key={convenio.id}
              type="button"
              onClick={() => showConvenio(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-6 bg-accent' : 'w-2 bg-border'
              }`}
              aria-label={`Ver convenio ${convenio.nombre}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
