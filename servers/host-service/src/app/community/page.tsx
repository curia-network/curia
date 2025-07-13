import type { Metadata } from 'next';
import { CommunityPageClient } from './client';

const baseUrl = process.env.NEXT_PUBLIC_HOST_SERVICE_URL || 'https://curia.network';

export const metadata: Metadata = {
  title: 'Community - Curia Web3 Forum Embeds',
  description: 'Connect with developers building the future of Web3 communities. Join our live community forum.',
  openGraph: {
    title: 'Community - Curia Web3 Forum Embeds',
    description: 'Connect with developers building the future of Web3 communities. Join our live community forum.',
    images: [
      {
        url: '/api/og?type=community',
        width: 1200,
        height: 630,
        alt: 'Community - Curia Web3 Forum Embeds',
      }
    ],
    url: `${baseUrl}/community`,
    siteName: 'Curia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community - Curia Web3 Forum Embeds',
    description: 'Connect with developers building the future of Web3 communities.',
    images: ['/api/og?type=community'],
  },
};

export default function CommunityPage() {
  return <CommunityPageClient />;
} 