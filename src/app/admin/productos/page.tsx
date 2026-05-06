import Link from 'next/link';
import { getBrands } from '@/lib/brands/actions';
import { getProductTypes } from '@/lib/product-types/actions';
import { getProducts } from '@/lib/products/actions';
import { Button } from '@/components/ui';
import AdminProductsList from './AdminProductsList';

export default async function AdminProductsPage() {
  const [
    { data: products, error },
    { data: brands },
    { data: productTypes },
  ] = await Promise.all([getProducts(), getBrands(), getProductTypes()]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona el catalogo de suplementos
          </p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button variant="accent">
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-md bg-accent-light p-4 text-accent">
          {error}
        </div>
      )}

      <AdminProductsList
        products={products}
        brands={brands}
        productTypes={productTypes}
      />
    </div>
  );
}
