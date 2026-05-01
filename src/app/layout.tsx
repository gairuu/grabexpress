import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'GrabExpress — Fast & Reliable Delivery',
  description: 'Book instant package deliveries with GrabExpress. Fast, reliable, and affordable.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
