'use client';

import { Eye, RotateCcw, Maximize2, Armchair, Rows3 } from 'lucide-react';
import type { CameraPreset } from '@/types';

interface ViewControlsProps {
  presets: CameraPreset[];
  activePreset: string;
  onPresetChange: (preset: CameraPreset) => void;
  totalSeats: number;
  totalRows: number;
}

export default function ViewControls({
  presets,
  activePreset,
  onPresetChange,
  totalSeats,
  totalRows,
}: ViewControlsProps) {
  return (
    <>
      {/* Camera presets (top-right) */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onPresetChange(preset)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
              activePreset === preset.name
                ? 'bg-[var(--color-gold-500)]/20 text-[var(--color-gold-400)] border border-[var(--color-gold-500)]/30'
                : 'bg-black/40 backdrop-blur-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-black/60 border border-transparent'
            }`}
          >
            <Eye className="w-3 h-3" />
            {preset.name}
          </button>
        ))}
      </div>

      {/* Stats (bottom-left) */}
      <div className="absolute bottom-3 left-3 flex gap-3 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
        <div className="flex items-center gap-1.5">
          <Armchair className="w-3 h-3 text-[var(--color-gold-400)]" />
          <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">
            {totalSeats} seats
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Rows3 className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">
            {totalRows} rows
          </span>
        </div>
      </div>

      {/* Legend (bottom-right) */}
      <div className="absolute bottom-3 right-3 flex gap-3 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
        {[
          { color: '#64748b', label: 'Standard' },
          { color: '#a855f7', label: 'Premium' },
          { color: '#f59e0b', label: 'VIP' },
          { color: '#22c55e', label: 'Recliner' },
          { color: '#3b82f6', label: 'Wheelchair' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-[var(--color-text-muted)]">{label}</span>
          </div>
        ))}
      </div>

      {/* Controls hint (top-left) */}
      <div className="absolute top-3 left-3 text-[9px] text-[var(--color-text-muted)] bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
        Drag: Rotate • Scroll: Zoom • Right-drag: Pan
      </div>
    </>
  );
}
