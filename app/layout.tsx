import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';
import { ToastProvider } from '../context/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PlatformHelpChatbot from '../components/PlatformHelpChatbot';

export const metadata: Metadata = {
  title: 'HunarAangan - Artisan Marketplace',
  description: 'Trilingual Marketplace for Female Artisans & Creators in Pakistan',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <ToastProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Header />
              <main style={{ flex: 1, paddingBottom: '2rem' }}>
                {children}
              </main>
              <Footer />
              <PlatformHelpChatbot />
            </div>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

