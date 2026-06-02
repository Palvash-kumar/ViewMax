'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import type { Theatre3DDataResponse } from '@/types';

const TheatreViewer = dynamic(
  () => import('@/components/theatre3d/TheatreViewer'),
  { ssr: false },
);

interface PageProps {
  params: Promise<{ layoutId: string }>;
}

export default function PublicViewerPage({ params }: PageProps) {
  const { layoutId } = use(params);
  const [data, setData] = useState<Theatre3DDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await api.get(
          `/theatre-design/public/layouts/${layoutId}/3d-data`,
        );
        setData(res.data || res);
      } catch {
        setError('Theatre not found or not published yet');
      } finally {
        setLoading(false);
      }
    })();
  }, [layoutId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--color-gold-500)]/30 border-t-[var(--color-gold-500)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading theatre...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            Theatre Not Found
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-[var(--color-gold-400)] hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </Link>
          <div>
            <h1 className="text-lg font-bold font-[var(--font-display)]">
              {data.layout.layoutName}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              {data.layout.totalCapacity} seats • {data.layout.totalRows} rows • {data.layout.screenConfig.aspectRatio}
            </p>
          </div>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="h-[calc(100vh-8rem)]">
        <TheatreViewer data={data} />
      </div>
    </div>
  );
}
