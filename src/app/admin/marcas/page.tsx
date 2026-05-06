'use client';

import { useEffect, useState } from 'react';
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/lib/brands/actions';
import GenericManager from '@/components/admin/GenericManager';
import { PageSpinner } from '@/components/ui/Spinner';
import { Brand } from '@/types';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrands = async () => {
    const { data } = await getBrands();
    setBrands(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreate = async (name: string) => {
    const result = await createBrand(name);
    if (result.success) await fetchBrands();
    return result;
  };

  const handleUpdate = async (id: number, name: string) => {
    const result = await updateBrand(id, name);
    if (result.success) await fetchBrands();
    return result;
  };

  const handleDelete = async (id: number) => {
    const result = await deleteBrand(id);
    if (result.success) await fetchBrands();
    return result;
  };

  if (loading) return <PageSpinner />;

  return (
    <GenericManager
      title="Marcas"
      items={brands}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
