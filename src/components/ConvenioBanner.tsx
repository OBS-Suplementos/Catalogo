import { Convenio } from '@/types';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

interface ConvenioBannerProps {
  convenio: Convenio;
  className?: string;
  priority?: boolean;
}

const desktopBannerSizes =
  '(max-width: 1024px) calc(100vw - 32px), (max-width: 1280px) calc(100vw - 384px), 928px';
const mobileBannerSizes = 'calc(100vw - 32px)';

function PlaceholderBanner({
  convenio,
  compact = false,
}: {
  convenio: Convenio;
  compact?: boolean;
}) {
  const logoSrc = convenio.logo_url || '/images/placeholder_imagen.svg';
  const discountLabel = `-${convenio.descuento}%`;

  return (
    <div className="grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border border-border bg-transparent px-3 sm:gap-6 sm:px-6">
      <div
        className={`relative flex-shrink-0 overflow-hidden rounded-md bg-muted ${
          compact ? 'h-10 w-10' : 'h-12 w-12 sm:h-16 sm:w-16'
        }`}
      >
        <ImageWithFallback
          src={logoSrc}
          alt={`Logo de ${convenio.nombre}`}
          fill
          className="object-contain"
          sizes={compact ? '40px' : '64px'}
          priority={false}
        />
      </div>

      <div className="min-w-0 text-center">
        <p
          className={`truncate font-bold text-foreground ${
            compact ? 'text-sm' : 'text-base sm:text-2xl'
          }`}
        >
          {convenio.nombre}
        </p>
      </div>

      <div className="justify-self-end">
        <span
          className={`inline-flex items-center rounded-md bg-accent px-2 py-1 font-bold text-white ${
            compact ? 'text-xs' : 'text-sm sm:text-xl'
          }`}
        >
          {discountLabel}
        </span>
      </div>
    </div>
  );
}

function BannerImage({
  src,
  alt,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes={sizes}
      priority={priority}
    />
  );
}

export default function ConvenioBanner({
  convenio,
  className = '',
  priority = false,
}: ConvenioBannerProps) {
  const useImage = convenio.banner_modo === 'imagen';
  const hasDesktopImage = useImage && Boolean(convenio.banner_grande_url);
  const hasMobileImage = useImage && Boolean(convenio.banner_chico_url);

  return (
    <div className={`w-full overflow-hidden rounded-md bg-transparent ${className}`}>
      <div className="relative hidden aspect-[580/87] w-full sm:block">
        {hasDesktopImage && convenio.banner_grande_url ? (
          <BannerImage
            src={convenio.banner_grande_url}
            alt={`Banner de ${convenio.nombre}`}
            priority={priority}
            sizes={desktopBannerSizes}
          />
        ) : (
          <PlaceholderBanner convenio={convenio} />
        )}
      </div>

      <div className="relative aspect-[290/87] w-full sm:hidden">
        {hasMobileImage && convenio.banner_chico_url ? (
          <BannerImage
            src={convenio.banner_chico_url}
            alt={`Banner de ${convenio.nombre}`}
            priority={priority}
            sizes={mobileBannerSizes}
          />
        ) : (
          <PlaceholderBanner convenio={convenio} compact />
        )}
      </div>
    </div>
  );
}
