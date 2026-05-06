'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import type { Product } from '@/types';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const EXCLUDED_PATH_PREFIXES = ['/admin', '/login'];
const PRODUCT_LIST_ID = 'catalogo_productos';
const PRODUCT_LIST_NAME = 'Catalogo de productos';
const MAX_LIST_ITEMS = 25;

type AnalyticsProduct = Pick<
  Product,
  'id' | 'nombre' | 'precio' | 'descuento' | 'brands' | 'product_types'
>;

type GtagParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function shouldTrackPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  return !EXCLUDED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getProductPrice(product: AnalyticsProduct): number {
  const discountMultiplier =
    product.descuento > 0 ? 1 - product.descuento / 100 : 1;

  return Number((product.precio * discountMultiplier).toFixed(2));
}

function getAnalyticsItem(product: AnalyticsProduct, index?: number) {
  const price = getProductPrice(product);
  const item: Record<string, string | number> = {
    item_id: String(product.id),
    item_name: product.nombre,
    item_list_id: PRODUCT_LIST_ID,
    item_list_name: PRODUCT_LIST_NAME,
    price,
    quantity: 1,
  };

  if (typeof index === 'number') {
    item.index = index + 1;
  }

  if (product.brands?.name) {
    item.item_brand = product.brands.name;
  }

  if (product.product_types?.name) {
    item.item_category = product.product_types.name;
  }

  if (product.descuento > 0) {
    item.discount = Number((product.precio - price).toFixed(2));
  }

  return item;
}

export function trackEvent(eventName: string, params: GtagParams = {}) {
  if (
    typeof window === 'undefined' ||
    !window.gtag ||
    !shouldTrackPath(window.location.pathname)
  ) {
    return;
  }

  window.gtag('event', eventName, params);
}

export function trackPageView(pagePath: string) {
  if (
    typeof window === 'undefined' ||
    !window.gtag ||
    !GA_MEASUREMENT_ID ||
    !shouldTrackPath(window.location.pathname)
  ) {
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackProductListView(products: AnalyticsProduct[]) {
  if (products.length === 0) return;

  trackEvent('view_item_list', {
    item_list_id: PRODUCT_LIST_ID,
    item_list_name: PRODUCT_LIST_NAME,
    items: products
      .slice(0, MAX_LIST_ITEMS)
      .map((product, index) => getAnalyticsItem(product, index)),
  });
}

export function trackProductClick(product: AnalyticsProduct, index?: number) {
  trackEvent('select_item', {
    item_list_id: PRODUCT_LIST_ID,
    item_list_name: PRODUCT_LIST_NAME,
    items: [getAnalyticsItem(product, index)],
  });
}

export function trackProductView(product: AnalyticsProduct) {
  const price = getProductPrice(product);

  trackEvent('view_item', {
    currency: 'ARS',
    value: price,
    items: [getAnalyticsItem(product)],
  });
}

export function trackWhatsappLead(product: AnalyticsProduct) {
  const price = getProductPrice(product);

  trackEvent('generate_lead', {
    currency: 'ARS',
    value: price,
    method: 'whatsapp',
    items: [getAnalyticsItem(product)],
  });
}

export function trackSearch(searchTerm: string, resultCount: number) {
  const normalizedTerm = searchTerm.trim();
  if (!normalizedTerm) return;

  trackEvent('view_search_results', {
    search_term: normalizedTerm,
    result_count: resultCount,
  });
}

export function trackProductFilters(filters: {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  hasDiscount: boolean;
  brandCount: number;
  typeCount: number;
}) {
  const normalizedTerm = filters.search?.trim();
  const hasFilters =
    Boolean(normalizedTerm) ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    filters.hasDiscount ||
    filters.brandCount > 0 ||
    filters.typeCount > 0;

  if (!hasFilters) return;

  trackEvent('filter_products', {
    search_term: normalizedTerm || undefined,
    min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
    max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    has_discount: filters.hasDiscount,
    brand_count: filters.brandCount,
    type_count: filters.typeCount,
  });
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const pagePath = queryString ? `${pathname}?${queryString}` : pathname;

  useEffect(() => {
    if (!shouldTrackPath(pathname)) return;

    trackPageView(pagePath);
  }, [pagePath, pathname]);

  return null;
}

export default function GoogleAnalytics() {
  const pathname = usePathname();

  if (!GA_MEASUREMENT_ID || !shouldTrackPath(pathname)) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = function gtag(){window.dataLayer.push(arguments);}
            window.gtag('js', new Date());
            window.gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)}, {
              send_page_view: false
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
