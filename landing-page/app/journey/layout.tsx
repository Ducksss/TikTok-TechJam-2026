import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The SynthFlag journey — Decisions, evidence, and final model',
  description:
    'A judge-first account of how SynthFlag moved from an open-world detection problem to a released four-expert review signal.',
  alternates: {
    canonical: '/journey',
  },
  openGraph: {
    title: 'How SynthFlag became SynthFlag',
    description:
      'Follow the experiments, rejected ideas, protected evidence, and released four-expert model.',
    type: 'article',
    url: '/journey',
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
    title: 'How SynthFlag became SynthFlag',
    description:
      'The decisions and evidence behind SynthFlag’s released review signal.',
    images: ['/og.png'],
  },
};

export default function JourneyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
