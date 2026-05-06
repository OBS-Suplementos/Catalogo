'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product, ProductPayload, Brand, ProductType } from '@/types';
import { createProduct, updateProduct } from '@/lib/products/actions';
import { getBrands } from '@/lib/brands/actions';
import { getProductTypes } from '@/lib/product-types/actions';
import { uploadMultipleImages, deleteImage } from '@/lib/storage/actions';
import { Button, Input, Textarea } from '@/components/ui';
import Card, { CardContent, CardHeader, CardFooter } from '@/components/ui/Card';

interface ProductFormProps {
  product?: Product;
  isEditing?: boolean;
}

export default function ProductForm({
  product,
  isEditing = false,
}: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [nombre, setNombre] = useState(product?.nombre || '');
  const [descripcion, setDescripcion] = useState(product?.descripcion || '');
  const [precio, setPrecio] = useState(product?.precio?.toString() || '');
  const [descuento, setDescuento] = useState(
    product?.descuento?.toString() || '0'
  );
  const [existingImages, setExistingImages] = useState<string[]>(
    product?.imagenes || []
  );
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // Brands & Types
  const [brands, setBrands] = useState<Brand[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>(product?.brand_id?.toString() || '');
  const [selectedType, setSelectedType] = useState<string>(product?.type_id?.toString() || '');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!precio || parseFloat(precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
    }

    const descuentoNum = parseInt(descuento);
    if (isNaN(descuentoNum) || descuentoNum < 0 || descuentoNum > 100) {
      newErrors.descuento = 'El descuento debe estar entre 0 y 100';
    }

    const totalImages =
      existingImages.length - imagesToDelete.length + newImages.length;
    // No min requirement anymore
    if (totalImages > 5) {
      newErrors.imagenes = 'Máximo 5 imágenes permitidas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      const [brandsRes, typesRes] = await Promise.all([
        getBrands(),
        getProductTypes()
      ]);
      setBrands(brandsRes.data || []);
      setTypes(typesRes.data || []);
    };
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Filter valid files
    const validFiles = files.filter((file) => {
      const validTypes = ['image/webp', 'image/avif', 'image/png', 'image/jpeg'];
      return validTypes.includes(file.type);
    });

    setNewImages((prev) => [...prev, ...validFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const markImageForDeletion = (url: string) => {
    setImagesToDelete((prev) => [...prev, url]);
    setExistingImages((prev) => prev.filter((img) => img !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload new images
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        setUploadProgress('Subiendo imágenes...');
        const formData = new FormData();
        newImages.forEach((file) => formData.append('files', file));

        const uploadResult = await uploadMultipleImages(formData);
        uploadedUrls = uploadResult.urls;

        if (uploadResult.errors.length > 0) {
          console.warn('Some uploads failed:', uploadResult.errors);
        }
      }

      // Combine remaining existing images with new uploads
      const finalImages = [...existingImages, ...uploadedUrls];

      const payload: ProductPayload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        descuento: parseInt(descuento),
        imagenes: finalImages,
        brand_id: selectedBrand ? parseInt(selectedBrand) : null,
        type_id: selectedType ? parseInt(selectedType) : null,
      };

      setUploadProgress(isEditing ? 'Actualizando producto...' : 'Creando producto...');

      let result;
      if (isEditing && product) {
        result = await updateProduct(product.id, payload);
      } else {
        result = await createProduct(payload);
      }

      if (result.error) {
        if (uploadedUrls.length > 0) {
          for (const url of uploadedUrls) {
            const deleteResult = await deleteImage(url);
            if (deleteResult.error) {
              console.warn('Error cleaning up uploaded product image:', deleteResult.error);
            }
          }
        }

        setError(result.error);
      } else {
        // Delete old product images only after the database update succeeds.
        if (imagesToDelete.length > 0) {
          setUploadProgress('Eliminando imagenes antiguas...');
          for (const url of imagesToDelete) {
            const deleteResult = await deleteImage(url);
            if (deleteResult.error) {
              console.warn('Error deleting old product image:', deleteResult.error);
            }
          }
        }

        router.push('/admin/productos');
        router.refresh();
      }
    } catch (err) {
      setError('Error al procesar la solicitud. Intente nuevamente.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const totalImages =
    existingImages.length - imagesToDelete.length + newImages.length;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-accent-light text-accent rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del producto *"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Proteína Whey Premium"
              error={errors.nombre}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Precio *"
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                error={errors.precio}
              />

              <Input
                label="Descuento %"
                type="number"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                error={errors.descuento}
              />
            </div>

            {/* Brands and Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Marca</label>
                <select 
                  className="w-full h-10 px-3 py-2 rounded-md border text-background bg-foreground focus:ring-2 focus:ring-primary"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="">Selecciona una marca</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

               <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <select 
                  className="w-full h-10 px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="">Selecciona un tipo</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Textarea
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe el producto..."
            rows={4}
          />

          {/* Images */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">
                Imágenes ({totalImages}/5)
              </label>
              <span className="text-xs text-muted-foreground">
                Máximo 5 imágenes. (0 para usar placeholder)
              </span>
            </div>

            {errors.imagenes && (
              <p className="text-sm text-accent">{errors.imagenes}</p>
            )}

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {existingImages.map((url, index) => (
                  <div
                    key={url}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                  >
                    <Image
                      src={url}
                      alt={`Imagen ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = [...existingImages];
                          const [moved] = newImages.splice(index, 1);
                          newImages.unshift(moved);
                          setExistingImages(newImages);
                        }}
                        className="absolute top-2 left-2 p-1 bg-primary/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Usar como portada"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => markImageForDeletion(url)}
                      className="absolute top-2 right-2 p-1 bg-accent text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar imagen"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New images preview */}
            {newImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {newImages.map((file, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                  >
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Nueva imagen ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <span className="badge bg-green-500 text-white">Nueva</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 p-1 bg-accent text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Quitar imagen"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {totalImages < 5 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/webp,image/avif,image/png,image/jpeg"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Agregar Imágenes
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos: WEBP, AVIF, PNG, JPEG. Tamaño recomendado: 500x500px
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="accent"
            isLoading={isSubmitting}
          >
            {uploadProgress || (isEditing ? 'Guardar Cambios' : 'Crear Producto')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
