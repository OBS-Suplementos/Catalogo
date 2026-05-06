'use server';

import { createServerSupabaseAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { Brand } from '@/types';
import { revalidatePath } from 'next/cache';

// Get all brands
export async function getBrands() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching brands:', error);
    return { data: [], error: 'Error al cargar marcas' };
  }

  return { data: data as Brand[] };
}

// Create a brand
export async function createBrand(name: string) {
  const supabase = createServerSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('brands')
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    console.error('Error creating brand:', error);
    return { success: false, error: 'Error al crear la marca. Verifica que no exista.' };
  }

  revalidatePath('/admin/marcas');
  revalidatePath('/');
  return { success: true, data };
}

// Delete a brand
export async function deleteBrand(id: number) {
  const supabase = createServerSupabaseAdminClient();

  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting brand:', error);
    return { success: false, error: 'Error al eliminar la marca' };
  }

  revalidatePath('/admin/marcas');
  revalidatePath('/');
  return { success: true };
}

// Update a brand
export async function updateBrand(id: number, name: string) {
  const supabase = createServerSupabaseAdminClient();

  const { error } = await supabase
    .from('brands')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error('Error updating brand:', error);
    return { success: false, error: 'Error al actualizar la marca' };
  }

  revalidatePath('/admin/marcas');
  revalidatePath('/');
  return { success: true };
}
