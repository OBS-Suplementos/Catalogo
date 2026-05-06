"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { Brand, ProductType } from "@/types";
import { trackProductFilters } from "@/components/GoogleAnalytics";

interface FilterContentProps {
  brands: Brand[];
  types: ProductType[];
  onApply?: () => void;
  onClose?: () => void;
}

function parseIdParam(value: string | null): number[] {
  if (!value) return [];

  return value
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function parsePriceParam(value: string | null): string {
  if (!value) return "";

  return Number.isFinite(Number(value)) ? value : "";
}

function isValidPriceParam(value: string): boolean {
  return value !== "" && Number.isFinite(Number(value));
}

export default function FilterContent({
  brands,
  types,
  onApply,
  onClose,
}: FilterContentProps) {
  return (
    <Suspense fallback={<FilterContentFallback />}>
      <FilterContentInner
        brands={brands}
        types={types}
        onApply={onApply}
        onClose={onClose}
      />
    </Suspense>
  );
}

function FilterContentFallback() {
  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 mb-4 border-b border-border/50 bg-background pb-4 pt-1">
        <h2 className="text-lg font-semibold">Filtros</h2>
      </div>
      <div className="flex-1 space-y-4 pb-4">
        <div className="h-10 rounded-md bg-muted" />
        <div className="h-24 rounded-md bg-muted" />
        <div className="h-32 rounded-md bg-muted" />
      </div>
    </div>
  );
}

function FilterContentInner({
  brands,
  types,
  onApply,
  onClose,
}: FilterContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [minPrice, setMinPrice] = useState(
    parsePriceParam(searchParams.get("minPrice")),
  );
  const [maxPrice, setMaxPrice] = useState(
    parsePriceParam(searchParams.get("maxPrice")),
  );
  const [hasDiscount, setHasDiscount] = useState(
    searchParams.get("hasDiscount") === "true",
  );

  // Multi-select states
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);

  // Sync state with URL on mount
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setMinPrice(parsePriceParam(searchParams.get("minPrice")));
    setMaxPrice(parsePriceParam(searchParams.get("maxPrice")));
    setHasDiscount(searchParams.get("hasDiscount") === "true");

    const brandIds = parseIdParam(searchParams.get("brandIds"));
    setSelectedBrands(brandIds);

    const typeIds = parseIdParam(searchParams.get("typeIds"));
    setSelectedTypes(typeIds);
  }, [searchParams]);

  // Update URL helper
  const updateUrl = useCallback(
    (
      currentSearch: string,
      currentMin: string,
      currentMax: string,
      currentHasDiscount: boolean,
      brands: number[],
      types: number[],
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      if (currentSearch) params.set("search", currentSearch);
      else params.delete("search");

      if (isValidPriceParam(currentMin)) params.set("minPrice", currentMin);
      else params.delete("minPrice");

      if (isValidPriceParam(currentMax)) params.set("maxPrice", currentMax);
      else params.delete("maxPrice");

      if (currentHasDiscount) params.set("hasDiscount", "true");
      else params.delete("hasDiscount");

      if (brands.length > 0) params.set("brandIds", brands.join(","));
      else params.delete("brandIds");

      if (types.length > 0) params.set("typeIds", types.join(","));
      else params.delete("typeIds");

      params.delete("page"); // Reset pagination on filter change

      trackProductFilters({
        search: currentSearch,
        minPrice: currentMin,
        maxPrice: currentMax,
        hasDiscount: currentHasDiscount,
        brandCount: brands.length,
        typeCount: types.length,
      });

      router.push(`/?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Debounced update for text inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update if text values changed from URL
      if (
        search !== (searchParams.get("search") || "") ||
        minPrice !== (searchParams.get("minPrice") || "") ||
        maxPrice !== (searchParams.get("maxPrice") || "") ||
        hasDiscount !== (searchParams.get("hasDiscount") === "true")
      ) {
        updateUrl(
          search,
          minPrice,
          maxPrice,
          hasDiscount,
          selectedBrands,
          selectedTypes,
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    search,
    minPrice,
    maxPrice,
    hasDiscount,
    searchParams,
    selectedBrands,
    selectedTypes,
    updateUrl,
  ]);

  const handleBrandToggle = (brandId: number) => {
    const newBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter((id) => id !== brandId)
      : [...selectedBrands, brandId];

    setSelectedBrands(newBrands);
    updateUrl(
      search,
      minPrice,
      maxPrice,
      hasDiscount,
      newBrands,
      selectedTypes,
    );
  };

  const handleTypeToggle = (typeId: number) => {
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter((id) => id !== typeId)
      : [...selectedTypes, typeId];

    setSelectedTypes(newTypes);
    updateUrl(
      search,
      minPrice,
      maxPrice,
      hasDiscount,
      selectedBrands,
      newTypes,
    );
  };

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setHasDiscount(false);
    setSelectedBrands([]);
    setSelectedTypes([]);

    router.push("/");
    if (onApply) onApply();
  };

  const hasFilters =
    search ||
    minPrice ||
    maxPrice ||
    hasDiscount ||
    selectedBrands.length > 0 ||
    selectedTypes.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-1 border-b border-border/50 mb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Filtros</h2>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-accent hover:underline decoration-2 underline-offset-4 transition-all"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Cerrar filtros"
            >
              <svg
                className="w-5 h-5"
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
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 pb-4">
        {/* Search Bar impl */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Búsqueda
          </h3>
          <Input
            type="search"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-1.5"
          />
        </div>

        <hr className="border-border/50" />

        {/* Price filters */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Precio
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Mín"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
              step="0.01"
              className="py-1.5"
            />
            <Input
              type="number"
              placeholder="Máx"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
              step="0.01"
              className="py-1.5"
            />
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Brand Filter */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Marcas ({brands.length})
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {brands.map((brand) => (
              <label
                key={brand.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => handleBrandToggle(brand.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                {brand.name}
              </label>
            ))}
            {brands.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay marcas disponibles.
              </p>
            )}
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Type Filter */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Tipos ({types.length})
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {types.map((type) => (
              <label
                key={type.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type.id)}
                  onChange={() => handleTypeToggle(type.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                {type.name}
              </label>
            ))}
            {types.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay tipos disponibles.
              </p>
            )}
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Discount filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-primary transition-colors">
            <input
              type="checkbox"
              checked={hasDiscount}
              onChange={(e) => setHasDiscount(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            Solo productos con descuento
          </label>
        </div>
      </div>
    </div>
  );
}
