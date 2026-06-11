'use client';

import { useState, useEffect } from 'react';
import { Eye, Armchair, Rows3, Info, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showInfo, setShowInfo] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  return (
    <>
      {/* Camera presets (top-right on desktop, horizontal scroll at top on mobile) */}
      <div 
        className="absolute top-3 right-3 left-3 md:left-auto flex flex-row md:flex-col gap-1.5 overflow-x-auto justify-end z-10 pb-1.5 md:pb-0 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onPresetChange(preset)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
              activePreset === preset.name
                ? 'bg-[var(--color-gold-500)]/20 text-[var(--color-gold-400)] border border-[var(--color-gold-500)]/30'
                : 'bg-black/60 backdrop-blur-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-black/80 border border-transparent'
            }`}
          >
            <Eye className="w-3 h-3" />
            {preset.name}
          </button>
        ))}
      </div>

      {/* Controls hint (top-left) - Desktop only */}
      <div className="hidden md:block absolute top-3 left-3 text-[9px] text-[var(--color-text-muted)] bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
        Drag: Rotate • Scroll: Zoom • Right-drag: Pan
      </div>

      {/* Stats (bottom-left) - Desktop only */}
      <div className="hidden md:flex absolute bottom-3 left-3 flex gap-3 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
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

      {/* Legend (bottom-right) - Desktop only */}
      <div className="hidden md:flex absolute bottom-3 right-3 flex gap-3 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
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

      {/* Mobile Info Toggle Button */}
      <button
        onClick={() => setShowInfo(true)}
        className="md:hidden absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[var(--color-gold-400)] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-lg z-10"
      >
        <Info className="w-4 h-4" />
        Info & Legend
      </button>

      {/* Mobile Details Popover / Bottom Sheet */}
      <AnimatePresence>
        {showInfo && (
          <>
            {/* Backdrop to close the modal */}
            <div 
              className="md:hidden fixed inset-0 z-20 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowInfo(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden absolute bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-2xl border-t border-white/10 rounded-t-2xl p-4 shadow-2xl flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[var(--color-gold-400)]" />
                  <h3 className="text-sm font-bold text-white font-[var(--font-display)]">Theater Details</h3>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <Armchair className="w-4 h-4 text-[var(--color-gold-400)]" />
                  <div>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Total Capacity</p>
                    <p className="text-xs font-mono font-bold text-[var(--color-text-secondary)]">{totalSeats} seats</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Rows3 className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Row Layout</p>
                    <p className="text-xs font-mono font-bold text-[var(--color-text-secondary)]">{totalRows} rows</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div>
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold mb-2">Seat Categories</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { color: '#64748b', label: 'Standard' },
                    { color: '#a855f7', label: 'Premium' },
                    { color: '#f59e0b', label: 'VIP' },
                    { color: '#22c55e', label: 'Recliner' },
                    { color: '#3b82f6', label: 'Wheelchair' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interaction Help */}
              <div className="text-[10px] text-[var(--color-text-muted)] bg-white/5 px-3 py-2 rounded-lg border border-white/5 text-center font-medium">
                Navigation Guide: {isTouchDevice ? 'Drag: Rotate • Pinch: Zoom' : 'Drag: Rotate • Scroll: Zoom • Right-drag: Pan'}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
