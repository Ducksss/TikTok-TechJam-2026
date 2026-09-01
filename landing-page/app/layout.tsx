import type { Metadata } from 'next';
import { Instrument_Sans, Poppins } from 'next/font/google';

import './globals.css';

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'SynthFlag — From pixels to evidence',
  description:
    'A routed residual research detector built on a frozen Tu et al. Expert 4 representation.',
  metadataBase: new URL('https://synthflag.chaipinzheng353496.chatgpt.site'),
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'SynthFlag — From pixels to evidence',
    description: 'One frozen teacher. Three residual heads. One review signal.',
    type: 'website',
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
    title: 'SynthFlag — From pixels to evidence',
    description: 'A routed residual research detector with evidence attached.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${poppins.variable}`}>
        {children}
      </body>
    </html>
  );
}
