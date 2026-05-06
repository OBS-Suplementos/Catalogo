import { ReactNode, Suspense } from "react";
import Image from "next/image";
import PublicHeader from "@/components/PublicHeader";
import { getBrands, getProductTypes } from "@/lib/products/actions";

export const revalidate = 60;

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [{ data: brands }, { data: types }] = await Promise.all([
    getBrands(),
    getProductTypes(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="h-16 border-b border-border" />}>
        <PublicHeader brands={brands || []} types={types || []} />
      </Suspense>
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 mt-auto">
        <div className="container-custom py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 overflow-hidden rounded-lg">
                <Image
                  src="/images/logo.webp"
                  alt="Suplementos Logo"
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <span className="font-semibold">Suplementos</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} OBS Suplementos. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
