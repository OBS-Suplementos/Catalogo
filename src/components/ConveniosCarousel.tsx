'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ConvenioBanner from '@/components/ConvenioBanner';
import { Convenio } from '@/types';

interface ConveniosCarouselProps {
  convenios: Convenio[];
  initialIndex?: number;
}

const CAROUSEL_INTERVAL_MS = 4000;
const FADE_DURATION_MS = 250;

export default function ConveniosCarousel({
  convenios,
  initialIndex = 0,
}: ConveniosCarouselProps) {
  const safeInitialIndex =
    convenios.length > 0 ? initialIndex % convenios.length : 0;
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex);
  const [isFading, setIsFading] = useState(false);
  const autoTimeoutRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);

  const clearAutoTimeout = useCallback(() => {
    if (autoTimeoutRef.current !== null) {
      window.clearTimeout(autoTimeoutRef.current);
      autoTimeoutRef.current = null;
    }
  }, []);

  const clearFadeTimeout = useCallback(() => {
    if (fadeTimeoutRef.current !== null) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  }, []);

  const showConvenio = useCallback((nextIndex: number) => {
    if (convenios.length === 0) {
      return;
    }

    const normalizedIndex =
      (nextIndex + convenios.length) % convenios.length;

    if (normalizedIndex === activeIndex) {
      return;
    }

    clearAutoTimeout();
    clearFadeTimeout();
    setIsFading(true);

    fadeTimeoutRef.current = window.setTimeout(() => {
      setActiveIndex(normalizedIndex);
      setIsFading(false);
      fadeTimeoutRef.current = null;
    }, FADE_DURATION_MS);
  }, [
    activeIndex,
    clearAutoTimeout,
    clearFadeTimeout,
    convenios.length,
  ]);

  useEffect(() => {
    clearAutoTimeout();

    if (convenios.length <= 1) {
      return;
    }

    autoTimeoutRef.current = window.setTimeout(() => {
      showConvenio(activeIndex + 1);
    }, CAROUSEL_INTERVAL_MS);

    return clearAutoTimeout;
  }, [
    activeIndex,
    clearAutoTimeout,
    convenios.length,
    showConvenio,
  ]);

  useEffect(() => {
    return () => {
      clearAutoTimeout();
      clearFadeTimeout();
    };
  }, [clearAutoTimeout, clearFadeTimeout]);

  if (convenios.length === 0) {
    return null;
  }

  const activeConvenio = convenios[activeIndex] || convenios[0];

  return (
    <div className="w-full">
      <div className="group relative">
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
          <>
            <button
              type="button"
              onClick={() => showConvenio(activeIndex - 1)}
              className="pointer-events-none absolute left-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-sm transition hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
              aria-label="Ver convenio anterior"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => showConvenio(activeIndex + 1)}
              className="pointer-events-none absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-sm transition hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
              aria-label="Ver convenio siguiente"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
