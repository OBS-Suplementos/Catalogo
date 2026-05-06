import { Suspense } from "react";
import {
  getProducts,
  getBrands,
  getProductTypes,
} from "@/lib/products/actions";
import ProductGrid from "@/components/ProductGrid";
import FilterContent from "@/components/FilterContent";
import ConveniosCarousel from "@/components/ConveniosCarousel";
import ScrollToTopOnSearchParams from "@/components/ScrollToTopOnSearchParams";
import { PageSpinner } from "@/components/ui/Spinner";
import { getConvenios } from "@/lib/convenios/actions";
import { ProductFilters } from "@/types";
export const revalidate = 60;

interface HomePageProps {
  searchParams: Promise<{
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    hasDiscount?: string;
    brandIds?: string;
    typeIds?: string;
  }>;
}

function parseFiniteNumber(value?: string): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseIdList(value?: string): number[] | undefined {
  if (!value) return undefined;

  const ids = value
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  return ids.length > 0 ? ids : undefined;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Await searchParams
  const params = await searchParams;

  // Build filters from search params
  const filters: ProductFilters = {};
  const minPrice = parseFiniteNumber(params.minPrice);
  const maxPrice = parseFiniteNumber(params.maxPrice);
  const brandIds = parseIdList(params.brandIds);
  const typeIds = parseIdList(params.typeIds);

  const search = params.search?.trim();
  if (search) {
    filters.search = search;
  }

  if (minPrice !== undefined) {
    filters.minPrice = minPrice;
  }

  if (maxPrice !== undefined) {
    filters.maxPrice = maxPrice;
  }

  if (params.hasDiscount === "true") {
    filters.hasDiscount = true;
  }

  if (brandIds) {
    filters.brandIds = brandIds;
  }

  if (typeIds) {
    filters.typeIds = typeIds;
  }

  // Fetch products and filter options in parallel
  const [
    { data: products, error },
    { data: brands },
    { data: types },
    { data: convenios },
  ] = await Promise.all([
    getProducts(filters),
    getBrands(),
    getProductTypes(),
    getConvenios(),
  ]);

  // Check if any filters are active
  const hasFilters = Object.keys(filters).length > 0;
  const initialConvenioIndex =
    convenios.length > 0 ? Math.floor(Math.random() * convenios.length) : 0;

  return (
    <div className="container-custom flex flex-col lg:flex-row gap-8">
      <ScrollToTopOnSearchParams />

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <FilterContent brands={brands || []} types={types || []} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {convenios.length > 0 && (
          <div className="mb-6 pt-4">
            <ConveniosCarousel
              convenios={convenios}
              initialIndex={initialConvenioIndex}
            />
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {hasFilters ? "Resultados de búsqueda" : "Todos los productos"}
          </h1>
          <span className="text-muted-foreground">
            {products.length} producto{products.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-accent-light text-accent rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Products grid */}
        <Suspense fallback={<PageSpinner />}>
          {products.length > 0 ? (
            <ProductGrid
              products={products}
              activeSearch={filters.search}
              convenios={convenios}
            />
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-muted-foreground mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No se encontraron productos
              </h2>
              <p className="text-muted-foreground">
                {hasFilters
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Aún no hay productos en el catálogo"}
              </p>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
