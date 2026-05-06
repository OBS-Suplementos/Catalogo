'use client';

import { useEffect, useState } from 'react';
import { getProductTypes, createProductType, updateProductType, deleteProductType } from '@/lib/product-types/actions';
import GenericManager from '@/components/admin/GenericManager';
import { PageSpinner } from '@/components/ui/Spinner';
import { ProductType } from '@/types';

export default function ProductTypesPage() {
  const [types, setTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTypes = async () => {
    const { data } = await getProductTypes();
    setTypes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleCreate = async (name: string) => {
    const result = await createProductType(name);
    if (result.success) await fetchTypes();
    return result;
  };

  const handleUpdate = async (id: number, name: string) => {
    const result = await updateProductType(id, name);
    if (result.success) await fetchTypes();
    return result;
  };

  const handleDelete = async (id: number) => {
    const result = await deleteProductType(id);
    if (result.success) await fetchTypes();
    return result;
  };

  if (loading) return <PageSpinner />;

  return (
    <GenericManager
      title="Tipos de Producto"
      items={types}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
