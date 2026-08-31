import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Engineering architecture — SynthFlag technical appendix',
  description:
    'A source-checked architecture atlas for SynthFlag serving, model loading, tensor contracts, operational states, and resumable batch inference.',
  alternates: {
    canonical: '/documentation/architecture',
  },
  openGraph: {
    title: 'SynthFlag engineering architecture atlas',
    description:
      'Eleven source-checked diagrams covering browser requests, exact CLIP and SigLIP internals, external DINOv3 challenge context, checkpoint-backed inference, and durable batch output.',
    type: 'article',
    url: '/documentation/architecture',
    images: [
      {
        url: '/og.png',
        width: 1728,
        height: 911,
        alt: 'SynthFlag — From pixels to evidence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SynthFlag engineering architecture atlas',
    description:
      'Serving topology, runtime lifecycle, checkpoint integrity, tensor flow, release boundaries, and operations.',
    images: ['/og.png'],
  },
};

export default function ArchitectureLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
