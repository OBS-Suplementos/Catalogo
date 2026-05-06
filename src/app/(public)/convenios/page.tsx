import Image from 'next/image';
import ConvenioBanner from '@/components/ConvenioBanner';
import { getConvenios } from '@/lib/convenios/actions';

export const dynamic = 'force-dynamic';

export default async function ConveniosPage() {
  const { data: convenios, error } = await getConvenios();

  return (
    <div className="container-custom max-w-5xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Convenios activos</h1>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-accent-light p-4 text-accent">
          {error}
        </div>
      )}

      {convenios.length === 0 ? (
        <div className="rounded-md border border-border p-8 text-center text-muted-foreground">
          Todavia no hay convenios activos.
        </div>
      ) : (
        <div className="space-y-5">
          {convenios.map((convenio) => (
            <a
              key={convenio.id}
              href={convenio.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-all duration-200 hover:border-muted-foreground/30 hover:shadow-md"
              aria-label={`Abrir convenio ${convenio.nombre}`}
            >
              <ConvenioBanner convenio={convenio} />

              <div className="flex items-center gap-3 border-t border-border p-4">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={convenio.logo_url || '/images/placeholder_imagen.svg'}
                    alt={`Logo de ${convenio.nombre}`}
                    fill
                    className="object-contain"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{convenio.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    Convenio con {convenio.descuento}% de descuento
                  </p>
                </div>
                <span className="badge-accent flex-shrink-0">
                  -{convenio.descuento}%
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
