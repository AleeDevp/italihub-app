import { Toaster } from '@/components/ui/sonner';
import type { Metadata, Viewport } from 'next';

import localFont from 'next/font/local';

import { CitiesProvider } from '@/contexts/cities-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { getAllCities } from '@/lib/cache/city-cache';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

// Define the Fredoka font (variable font support is automatic)
const fredoka = localFont({
  src: '../../public/fonts/Fredoka-VariableFont_wdth,wght.ttf',
  display: 'swap', // Prevents invisible text during load
  variable: '--font-fredoka', // Creates a CSS variable for Tailwind
  weight: '300 700', // Fredoka's variable range ( covers light to black)
  style: 'normal',
  fallback: ['system-ui', 'sans-serif'], // Graceful fallback
  preload: false, // Opt-in to font preloading
});

export const metadata: Metadata = {
  title: 'Italihub App',
  description: 'created by alee',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cities = await getAllCities(); // one warm-up per Node process, then RAM

  return (
    <html lang="en" className={fredoka.variable} suppressHydrationWarning>
      <body className={`${fredoka.className} antialiased`}>
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        > */}
        <QueryProvider>
          <NotificationProvider>
            <CitiesProvider cities={cities} storageMode="session">
              {children}
            </CitiesProvider>
          </NotificationProvider>
        </QueryProvider>
        <Toaster position="top-center" />
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
