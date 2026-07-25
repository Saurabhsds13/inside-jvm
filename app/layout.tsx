import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'InsideJVM — Interactive JVM Learning Platform',
    template: '%s | InsideJVM',
  },
  description:
    'The most interactive JVM learning platform on the web. Visualize how the Java Virtual Machine works — class loading, memory management, garbage collection, JIT compilation, and more — with live animations and simulations.',
  keywords: [
    'JVM',
    'Java Virtual Machine',
    'Java internals',
    'JVM architecture',
    'garbage collection',
    'heap vs stack',
    'class loader',
    'JIT compiler',
    'Java memory model',
    'Java threads',
    'G1 GC',
    'ZGC',
    'Java interview',
  ],
  authors: [{ name: 'Saurabh Sonawane', url: 'https://github.com/Saurabhsds13' }],
  creator: 'Saurabh Sonawane',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://saurabhsds13.github.io/inside-jvm',
    title: 'InsideJVM — Interactive JVM Learning Platform',
    description:
      'Visualize how the Java Virtual Machine works with live animations and interactive simulations.',
    siteName: 'InsideJVM',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InsideJVM — Interactive JVM Learning Platform',
    description: 'Visualize JVM internals with live animations. Class loading, GC, JIT, threads, and more.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#080e1a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
