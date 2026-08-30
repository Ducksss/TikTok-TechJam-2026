import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test an image — SynthFlag',
  description:
    'Upload an image and inspect SynthFlag’s four-expert AI-generation probability.',
};

export default function TryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
