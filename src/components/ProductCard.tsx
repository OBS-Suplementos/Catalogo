"use client";

import Image from "next/image";
import { Product } from "@/types";
import Card, { CardContent } from "@/components/ui/Card";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { trackProductClick } from "@/components/GoogleAnalytics";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  priority?: boolean;
  index?: number;
}

const productCardImageSizes =
  "(max-width: 640px) calc((100vw - 44px) / 2), (max-width: 1024px) calc((100vw - 72px) / 2), (max-width: 1280px) calc((100vw - 400px) / 3), (max-width: 1536px) calc((100vw - 424px) / 4), 230px";

export default function ProductCard({
  product,
  onClick,
  priority = false,
  index,
}: ProductCardProps) {
  // Calculate discounted price
  const discountedPrice =
    product.descuento > 0
      ? product.precio * (1 - product.descuento / 100)
      : product.precio;

  const handleClick = () => {
    // Track product click in GA4
    trackProductClick(product, index);
    onClick?.();
  };

  return (
    <Card hover className="group cursor-pointer" onClick={handleClick}>
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted sm:aspect-square">
        {product.imagenes && product.imagenes.length > 0 ? (
          <ImageWithFallback
            src={product.imagenes[0]}
            alt={product.nombre}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes={productCardImageSizes}
            priority={priority}
          />
        ) : (
          <div className="relative w-full h-full bg-muted">
            <Image
              src="/images/placeholder_imagen.svg"
              alt="Imagen no disponible"
              fill
              className="object-cover opacity-50"
              sizes={productCardImageSizes}
              priority={priority}
            />
          </div>
        )}

        {/* Discount badge */}
        {product.descuento > 0 && (
          <span className="discount-badge">-{product.descuento}%</span>
        )}
      </div>

      <CardContent className="p-2.5 sm:p-4">
        {/* Brand & Type */}
        <div className="mb-1 flex items-center gap-1.5">
          {product.brands?.name && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-primary sm:text-xs">
              {product.brands.name}
            </span>
          )}
          {product.product_types?.name && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground sm:text-xs">
              {product.product_types.name}
            </span>
          )}
        </div>

        {/* Product name */}
        <h3 className="line-clamp-2 min-h-[38px] text-[13px] font-semibold text-foreground sm:min-h-[48px] sm:text-base">
          {product.nombre}
        </h3>

        {/* Price */}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:mt-3">
          {product.descuento > 0 ? (
            <>
              <span className="price-discounted">
                ${discountedPrice.toFixed(2)}
              </span>
              <span className="price-original">
                ${product.precio.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="price-current">${product.precio.toFixed(2)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
