import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technical appendix — SynthFlag',
  description:
    'An evidence-labeled technical appendix for SynthFlag image processing, four-expert architecture, training, robustness results, and responsible use.',
  alternates: {
    canonical: '/documentation',
  },
  openGraph: {
    title: 'SynthFlag technical appendix',
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
    title: 'SynthFlag technical appendix',
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
