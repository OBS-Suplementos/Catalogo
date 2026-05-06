"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Convenio, Product } from "@/types";
import { Button } from "@/components/ui";
import {
  trackProductView,
  trackWhatsappLead,
} from "@/components/GoogleAnalytics";

interface ProductModalProps {
  product: Product | null;
  convenios?: Convenio[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({
  product,
  convenios = [],
  isOpen,
  onClose,
}: ProductModalProps) {
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedConvenioId, setSelectedConvenioId] = useState<number | null>(
    null,
  );
  const [convenioMenuOpen, setConvenioMenuOpen] = useState(false);

  useEffect(() => {
    if (product?.imagenes && product.imagenes.length > 0) {
      setActiveImage(product.imagenes[0]);
    } else {
      setActiveImage("/images/placeholder_imagen.svg");
    }

    // Track product view in GA4 when modal opens
    if (isOpen && product) {
      trackProductView(product);
    }
  }, [product, isOpen]);

  useEffect(() => {
    setSelectedConvenioId(null);
    setConvenioMenuOpen(false);
  }, [product?.id]);

  if (!isOpen || !product) return null;

  const discountedPrice =
    product.descuento > 0
      ? product.precio * (1 - product.descuento / 100)
      : product.precio;
  const selectedConvenio =
    convenios.find((convenio) => convenio.id === selectedConvenioId) || null;
  const convenioPrice = selectedConvenio
    ? discountedPrice * (1 - selectedConvenio.descuento / 100)
    : null;
  const whatsappProductLabel = product.brands?.name
    ? `${product.nombre}, de ${product.brands.name}`
    : product.nombre;
  const whatsappMessage = selectedConvenio
    ? `Hola! Quiero comprar ${whatsappProductLabel}, soy cliente de ${selectedConvenio.nombre}`
    : `Hola! Quiero comprar ${whatsappProductLabel}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-background/80 rounded-full hover:bg-muted transition-colors"
        >
          <svg
            className="w-6 h-6 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-muted p-4 md:p-6 flex flex-col items-center justify-center relative">
          <div className="relative w-full aspect-[4/3] md:aspect-square max-w-[400px]">
            {activeImage && (
              <Image
                src={activeImage}
                alt={product.nombre}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}

            {/* Discount Badge */}
            {product.descuento > 0 && (
              <span className="absolute top-12 right-0 badge-accent text-lg px-3 py-1 md:top-0">
                -{product.descuento}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.imagenes && product.imagenes.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto w-full justify-center px-4">
              {product.imagenes.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    activeImage === img
                      ? "border-primary"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Vista ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="w-full md:w-1/2 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-3 md:pb-8">
            {/* Brand & Type */}
            <div className="flex items-center gap-2 mb-2">
              {product.brands?.name && (
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                  {product.brands.name}
                </span>
              )}
              {product.product_types?.name && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {product.product_types.name}
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {product.nombre}
            </h2>

            <div className="mb-4 flex items-end gap-3">
              {selectedConvenio && convenioPrice !== null ? (
                <>
                  <span className="text-3xl font-bold text-foreground">
                    ${convenioPrice.toFixed(2)}
                  </span>
                  <span className="mb-1 text-lg text-muted-foreground line-through">
                    ${discountedPrice.toFixed(2)}
                  </span>
                </>
              ) : product.descuento > 0 ? (
                <>
                  <span className="text-3xl font-bold text-accent">
                    ${discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-lg text-muted-foreground line-through mb-1">
                    ${product.precio.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-foreground">
                  ${product.precio.toFixed(2)}
                </span>
              )}
            </div>

            <div className="relative mb-6">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Convenio
              </label>
              <button
                type="button"
                onClick={() => setConvenioMenuOpen((isOpen) => !isOpen)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                {selectedConvenio ? (
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={
                          selectedConvenio.logo_url ||
                          "/images/placeholder_imagen.svg"
                        }
                        alt={`Logo de ${selectedConvenio.nombre}`}
                        fill
                        className="object-contain"
                        sizes="32px"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {selectedConvenio.nombre}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {selectedConvenio.descuento}% de descuento
                      </span>
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sin convenio</span>
                )}
                <svg
                  className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${
                    convenioMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {convenioMenuOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConvenioId(null);
                      setConvenioMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted ${
                      !selectedConvenio ? "bg-muted" : ""
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                      -
                    </span>
                    <span className="font-medium">Sin convenio</span>
                  </button>

                  {convenios.map((convenio) => (
                    <button
                      key={convenio.id}
                      type="button"
                      onClick={() => {
                        setSelectedConvenioId(convenio.id);
                        setConvenioMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted ${
                        convenio.id === selectedConvenioId ? "bg-muted" : ""
                      }`}
                    >
                      <span className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={convenio.logo_url || "/images/placeholder_imagen.svg"}
                          alt={`Logo de ${convenio.nombre}`}
                          fill
                          className="object-contain"
                          sizes="32px"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {convenio.nombre}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {convenio.descuento}% de descuento
                        </span>
                      </span>
                      <span className="badge-accent flex-shrink-0">
                        -{convenio.descuento}%
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedConvenio && (
                <p className="mt-2 text-xs text-muted-foreground">
                  *Debera demostrarse pertenencia al convenio para aplicarse el
                  descuento
                </p>
              )}
            </div>

            <div className="prose prose-sm text-gray-400 mb-8">
              <h3 className="text-foreground font-semibold mb-2">
                Descripción
              </h3>
              <p className="whitespace-pre-wrap">
                {product.descripcion || "Sin descripción disponible."}
              </p>
            </div>
          </div>

          {/* Sticky Buy Button at Bottom */}
          <div className="p-4 md:p-8 pt-2 md:pt-0 bg-background border-t md:border-t-0 z-10">
            <Button
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg"
              size="lg"
              onClick={() => {
                trackWhatsappLead(product);

                const numero =
                  process.env.NEXT_PUBLIC_NUMERO || "+5493534773690";
                const message = encodeURIComponent(whatsappMessage);
                const whatsappUrl = `https://wa.me/${numero.replace(
                  "+",
                  "",
                )}?text=${message}`;

                window.location.assign(whatsappUrl);
              }}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Comprar
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              *Producto sujeto a disponibilidad y stock del momento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
