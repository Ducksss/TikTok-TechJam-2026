import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technical appendix — SynthFlag',
  description:
    'A unified, evidence-labeled technical guide to SynthFlag image processing, four-expert architecture, system runtime, results, and responsible use.',
  alternates: {
    canonical: '/documentation',
  },
  openGraph: {
    title: 'SynthFlag technical appendix',
    description:
      'Understand the four-expert AI-image detector from pixels and patch tokens to its runtime and score signal.',
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
      'A unified guide to SynthFlag’s processing, architecture atlas, runtime, evidence, and limits.',
    images: ['/og.png'],
  },
};

export default function DocumentationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
