'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Rocket } from 'lucide-react';
import api from '@/lib/axios';
import type { Theatre3DDataResponse } from '@/types';

const TheatreViewer = dynamic(
  () => import('@/components/theatre3d/TheatreViewer'),
  { ssr: false },
);

interface PageProps {
  params: Promise<{ theatreId: string; screenId: string }>;
}

export default function PreviewPage({ params }: PageProps) {
  const { theatreId, screenId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<Theatre3DDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: layoutsRes } = await api.get(
          `/theatre-design/theatres/${theatreId}/layouts`,
        );
        const layouts = layoutsRes.data || layoutsRes;
        const layout = layouts.find(
          (l: any) => l.screenId === screenId || l.screenId?._id === screenId,
        );

        if (!layout) {
          setError('No layout found for this screen');
          return;
        }

        const { data: viewer3D } = await api.get(
          `/theatre-design/layouts/${layout._id}/3d-data`,
        );
        setData(viewer3D.data || viewer3D);
      } catch {
        setError('Failed to load 3D preview');
      } finally {
        setLoading(false);
      }
    })();
  }, [theatreId, screenId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--color-gold-500)]/30 border-t-[var(--color-gold-500)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading 3D preview...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-muted)]">{error || 'No 3D data available'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-[var(--color-gold-400)] hover:underline cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-primary)]">
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-14 border-b border-[var(--color-border)] flex items-center px-4 gap-3"
        style={{ background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(16px)' }}>
        <button
          onClick={() => router.push('/owner')}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </button>

        <div className="w-px h-6 bg-[var(--color-border)]" />

        <h1 className="text-sm font-semibold">{data.layout.layoutName}</h1>

        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
          data.layout.status === 'PUBLISHED'
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-blue-500/20 text-blue-300'
        }`}>
          {data.layout.status}
        </span>

        <div className="flex-1" />

        <button
          onClick={() => router.push(`/owner/theatres/${theatreId}/screens/${screenId}/designer`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-white/10 transition-all cursor-pointer"
        >
          <Pencil className="w-3 h-3" /> Edit
        </button>
      </div>

      {/* 3D Viewer */}
      <div className="absolute inset-0 pt-14">
        <TheatreViewer data={data} />
      </div>
    </div>
  );
}
