import type { Metadata } from 'next';
import { GetStartedPageClient } from './client';

const baseUrl = process.env.NEXT_PUBLIC_HOST_SERVICE_URL || 'https://curia.network';

export const metadata: Metadata = {
  title: 'Get Started - Curia Web3 Forum Embeds',
  description: 'Configure, customize, and deploy your Web3 forum embed in minutes. No signup required—just configure and deploy.',
  openGraph: {
    title: 'Get Started - Curia Web3 Forum Embeds',
    description: 'Configure, customize, and deploy your Web3 forum embed in minutes. No signup required—just configure and deploy.',
    images: [
      {
        url: '/api/og?type=get-started',
        width: 1200,
        height: 630,
        alt: 'Get Started with Curia Web3 Forum Embeds',
      }
    ],
    url: `${baseUrl}/get-started`,
    siteName: 'Curia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get Started - Curia Web3 Forum Embeds',
    description: 'Configure, customize, and deploy your Web3 forum embed in minutes.',
    images: ['/api/og?type=get-started'],
  },
};

export default function GetStartedPage() {
  return <GetStartedPageClient />;
} 