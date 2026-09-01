import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test an image or video — SynthFlag',
  description:
    'Analyze an image or eight locally sampled video frames with SynthFlag’s selected routed residual detector.',
};

export default function TryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
