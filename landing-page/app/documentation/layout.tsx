import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technical appendix — SynthFlag',
  description:
    'A unified, evidence-labeled guide to SynthFlag’s interview-derived future work, four-expert architecture, TEST1 results, runtime, and responsible use.',
  alternates: {
    canonical: '/documentation',
  },
  openGraph: {
    title: 'SynthFlag technical appendix',
    description:
      'Understand the released detector, Day 3 research interview, separate 15,000-image TEST1 benchmark, and low-FPR operating boundary.',
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
      'A unified guide to SynthFlag’s research interview, architecture atlas, TEST1 evidence, runtime, and limits.',
    images: ['/og.png'],
  },
};

export default function DocumentationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
