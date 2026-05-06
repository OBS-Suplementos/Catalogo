'use server';

import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { Product, ProductPayload, ProductFilters, Brand, ProductType } from '@/types';
import { revalidatePath } from 'next/cache';

// Get all products with optional filters
export async function getProducts(
  filters: ProductFilters = {}
): Promise<{ data: Product[]; error?: string }> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('products')
    .select('*, brands(*), product_types(*)')
    .order('created_at', { ascending: false });

  // Apply search filter
  if (filters?.search) {
    query = query.ilike('nombre', `%${filters.search}%`);
  }

  // Apply price filters
  if (filters?.minPrice !== undefined) {
    query = query.gte('precio', filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte('precio', filters.maxPrice);
  }

  // Apply brand filter
  if (filters?.brandIds?.length) {
    query = query.in('brand_id', filters.brandIds);
  }

  // Apply type filter
  if (filters?.typeIds?.length) {
    query = query.in('type_id', filters.typeIds);
  }

  // Apply discount filter
  if (filters?.hasDiscount) {
    query = query.gt('descuento', 0);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return { data: [], error: 'Error al obtener productos' };
  }

  return { data: data as Product[] };
}

// Get single product by ID
export async function getProductById(
  id: number
): Promise<{ data: Product | null; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return { data: null, error: 'Producto no encontrado' };
  }

  return { data: data as Product };
}

// Create a new product
export async function createProduct(
  payload: ProductPayload
): Promise<{ data: Product | null; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .insert({
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      precio: payload.precio,
      descuento: payload.descuento,
      imagenes: payload.imagenes || [],
      brand_id: payload.brand_id ?? null,
      type_id: payload.type_id ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return { data: null, error: 'Error al crear el producto' };
  }

  revalidatePath('/');
  revalidatePath('/admin/productos');

  return { data: data as Product };
}

// Update an existing product
export async function updateProduct(
  id: number,
  payload: Partial<ProductPayload>
): Promise<{ data: Product | null; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return { data: null, error: 'Error al actualizar el producto' };
  }

  revalidatePath('/');
  revalidatePath('/admin/productos');
  revalidatePath(`/admin/productos/${id}/editar`);

  return { data: data as Product };
}

// Delete a product
export async function deleteProduct(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseAdminClient();

  // First get the product to delete its images
  const { data: product } = await supabase
    .from('products')
    .select('imagenes')
    .eq('id', id)
    .single();

  if (product?.imagenes?.length) {
    // Extract file paths from URLs and delete them
    const filePaths = product.imagenes.map((url: string) => {
      const parts = url.split('/product-images/');
      return parts[1] || '';
    }).filter(Boolean);

    if (filePaths.length > 0) {
      await supabase.storage.from('product-images').remove(filePaths);
    }
  }

  // Delete the product
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'Error al eliminar el producto' };
  }

  revalidatePath('/');
  revalidatePath('/admin/productos');

  return { success: true };
}

// Get product count
export async function getProductCount(): Promise<number> {
  const supabase = createServerSupabaseClient();

  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting products:', error);
    return 0;
  }

  return count || 0;
}

// Get all brands
export async function getBrands(): Promise<{ data: Brand[]; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching brands:', error);
    return { data: [], error: 'Error al obtener marcas' };
  }

  return { data: data as Brand[] };
}

// Get all product types
export async function getProductTypes(): Promise<{ data: ProductType[]; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('product_types')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching product types:', error);
    return { data: [], error: 'Error al obtener tipos de producto' };
  }

  return { data: data as ProductType[] };
}
