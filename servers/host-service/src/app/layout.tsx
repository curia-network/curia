import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryProvider } from "@/contexts/QueryProvider";

const baseUrl = process.env.NEXT_PUBLIC_HOST_SERVICE_URL || 'https://curia.network';

export const metadata: Metadata = {
  title: "Curia - Web3 Forum Embeds",
  description: "Embed beautiful Web3 forums with advanced gating and community features. Perfect for Discord, websites, and Web3 apps.",
  metadataBase: new URL(baseUrl),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#3b82f6' },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'Curia',
    statusBarStyle: 'default',
    capable: true,
  },
  openGraph: {
    title: "Curia - Web3 Forum Embeds",
    description: "Embed beautiful Web3 forums with advanced gating and community features. Perfect for Discord, websites, and Web3 apps.",
    images: [
      {
        url: '/api/og?type=landing',
        width: 1200,
        height: 630,
        alt: 'Curia Web3 Forum Embeds',
      },
      {
        url: '/api/og?type=landing',
        width: 1200,
        height: 630,
        alt: 'Curia Web3 Forum Embeds',
      }
    ],
    url: baseUrl,
    siteName: 'Curia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Curia - Web3 Forum Embeds',
    description: 'Embed beautiful Web3 forums with advanced gating and community features.',
    images: ['/api/og?type=landing'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden">
        <QueryProvider>
          <ThemeProvider
            defaultTheme="system"
            enableSystem
            attribute="class"
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
} 