import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technical appendix — SynthFlag',
  description:
    'An evidence-labeled guide to SynthFlag’s frozen Expert 4 teacher, routed residual heads, TEST1 results, runtime, and limits.',
  alternates: {
    canonical: '/documentation',
  },
  openGraph: {
    title: 'SynthFlag technical appendix',
    description:
      'Understand the selected Expert 4 plus three-head detector from pixels to its routed score signal.',
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
