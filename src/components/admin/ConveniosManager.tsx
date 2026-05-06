'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  createConvenio,
  deleteConvenio,
  getConvenios,
  updateConvenio,
  updateConveniosOrder,
} from '@/lib/convenios/actions';
import { uploadConvenioImage } from '@/lib/storage/actions';
import { Button, Card, CardContent, CardHeader, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import ConvenioBanner from '@/components/ConvenioBanner';
import { Convenio, ConvenioBannerMode, ConvenioPayload } from '@/types';

interface ConveniosManagerProps {
  initialConvenios: Convenio[];
}

type ConvenioImageKind = 'logo' | 'banner_grande' | 'banner_chico';

function withSequentialOrder(convenios: Convenio[]) {
  return convenios.map((convenio, index) => ({
    ...convenio,
    orden: index + 1,
  }));
}

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function useObjectUrl(file: File | null) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setObjectUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return objectUrl;
}

export default function ConveniosManager({
  initialConvenios,
}: ConveniosManagerProps) {
  const { addToast } = useToast();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const desktopBannerInputRef = useRef<HTMLInputElement>(null);
  const mobileBannerInputRef = useRef<HTMLInputElement>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const [convenios, setConvenios] = useState(() =>
    withSequentialOrder(initialConvenios)
  );
  const [editingConvenio, setEditingConvenio] = useState<Convenio | null>(null);
  const [nombre, setNombre] = useState('');
  const [descuento, setDescuento] = useState('0');
  const [linkUrl, setLinkUrl] = useState('');
  const [bannerModo, setBannerModo] =
    useState<ConvenioBannerMode>('placeholder');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [desktopBannerUrl, setDesktopBannerUrl] = useState<string | null>(null);
  const [mobileBannerUrl, setMobileBannerUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [desktopBannerFile, setDesktopBannerFile] = useState<File | null>(null);
  const [mobileBannerFile, setMobileBannerFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const logoPreviewUrl = useObjectUrl(logoFile);
  const desktopBannerPreviewUrl = useObjectUrl(desktopBannerFile);
  const mobileBannerPreviewUrl = useObjectUrl(mobileBannerFile);

  const previewConvenio = useMemo<Convenio>(
    () => ({
      id: editingConvenio?.id || 0,
      nombre: nombre.trim() || 'Nombre del convenio',
      descuento: Number.parseInt(descuento, 10) || 0,
      logo_url: logoPreviewUrl || logoUrl,
      link_url: normalizeExternalUrl(linkUrl) || '#',
      banner_grande_url: desktopBannerPreviewUrl || desktopBannerUrl,
      banner_chico_url: mobileBannerPreviewUrl || mobileBannerUrl,
      banner_modo: bannerModo,
    }),
    [
      bannerModo,
      desktopBannerPreviewUrl,
      desktopBannerUrl,
      descuento,
      editingConvenio?.id,
      linkUrl,
      logoPreviewUrl,
      logoUrl,
      mobileBannerPreviewUrl,
      mobileBannerUrl,
      nombre,
    ]
  );

  const scrollToForm = () => {
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const resetForm = () => {
    setEditingConvenio(null);
    setNombre('');
    setDescuento('0');
    setLinkUrl('');
    setBannerModo('placeholder');
    setLogoUrl(null);
    setDesktopBannerUrl(null);
    setMobileBannerUrl(null);
    setLogoFile(null);
    setDesktopBannerFile(null);
    setMobileBannerFile(null);
    setErrors({});
    setUploadProgress('');

    if (logoInputRef.current) logoInputRef.current.value = '';
    if (desktopBannerInputRef.current) desktopBannerInputRef.current.value = '';
    if (mobileBannerInputRef.current) mobileBannerInputRef.current.value = '';
  };

  const refreshConvenios = async () => {
    const { data } = await getConvenios();
    setConvenios(withSequentialOrder(data));
  };

  const startEditing = (convenio: Convenio) => {
    setEditingConvenio(convenio);
    setNombre(convenio.nombre);
    setDescuento(String(convenio.descuento));
    setLinkUrl(convenio.link_url);
    setBannerModo(convenio.banner_modo);
    setLogoUrl(convenio.logo_url || null);
    setDesktopBannerUrl(convenio.banner_grande_url || null);
    setMobileBannerUrl(convenio.banner_chico_url || null);
    setLogoFile(null);
    setDesktopBannerFile(null);
    setMobileBannerFile(null);
    setErrors({});

    if (logoInputRef.current) logoInputRef.current.value = '';
    if (desktopBannerInputRef.current) desktopBannerInputRef.current.value = '';
    if (mobileBannerInputRef.current) mobileBannerInputRef.current.value = '';

    scrollToForm();
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const discountNumber = Number(descuento);

    if (!nombre.trim()) {
      nextErrors.nombre = 'El nombre es requerido';
    }

    if (
      !Number.isFinite(discountNumber) ||
      discountNumber < 0 ||
      discountNumber > 100
    ) {
      nextErrors.descuento = 'El descuento debe estar entre 0 y 100';
    }

    if (!linkUrl.trim()) {
      nextErrors.linkUrl = 'El link es requerido';
    } else {
      try {
        new URL(normalizeExternalUrl(linkUrl));
      } catch {
        nextErrors.linkUrl = 'El link debe ser una URL valida';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const uploadSelectedFile = async (
    file: File | null,
    kind: ConvenioImageKind
  ) => {
    if (!file) {
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadConvenioImage(formData, kind);

    if (!result.url) {
      throw new Error(result.error || 'Error al subir la imagen');
    }

    return result.url;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('');

    try {
      let nextLogoUrl = logoUrl;
      let nextDesktopBannerUrl = desktopBannerUrl;
      let nextMobileBannerUrl = mobileBannerUrl;

      if (logoFile) {
        setUploadProgress('Subiendo logo...');
        nextLogoUrl = await uploadSelectedFile(logoFile, 'logo');
      }

      if (desktopBannerFile) {
        setUploadProgress('Subiendo banner grande...');
        nextDesktopBannerUrl = await uploadSelectedFile(
          desktopBannerFile,
          'banner_grande'
        );
      }

      if (mobileBannerFile) {
        setUploadProgress('Subiendo banner chico...');
        nextMobileBannerUrl = await uploadSelectedFile(
          mobileBannerFile,
          'banner_chico'
        );
      }

      const payload: ConvenioPayload = {
        nombre: nombre.trim(),
        descuento: Math.round(Number(descuento)),
        logo_url: nextLogoUrl || null,
        link_url: linkUrl,
        banner_grande_url: nextDesktopBannerUrl || null,
        banner_chico_url: nextMobileBannerUrl || null,
        banner_modo: bannerModo,
      };

      setUploadProgress(
        editingConvenio ? 'Actualizando convenio...' : 'Creando convenio...'
      );

      const result = editingConvenio
        ? await updateConvenio(editingConvenio.id, payload)
        : await createConvenio(payload);

      if (result.error || !result.data) {
        addToast(result.error || 'Error al guardar el convenio', 'error');
        return;
      }

      addToast(
        editingConvenio
          ? 'Convenio actualizado correctamente'
          : 'Convenio creado correctamente',
        'success'
      );
      await refreshConvenios();
      resetForm();
    } catch (error) {
      console.error(error);
      addToast(
        error instanceof Error ? error.message : 'Error al guardar el convenio',
        'error'
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleDelete = async (convenio: Convenio) => {
    if (!confirm(`Eliminar el convenio "${convenio.nombre}"?`)) {
      return;
    }

    setDeletingId(convenio.id);
    const result = await deleteConvenio(convenio.id);
    setDeletingId(null);

    if (!result.success) {
      addToast(result.error || 'Error al eliminar el convenio', 'error');
      return;
    }

    addToast('Convenio eliminado correctamente', 'success');
    await refreshConvenios();

    if (editingConvenio?.id === convenio.id) {
      resetForm();
    }
  };

  const moveConvenioToPosition = (id: number, nextPosition: number) => {
    const currentIndex = convenios.findIndex((convenio) => convenio.id === id);

    if (currentIndex === -1) {
      return;
    }

    const nextIndex = Math.max(
      0,
      Math.min(nextPosition - 1, convenios.length - 1)
    );

    if (nextIndex === currentIndex) {
      return;
    }

    const nextConvenios = [...convenios];
    const [selectedConvenio] = nextConvenios.splice(currentIndex, 1);
    nextConvenios.splice(nextIndex, 0, selectedConvenio);
    setConvenios(withSequentialOrder(nextConvenios));
  };

  const sortConveniosByDiscount = (direction: 'asc' | 'desc') => {
    const nextConvenios = [...convenios].sort((firstConvenio, secondConvenio) => {
      const discountDifference =
        direction === 'desc'
          ? secondConvenio.descuento - firstConvenio.descuento
          : firstConvenio.descuento - secondConvenio.descuento;

      if (discountDifference !== 0) {
        return discountDifference;
      }

      return firstConvenio.nombre.localeCompare(secondConvenio.nombre);
    });

    setConvenios(withSequentialOrder(nextConvenios));
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);

    const result = await updateConveniosOrder(
      convenios.map((convenio) => convenio.id)
    );

    setIsSavingOrder(false);

    if (!result.success) {
      addToast(result.error || 'Error al guardar el orden', 'error');
      return;
    }

    addToast('Orden guardado correctamente', 'success');
    await refreshConvenios();
  };

  const imageInputClass = 'hidden';
  const imageAccept = 'image/webp,image/avif,image/png,image/jpeg';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Convenios</h1>
        <p className="text-muted-foreground">
          Gestiona los banners publicitarios del home y la pagina de convenios.
        </p>
      </div>

      <div ref={formSectionRef} className="scroll-mt-20">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {editingConvenio ? 'Editar convenio' : 'Nuevo convenio'}
            </h2>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Nombre *"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Nombre de la empresa"
                error={errors.nombre}
              />

              <Input
                label="Descuento % *"
                type="number"
                min="0"
                max="100"
                value={descuento}
                onChange={(event) => setDescuento(event.target.value)}
                error={errors.descuento}
              />

              <div className="lg:col-span-2">
                <Input
                  label="Link *"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="instagram.com/empresa o https://empresa.com"
                  error={errors.linkUrl}
                  helperText="Si no escribis http o https, se agregara https:// automaticamente."
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-md border border-border p-4">
                <div className="mb-3">
                  <h3 className="font-medium">Logo</h3>
                  <p className="text-sm text-muted-foreground">
                    Recomendado: WEBP o AVIF, imagen cuadrada 1:1.
                  </p>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={logoPreviewUrl || logoUrl || '/images/placeholder_imagen.svg'}
                      alt="Preview logo"
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-muted-foreground">
                      {logoFile?.name || logoUrl || 'Sin logo cargado'}
                    </p>
                  </div>
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept={imageAccept}
                  className={imageInputClass}
                  onChange={(event) =>
                    setLogoFile(event.target.files?.[0] || null)
                  }
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    Subir logo
                  </Button>
                  {(logoUrl || logoFile) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLogoUrl(null);
                        setLogoFile(null);
                        if (logoInputRef.current) logoInputRef.current.value = '';
                      }}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-border p-4">
                <div className="mb-3">
                  <h3 className="font-medium">Banner grande</h3>
                  <p className="text-sm text-muted-foreground">
                    Recomendado: WEBP o AVIF, 1160x174 o proporcion 580:87.
                  </p>
                </div>

                <input
                  ref={desktopBannerInputRef}
                  type="file"
                  accept={imageAccept}
                  className={imageInputClass}
                  onChange={(event) =>
                    setDesktopBannerFile(event.target.files?.[0] || null)
                  }
                />
                <div className="mb-4 text-sm text-muted-foreground">
                  {desktopBannerFile?.name ||
                    desktopBannerUrl ||
                    'Sin banner grande cargado'}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => desktopBannerInputRef.current?.click()}
                  >
                    Subir banner
                  </Button>
                  {(desktopBannerUrl || desktopBannerFile) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDesktopBannerUrl(null);
                        setDesktopBannerFile(null);
                        if (desktopBannerInputRef.current) {
                          desktopBannerInputRef.current.value = '';
                        }
                      }}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-border p-4">
                <div className="mb-3">
                  <h3 className="font-medium">Banner chico</h3>
                  <p className="text-sm text-muted-foreground">
                    Recomendado: WEBP o AVIF, 350x104 o proporcion 290:87.
                  </p>
                </div>

                <input
                  ref={mobileBannerInputRef}
                  type="file"
                  accept={imageAccept}
                  className={imageInputClass}
                  onChange={(event) =>
                    setMobileBannerFile(event.target.files?.[0] || null)
                  }
                />
                <div className="mb-4 text-sm text-muted-foreground">
                  {mobileBannerFile?.name ||
                    mobileBannerUrl ||
                    'Sin banner chico cargado'}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => mobileBannerInputRef.current?.click()}
                  >
                    Subir banner
                  </Button>
                  {(mobileBannerUrl || mobileBannerFile) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMobileBannerUrl(null);
                        setMobileBannerFile(null);
                        if (mobileBannerInputRef.current) {
                          mobileBannerInputRef.current.value = '';
                        }
                      }}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-medium">Como mostrar el banner</h3>
                <p className="text-sm text-muted-foreground">
                  Podes usar el placeholder generado o las imagenes subidas.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-md border p-3 ${
                    bannerModo === 'placeholder'
                      ? 'border-accent bg-accent-light'
                      : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="banner_modo"
                    value="placeholder"
                    checked={bannerModo === 'placeholder'}
                    onChange={() => setBannerModo('placeholder')}
                    className="mr-2"
                  />
                  Usar placeholder
                </label>
                <label
                  className={`cursor-pointer rounded-md border p-3 ${
                    bannerModo === 'imagen'
                      ? 'border-accent bg-accent-light'
                      : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="banner_modo"
                    value="imagen"
                    checked={bannerModo === 'imagen'}
                    onChange={() => setBannerModo('imagen')}
                    className="mr-2"
                  />
                  Usar imagen subida
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Preview</p>
                <ConvenioBanner convenio={previewConvenio} />
              </div>
            </div>
          </CardContent>

          <div className="flex flex-col gap-3 border-t border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              {editingConvenio ? 'Cancelar edicion' : 'Limpiar'}
            </Button>
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              {uploadProgress ||
                (editingConvenio ? 'Guardar cambios' : 'Crear convenio')}
            </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Orden en /convenios</h2>
              <p className="text-sm text-muted-foreground">
                Elegi el orden manualmente o acomoda por porcentaje.
              </p>
            </div>
            <span className="text-sm text-muted-foreground">
              {convenios.length} total
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {convenios.length <= 1 ? (
            <p className="py-6 text-center text-muted-foreground">
              Agrega mas convenios para ordenar la lista.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sortConveniosByDiscount('desc')}
                    disabled={isSavingOrder}
                  >
                    % mayor a menor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sortConveniosByDiscount('asc')}
                    disabled={isSavingOrder}
                  >
                    % menor a mayor
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={handleSaveOrder}
                  isLoading={isSavingOrder}
                >
                  Guardar orden
                </Button>
              </div>

              <div className="space-y-2">
                {convenios.map((convenio, index) => (
                  <div
                    key={convenio.id}
                    className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={
                            convenio.logo_url || '/images/placeholder_imagen.svg'
                          }
                          alt={`Logo de ${convenio.nombre}`}
                          fill
                          className="object-contain"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{convenio.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {convenio.descuento}% de descuento
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Orden</span>
                      <select
                        value={index + 1}
                        onChange={(event) =>
                          moveConvenioToPosition(
                            convenio.id,
                            Number(event.target.value)
                          )
                        }
                        disabled={isSavingOrder}
                        className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {convenios.map((optionConvenio, optionIndex) => (
                          <option
                            key={optionConvenio.id}
                            value={optionIndex + 1}
                          >
                            {optionIndex + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Convenios cargados</h2>
            <span className="text-sm text-muted-foreground">
              {convenios.length} total
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {convenios.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Todavia no hay convenios cargados.
            </p>
          ) : (
            <div className="space-y-4">
              {convenios.map((convenio) => (
                <div
                  key={convenio.id}
                  className="rounded-md border border-border p-3"
                >
                  <ConvenioBanner convenio={convenio} />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={
                            convenio.logo_url || '/images/placeholder_imagen.svg'
                          }
                          alt={`Logo de ${convenio.nombre}`}
                          fill
                          className="object-contain"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{convenio.nombre}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {convenio.link_url}
                        </p>
                      </div>
                      <span className="badge-accent flex-shrink-0">
                        -{convenio.descuento}%
                      </span>
                    </div>

                    <div className="flex gap-2 sm:flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(convenio)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(convenio)}
                        disabled={deletingId === convenio.id}
                      >
                        {deletingId === convenio.id ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
