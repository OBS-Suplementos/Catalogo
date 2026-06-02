import { ReactNode, Suspense } from "react";
import Image from "next/image";
import PublicHeader from "@/components/PublicHeader";
import { getBrands, getProductTypes } from "@/lib/products/actions";

export const revalidate = 60;

const SITE_URL = 'https://obssuplementos.vercel.app';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'OBS Suplementos',
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo.webp`,
      sameAs: ['https://www.instagram.com/obs.suplementos/'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'OBS Suplementos',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'es',
    },
  ],
};

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
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
              <a
                href="https://www.instagram.com/obs.suplementos/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de OBS Suplementos"
                title="Instagram de OBS Suplementos"
                className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
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
