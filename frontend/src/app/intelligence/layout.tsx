import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cinema Intelligence — ViewMax',
  description:
    'Discover the perfect seat with ViewMax Cinema Intelligence. Analyze viewing quality, screen coverage, immersion, and comfort for every seat in the theatre.',
  keywords: [
    'cinema intelligence',
    'seat analysis',
    'IMAX',
    'viewing experience',
    'seat recommendation',
    'ViewMax',
  ],
};

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
