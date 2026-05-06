import Link from 'next/link';
import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/productos"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Productos
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">Nuevo</span>
      </nav>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Crear Producto</h1>
        <p className="text-muted-foreground">
          Agrega un nuevo suplemento al catálogo
        </p>
      </div>

      {/* Form */}
      <ProductForm />
    </div>
  );
}
