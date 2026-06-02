'use client';

import { ArrowLeft, Save, Box, Rocket, Loader2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDesignerStore } from '@/stores/designer.store';

interface DesignerToolbarProps {
  theatreId: string;
}

export default function DesignerToolbar({ theatreId }: DesignerToolbarProps) {
  const router = useRouter();
  const {
    layout,
    viewMode,
    setViewMode,
    isDirty,
    isSaving,
    isGenerating,
    saveLayout,
    generateLayout,
    publishLayout,
  } = useDesignerStore();

  if (!layout) return null;

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-500/20 text-slate-300',
    GENERATING: 'bg-amber-500/20 text-amber-300',
    PREVIEW: 'bg-blue-500/20 text-blue-300',
    PUBLISHED: 'bg-emerald-500/20 text-emerald-300',
  };

  return (
    <div className="h-full flex items-center px-4 gap-3">
      {/* Back */}
      <button
        onClick={() => router.push('/owner')}
        className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        title="Back to Dashboard"
      >
        <ArrowLeft className="w-4 h-4 text-[var(--color-text-secondary)]" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-[var(--color-border)]" />

      {/* Layout name */}
      <h1 className="text-sm font-semibold text-[var(--color-text-primary)] truncate max-w-[200px]">
        {layout.layoutName}
      </h1>

      {/* Status badge */}
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${statusColors[layout.status] || statusColors.DRAFT}`}>
        {layout.status}
      </span>

      {isDirty && (
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* View toggle */}
      <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
        <button
          onClick={() => setViewMode('2d')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            viewMode === '2d'
              ? 'bg-[var(--color-gold-500)]/20 text-[var(--color-gold-400)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          2D
        </button>
        <button
          onClick={() => setViewMode('3d')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            viewMode === '3d'
              ? 'bg-[var(--color-gold-500)]/20 text-[var(--color-gold-400)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <Box className="w-3 h-3 inline-block mr-1" />
          3D
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-[var(--color-border)]" />

      {/* Save */}
      <button
        onClick={saveLayout}
        disabled={!isDirty || isSaving}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-white/10 hover:border-[var(--color-border-hover)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save
      </button>

      {/* Generate 3D */}
      <button
        onClick={generateLayout}
        disabled={isGenerating || layout.rows.length === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
        Generate 3D
      </button>

      {/* Publish */}
      {layout.status === 'PREVIEW' && (
        <button
          onClick={publishLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-600)] text-[var(--color-bg-primary)] hover:shadow-lg hover:shadow-[var(--color-gold-500)]/20 transition-all cursor-pointer"
        >
          <Rocket className="w-3.5 h-3.5" />
          Publish
        </button>
      )}
    </div>
  );
}
