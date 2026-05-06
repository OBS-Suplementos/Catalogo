'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Convenio, Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import {
  trackProductListView,
  trackSearch,
} from '@/components/GoogleAnalytics';

const ProductModal = dynamic(() => import('@/components/ProductModal'), {
  ssr: false,
  loading: () => null,
});

interface ProductGridProps {
  products: Product[];
  activeSearch?: string;
  convenios?: Convenio[];
}

export default function ProductGrid({
  products,
  activeSearch,
  convenios = [],
}: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const productListKey = useMemo(
    () => products.map((product) => product.id).join(','),
    [products],
  );

  useEffect(() => {
    trackProductListView(products);
  }, [productListKey, products]);

  useEffect(() => {
    if (activeSearch) {
      trackSearch(activeSearch, products.length);
    }
  }, [activeSearch, products.length]);

  return (
    <>
      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 2}
            index={index}
            onClick={() => setSelectedProduct(product)}
          />
        ))}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          convenios={convenios}
          isOpen
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
