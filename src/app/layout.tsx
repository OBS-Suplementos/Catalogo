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

export const metadata: Metadata = {
  title: 'OBS Suplementos | Catálogo',
  description:
    'Descubre nuestra amplia selección de suplementos deportivos para potenciar tu rendimiento. Proteínas, creatina, pre-entrenos y más.',
  icons: {
    icon: '/images/logo.webp',
    shortcut: '/images/logo.webp',
    apple: '/images/logo.webp',
  },
  keywords: [
    'suplementos',
    'proteínas',
    'fitness',
    'gimnasio',
    'deportes',
    'nutrición deportiva',
  ],
  openGraph: {
    title: 'OBS Suplementos | Catálogo',
    description: 'Tu tienda online de suplementos deportivos',
    type: 'website',
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
