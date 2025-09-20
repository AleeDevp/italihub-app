import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata, Viewport } from 'next';

import localFont from 'next/font/local';

import './globals.css';

// Define the Fredoka font (variable font support is automatic)
const fredoka = localFont({
  src: './fonts/Fredoka-VariableFont_wdth,wght.ttf',
  display: 'swap', // Prevents invisible text during load
  variable: '--font-fredoka', // Creates a CSS variable for Tailwind
  weight: '300 700', // Fredoka's variable range ( covers light to black)
  style: 'normal',
  fallback: ['system-ui', 'sans-serif'], // Graceful fallback
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
  return (
    <html lang="en" className={fredoka.variable} suppressHydrationWarning>
      <body className={`${fredoka.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
