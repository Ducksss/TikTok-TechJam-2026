import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The SynthFlag journey — Four days from research to evidence',
  description:
    'A judge-first, four-day account of SynthFlag’s experiments, Day 3 researcher interview, released four-expert detector, and 15,000-image TEST1 benchmark.',
  alternates: {
    canonical: '/journey',
  },
  openGraph: {
    title: 'Four days. One defensible detector.',
    description:
      'Follow SynthFlag from metric selection and a Day 3 research interview to rejected shortcuts, TEST1, and a low-FPR operating policy.',
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
    title: 'Four days. One defensible detector.',
    description:
      'The four-day evidence trail behind SynthFlag’s researcher interview, released review signal, and TEST1 public benchmark.',
    images: ['/og.png'],
  },
};

export default function JourneyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
