import type { Metadata } from 'next';
import { DemoPageClient } from './client';

const baseUrl = process.env.NEXT_PUBLIC_HOST_SERVICE_URL || 'https://curia.network';

export const metadata: Metadata = {
  title: 'Demo - Curia Web3 Forum Embeds',
  description: 'Interactive demo showing real forum functionality and features. See Curia in action with live Web3 forum embed.',
  openGraph: {
    title: 'Demo - Curia Web3 Forum Embeds',
    description: 'Interactive demo showing real forum functionality and features. See Curia in action with live Web3 forum embed.',
    images: [
      {
        url: '/api/og?type=demo',
        width: 1200,
        height: 630,
        alt: 'Demo - Curia Web3 Forum Embeds',
      }
    ],
    url: `${baseUrl}/demo`,
    siteName: 'Curia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Demo - Curia Web3 Forum Embeds',
    description: 'Interactive demo showing real forum functionality and features.',
    images: ['/api/og?type=demo'],
  },
};

export default function DemoPage() {
  return <DemoPageClient />;
} 