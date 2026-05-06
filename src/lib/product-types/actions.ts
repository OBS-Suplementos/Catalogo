'use server';

import { createServerSupabaseAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { ProductType } from '@/types';
import { revalidatePath } from 'next/cache';

// Get all product types
export async function getProductTypes() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('product_types')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching product types:', error);
    return { data: [], error: 'Error al cargar tipos' };
  }

  return { data: data as ProductType[] };
}

// Create a product type
export async function createProductType(name: string) {
  const supabase = createServerSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('product_types')
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    console.error('Error creating product type:', error);
    return { success: false, error: 'Error al crear el tipo. Verifica que no exista.' };
  }

  revalidatePath('/admin/tipos');
  revalidatePath('/');
  return { success: true, data };
}

// Delete a product type
export async function deleteProductType(id: number) {
  const supabase = createServerSupabaseAdminClient();

  const { error } = await supabase
    .from('product_types')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product type:', error);
    return { success: false, error: 'Error al eliminar el tipo' };
  }

  revalidatePath('/admin/tipos');
  revalidatePath('/');
  return { success: true };
}

// Update a product type
export async function updateProductType(id: number, name: string) {
  const supabase = createServerSupabaseAdminClient();

  const { error } = await supabase
    .from('product_types')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error('Error updating product type:', error);
    return { success: false, error: 'Error al actualizar el tipo' };
  }

  revalidatePath('/admin/tipos');
  revalidatePath('/');
  return { success: true };
}
