import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How SynthFlag works — Documentation',
  description:
    'A plain-language, evidence-labeled guide to SynthFlag’s image processing, four-expert architecture, training, robustness results, and responsible use.',
  alternates: {
    canonical: '/documentation',
  },
  openGraph: {
    title: 'How SynthFlag works — Documentation',
    description:
      'Understand the four-expert AI-image detector, from pixels to a probability-like score.',
    type: 'article',
    url: '/documentation',
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
    title: 'How SynthFlag works — Documentation',
    description:
      'A plain-language guide to SynthFlag’s processing, architecture, training, evidence, and limits.',
    images: ['/og.png'],
  },
};

export default function DocumentationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
