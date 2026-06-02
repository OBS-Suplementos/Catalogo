import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import GoogleAnalytics from '@/components/GoogleAnalytics';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

const SITE_URL = 'https://obssuplementos.vercel.app';
const SITE_DESCRIPTION =
  'Catálogo online de OBS Suplementos. Encontrá proteínas, creatinas, pre entrenos, aminoácidos, vitaminas y más productos para entrenamiento y nutrición deportiva.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'OBS Suplementos | Catálogo de suplementos deportivos',
    template: '%s | OBS Suplementos',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'OBS Suplementos',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/images/logo.webp',
    shortcut: '/images/logo.webp',
    apple: '/images/logo.webp',
  },
  keywords: [
    'suplementos',
    'proteínas',
    'creatina',
    'pre entreno',
    'aminoácidos',
    'vitaminas',
    'nutrición deportiva',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'OBS Suplementos | Catálogo de suplementos deportivos',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'OBS Suplementos',
    type: 'website',
    locale: 'es_AR',
    images: [
      {
        url: '/images/logo.webp',
        alt: 'OBS Suplementos',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'OBS Suplementos | Catálogo de suplementos deportivos',
    description: SITE_DESCRIPTION,
    images: ['/images/logo.webp'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable} data-scroll-behavior="smooth">
      <body>
        <GoogleAnalytics />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
