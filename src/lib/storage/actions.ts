'use server';

import { createServerSupabaseAdminClient } from '@/lib/supabase/server';

const PRODUCT_IMAGES_BUCKET = 'product-images';
const CONVENIO_ASSETS_BUCKET = 'convenio-assets';

type ConvenioImageKind = 'logo' | 'banner_grande' | 'banner_chico';

async function uploadImageToBucket(
  formData: FormData,
  bucketName: string,
  filePrefix: string
): Promise<{ url: string | null; error?: string }> {
  const supabase = createServerSupabaseAdminClient();

  const file = formData.get('file') as File;

  if (!file) {
    return { url: null, error: 'No se proporciono archivo' };
  }

  const validTypes = ['image/webp', 'image/avif', 'image/png', 'image/jpeg'];
  if (!validTypes.includes(file.type)) {
    return {
      url: null,
      error: 'Tipo de archivo no valido. Use WEBP, AVIF, PNG o JPEG',
    };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { url: null, error: 'El archivo es demasiado grande. Maximo 5MB' };
  }

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop() || 'webp';
  const fileName = `${filePrefix}_${timestamp}_${randomString}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading image:', error);
    return { url: null, error: 'Error al subir la imagen' };
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl };
}

async function deleteImageFromBucket(
  imageUrl: string,
  bucketName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseAdminClient();

  const parts = imageUrl.split(`/${bucketName}/`);
  const filePath = parts[1];

  if (!filePath) {
    return { success: false, error: 'URL de imagen invalida' };
  }

  const { error } = await supabase.storage.from(bucketName).remove([filePath]);

  if (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: 'Error al eliminar la imagen' };
  }

  return { success: true };
}

// Upload an image to the product images bucket.
export async function uploadImage(
  formData: FormData
): Promise<{ url: string | null; error?: string }> {
  return uploadImageToBucket(formData, PRODUCT_IMAGES_BUCKET, 'product');
}

export async function uploadConvenioImage(
  formData: FormData,
  kind: ConvenioImageKind
): Promise<{ url: string | null; error?: string }> {
  return uploadImageToBucket(
    formData,
    CONVENIO_ASSETS_BUCKET,
    `convenio_${kind}`
  );
}

// Delete an image from the product images bucket.
export async function deleteImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  return deleteImageFromBucket(imageUrl, PRODUCT_IMAGES_BUCKET);
}

export async function deleteConvenioImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  return deleteImageFromBucket(imageUrl, CONVENIO_ASSETS_BUCKET);
}

// Upload multiple product images.
export async function uploadMultipleImages(
  formData: FormData
): Promise<{ urls: string[]; errors: string[] }> {
  const files = formData.getAll('files') as File[];
  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const singleFormData = new FormData();
    singleFormData.append('file', file);

    const result = await uploadImage(singleFormData);

    if (result.url) {
      urls.push(result.url);
    } else if (result.error) {
      errors.push(`${file.name}: ${result.error}`);
    }
  }

  return { urls, errors };
}
