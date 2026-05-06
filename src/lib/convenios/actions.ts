'use server';

import { revalidatePath } from 'next/cache';
import {
  createServerSupabaseAdminClient,
  createServerSupabaseClient,
} from '@/lib/supabase/server';
import { deleteConvenioImage } from '@/lib/storage/actions';
import { Convenio, ConvenioPayload } from '@/types';

const CONVENIO_IMAGE_FIELDS = [
  'logo_url',
  'banner_grande_url',
  'banner_chico_url',
] as const;

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function validatePayload(payload: ConvenioPayload): string | null {
  if (!payload.nombre.trim()) {
    return 'El nombre es requerido';
  }

  if (
    !Number.isFinite(payload.descuento) ||
    payload.descuento < 0 ||
    payload.descuento > 100
  ) {
    return 'El descuento debe estar entre 0 y 100';
  }

  if (!payload.link_url.trim()) {
    return 'El link es requerido';
  }

  try {
    const parsedUrl = new URL(normalizeExternalUrl(payload.link_url));
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return 'El link debe ser una URL web valida';
    }
  } catch {
    return 'El link debe ser una URL valida';
  }

  if (!['placeholder', 'imagen'].includes(payload.banner_modo)) {
    return 'El modo de banner no es valido';
  }

  return null;
}

function toDatabasePayload(payload: ConvenioPayload) {
  return {
    nombre: payload.nombre.trim(),
    descuento: Math.round(payload.descuento),
    logo_url: payload.logo_url || null,
    link_url: normalizeExternalUrl(payload.link_url),
    banner_grande_url: payload.banner_grande_url || null,
    banner_chico_url: payload.banner_chico_url || null,
    banner_modo: payload.banner_modo,
  };
}

async function deleteReplacedImages(
  previous: Pick<
    Convenio,
    'logo_url' | 'banner_grande_url' | 'banner_chico_url'
  > | null,
  next: Pick<Convenio, 'logo_url' | 'banner_grande_url' | 'banner_chico_url'>
) {
  if (!previous) {
    return;
  }

  await Promise.all(
    CONVENIO_IMAGE_FIELDS.map(async (field) => {
      const previousUrl = previous[field];
      const nextUrl = next[field];

      if (previousUrl && previousUrl !== nextUrl) {
        await deleteConvenioImage(previousUrl);
      }
    })
  );
}

export async function getConvenios(): Promise<{
  data: Convenio[];
  error?: string;
}> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('convenios')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') {
      return {
        data: [],
        error: 'Falta aplicar el SQL de supabase/convenios_setup.sql',
      };
    }

    console.error('Error fetching convenios:', error);
    return { data: [], error: 'Error al cargar convenios' };
  }

  return { data: data as Convenio[] };
}

export async function createConvenio(payload: ConvenioPayload): Promise<{
  data: Convenio | null;
  error?: string;
}> {
  const validationError = validatePayload(payload);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const supabase = createServerSupabaseAdminClient();

  const { data, error } = await supabase
    .from('convenios')
    .insert(toDatabasePayload(payload))
    .select()
    .single();

  if (error) {
    console.error('Error creating convenio:', error);
    return { data: null, error: 'Error al crear el convenio' };
  }

  revalidatePath('/');
  revalidatePath('/convenios');
  revalidatePath('/admin/convenios');

  return { data: data as Convenio };
}

export async function updateConvenio(
  id: number,
  payload: ConvenioPayload
): Promise<{ data: Convenio | null; error?: string }> {
  const validationError = validatePayload(payload);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const supabase = createServerSupabaseAdminClient();

  const { data: previous } = await supabase
    .from('convenios')
    .select('logo_url,banner_grande_url,banner_chico_url')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('convenios')
    .update({
      ...toDatabasePayload(payload),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating convenio:', error);
    return { data: null, error: 'Error al actualizar el convenio' };
  }

  await deleteReplacedImages(previous as Convenio | null, data as Convenio);

  revalidatePath('/');
  revalidatePath('/convenios');
  revalidatePath('/admin/convenios');

  return { data: data as Convenio };
}

export async function deleteConvenio(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseAdminClient();

  const { data: convenio } = await supabase
    .from('convenios')
    .select('logo_url,banner_grande_url,banner_chico_url')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('convenios').delete().eq('id', id);

  if (error) {
    console.error('Error deleting convenio:', error);
    return { success: false, error: 'Error al eliminar el convenio' };
  }

  if (convenio) {
    await Promise.all(
      CONVENIO_IMAGE_FIELDS.map(async (field) => {
        const imageUrl = convenio[field];
        if (imageUrl) {
          await deleteConvenioImage(imageUrl);
        }
      })
    );
  }

  revalidatePath('/');
  revalidatePath('/convenios');
  revalidatePath('/admin/convenios');

  return { success: true };
}
