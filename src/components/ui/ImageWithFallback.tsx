'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

const DEFAULT_FALLBACK_SRC = '/images/placeholder_imagen.svg';

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
  onError?: ImageProps['onError'];
}

function getSourceKey(src: ImageProps['src']) {
  if (typeof src === 'string') {
    return src;
  }

  return 'default' in src ? src.default.src : src.src;
}

function ImageWithFallbackState({
  src,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  alt,
  fill,
  width,
  height,
  onError,
  ...props
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState<ImageProps['src']>(src);
  const [hasFailed, setHasFailed] = useState(false);
  const isShowingFallback = getSourceKey(currentSrc) === fallbackSrc;

  if (hasFailed) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={fill ? 'absolute inset-0 block bg-muted' : 'block bg-muted'}
        style={
          fill
            ? undefined
            : {
                width,
                height,
                maxWidth: '100%',
              }
        }
      />
    );
  }

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      onError={(event) => {
        onError?.(event);

        if (!isShowingFallback && getSourceKey(currentSrc) !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          return;
        }

        setHasFailed(true);
      }}
    />
  );
}

export default function ImageWithFallback(props: ImageWithFallbackProps) {
  const resetKey = `${getSourceKey(props.src)}|${
    props.fallbackSrc || DEFAULT_FALLBACK_SRC
  }`;

  return <ImageWithFallbackState key={resetKey} {...props} />;
}
