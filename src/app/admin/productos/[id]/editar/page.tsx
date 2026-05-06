import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/products/actions';
import ProductForm from '@/components/ProductForm';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.id);

  if (isNaN(productId)) {
    notFound();
  }

  const { data: product, error } = await getProductById(productId);

  if (error || !product) {
    notFound();
  }

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
        <span className="text-foreground font-medium">Editar</span>
      </nav>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Editar Producto</h1>
        <p className="text-muted-foreground">
          Modifica los datos del producto: {product.nombre}
        </p>
      </div>

      {/* Form */}
      <ProductForm product={product} isEditing />
    </div>
  );
}
