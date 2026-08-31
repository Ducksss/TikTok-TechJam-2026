import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The SynthFlag journey — Three days from research to release',
  description:
    'A judge-first, three-day account of how SynthFlag moved from backbone exploration to a protected result, released four-expert detector, and bounded research roadmap.',
  alternates: {
    canonical: '/journey',
  },
  openGraph: {
    title: 'Three days. One defensible detector.',
    description:
      'Follow SynthFlag from metric selection and robustness testing to rejected shortcuts, product integration, and the released model.',
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
    title: 'Three days. One defensible detector.',
    description:
      'The three-day evidence trail behind SynthFlag’s released review signal.',
    images: ['/og.png'],
  },
};

export default function JourneyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
