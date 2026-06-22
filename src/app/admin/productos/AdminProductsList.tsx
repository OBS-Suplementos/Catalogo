'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Brand, Product, ProductType } from '@/types';
import { Button, Card, CardContent, CardHeader, Input } from '@/components/ui';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import DeleteProductButton from './DeleteProductButton';

interface AdminProductsListProps {
  products: Product[];
  brands: Brand[];
  productTypes: ProductType[];
}

export default function AdminProductsList({
  products,
  brands,
  productTypes,
}: AdminProductsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesName =
        !normalizedSearch ||
        product.nombre.toLowerCase().includes(normalizedSearch);
      const productBrandId = product.brand_id ?? product.brands?.id;
      const productTypeId = product.type_id ?? product.product_types?.id;
      const matchesBrand =
        !selectedBrandId || String(productBrandId ?? '') === selectedBrandId;
      const matchesType =
        !selectedTypeId || String(productTypeId ?? '') === selectedTypeId;

      return matchesName && matchesBrand && matchesType;
    });
  }, [products, searchQuery, selectedBrandId, selectedTypeId]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedBrandId || selectedTypeId
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBrandId('');
    setSelectedTypeId('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">
              {filteredProducts.length} de {products.length} producto
              {products.length !== 1 ? 's' : ''}
            </h2>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre"
            />
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas las marcas</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los tipos</option>
              {productTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {products.length > 0 ? (
          filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Producto
                    </th>
                    <th className="hidden px-4 py-3 text-left text-sm font-medium text-muted-foreground md:table-cell">
                      Precio
                    </th>
                    <th className="hidden px-4 py-3 text-left text-sm font-medium text-muted-foreground sm:table-cell">
                      Descuento
                    </th>
                    <th className="hidden px-4 py-3 text-left text-sm font-medium text-muted-foreground lg:table-cell">
                      Imagenes
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            {product.imagenes && product.imagenes.length > 0 ? (
                              <ImageWithFallback
                                src={product.imagenes[0]}
                                alt={product.nombre}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="relative h-full w-full bg-muted">
                                <ImageWithFallback
                                  src="/images/placeholder_imagen.svg"
                                  alt="Imagen no disponible"
                                  fill
                                  className="object-cover opacity-50"
                                  sizes="48px"
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="line-clamp-1 font-medium">
                              {product.nombre}
                            </p>
                            <p className="hidden line-clamp-1 text-sm text-muted-foreground sm:block">
                              {product.descripcion || 'Sin descripcion'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="font-medium">
                          ${product.precio.toFixed(2)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        {product.descuento > 0 ? (
                          <span className="badge-accent">
                            -{product.descuento}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {product.imagenes?.length || 0} imagen
                          {(product.imagenes?.length || 0) !== 1 ? 'es' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/productos/${product.id}/editar`}>
                            <Button variant="ghost" size="sm">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </Button>
                          </Link>
                          <DeleteProductButton
                            productId={product.id}
                            productName={product.nombre}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                No hay resultados
              </h2>
              <p className="text-muted-foreground">
                No se encontraron productos con esos filtros.
              </p>
            </div>
          )
        ) : (
          <div className="py-12 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              No hay productos
            </h2>
            <p className="mb-4 text-muted-foreground">
              Comienza agregando tu primer producto al catalogo
            </p>
            <Link href="/admin/productos/nuevo">
              <Button variant="accent">Agregar Producto</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
