'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, Armchair, Monitor, BarChart3 } from 'lucide-react';
import type { SeatScore, HeatmapEntry, HeatmapMode } from '@/types';

interface SeatHeatmapProps {
  scores: SeatScore[];
  heatmapData: HeatmapEntry[];
  heatmapMode: HeatmapMode;
  onModeChange: (mode: HeatmapMode) => void;
  onSeatClick: (seat: SeatScore) => void;
  selectedSeatId?: string;
  comparisonSeatIds?: string[];
}

const MODE_CONFIG: {
  mode: HeatmapMode;
  label: string;
  icon: React.ReactNode;
}[] = [
  { mode: 'overall', label: 'Overall', icon: <BarChart3 size={14} /> },
  { mode: 'immersion', label: 'Immersion', icon: <Eye size={14} /> },
  { mode: 'comfort', label: 'Comfort', icon: <Armchair size={14} /> },
  { mode: 'coverage', label: 'Coverage', icon: <Monitor size={14} /> },
];

const CATEGORY_LABELS: Record<string, string> = {
  ELITE: 'Elite',
  EXCELLENT: 'Excellent',
  RECOMMENDED: 'Recommended',
  AVERAGE: 'Average',
  AVOID: 'Avoid',
};

export default function SeatHeatmap({
  scores,
  heatmapData,
  heatmapMode,
  onModeChange,
  onSeatClick,
  selectedSeatId,
  comparisonSeatIds = [],
}: SeatHeatmapProps) {
  // Build lookup maps
  const heatmapMap = useMemo(() => {
    const map = new Map<string, HeatmapEntry>();
    heatmapData.forEach((h) => map.set(h.seatId, h));
    return map;
  }, [heatmapData]);

  const scoreMap = useMemo(() => {
    const map = new Map<string, SeatScore>();
    scores.forEach((s) => map.set(s.seatId, s));
    return map;
  }, [scores]);

  // Group seats by row
  const rows = useMemo(() => {
    const rowMap = new Map<string, SeatScore[]>();
    for (const s of scores) {
      if (!rowMap.has(s.row)) rowMap.set(s.row, []);
      rowMap.get(s.row)!.push(s);
    }
    // Sort rows alphabetically, seats by number
    const sortedRows = [...rowMap.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    sortedRows.forEach(([, seats]) =>
      seats.sort((a, b) => a.seatNumber - b.seatNumber),
    );
    return sortedRows;
  }, [scores]);

  if (scores.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Monitor className="mx-auto mb-3 text-text-muted" size={40} />
        <p className="text-text-secondary">No scores calculated yet.</p>
        <p className="text-text-muted text-sm mt-1">
          Calculate scores to see the heatmap.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-display font-semibold text-text-primary">
            Seat Intelligence Heatmap
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Click any seat to view detailed analysis
          </p>
        </div>
        {/* Mode Toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
          {MODE_CONFIG.map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                heatmapMode === mode
                  ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                  : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Screen indicator */}
      <div className="flex justify-center mb-6">
        <div
          className="h-1.5 rounded-full"
          style={{
            width: `${Math.min(80, Math.max(40, rows[0]?.[1]?.length * 3 || 60))}%`,
            background: 'linear-gradient(90deg, rgba(59,130,246,0.1), rgba(59,130,246,0.4), rgba(59,130,246,0.1))',
            boxShadow: '0 0 20px rgba(59,130,246,0.15)',
          }}
        />
      </div>
      <p className="text-center text-[10px] text-text-muted mb-6 -mt-4 tracking-widest uppercase">
        Screen
      </p>

      {/* Seat Grid */}
      <div className="flex flex-col items-center gap-1.5 overflow-x-auto pb-4">
        {rows.map(([rowLabel, seats], ri) => (
          <div key={rowLabel} className="flex items-center gap-1">
            {/* Row label */}
            <span className="w-6 text-right text-[10px] font-mono text-text-muted mr-2 flex-shrink-0">
              {rowLabel}
            </span>
            {/* Seats */}
            {seats.map((seat, si) => {
              const heatEntry = heatmapMap.get(seat.seatId);
              const isSelected = seat.seatId === selectedSeatId;
              const isComparing = comparisonSeatIds.includes(seat.seatId);
              const color = heatEntry?.color || '#1e293b';
              const score = heatEntry?.score ?? 0;

              return (
                <motion.button
                  key={seat.seatId}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: ri * 0.02 + si * 0.008,
                    duration: 0.3,
                  }}
                  onClick={() => onSeatClick(seat)}
                  className={`relative w-7 h-7 rounded-md text-[8px] font-bold transition-all duration-200 cursor-pointer flex-shrink-0 flex items-center justify-center ${
                    isSelected
                      ? 'ring-2 ring-gold-400 ring-offset-1 ring-offset-bg-primary scale-110 z-10'
                      : isComparing
                        ? 'ring-2 ring-purple-400 ring-offset-1 ring-offset-bg-primary'
                        : 'hover:scale-110 hover:z-10'
                  }`}
                  style={{
                    backgroundColor: `${color}cc`,
                    boxShadow: isSelected
                      ? `0 0 12px ${color}80`
                      : `0 0 4px ${color}30`,
                    color:
                      score >= 60
                        ? 'rgba(0,0,0,0.7)'
                        : 'rgba(255,255,255,0.7)',
                  }}
                  title={`${seat.seatId}: ${Math.round(score)}/100 — ${CATEGORY_LABELS[heatEntry?.category || 'AVERAGE']}`}
                >
                  {seat.seatNumber}
                </motion.button>
              );
            })}
            {/* Row label (right) */}
            <span className="w-6 text-left text-[10px] font-mono text-text-muted ml-2 flex-shrink-0">
              {rowLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-white/5">
        {[
          { label: 'Elite', color: '#22c55e' },
          { label: 'Excellent', color: '#3b82f6' },
          { label: 'Recommended', color: '#eab308' },
          { label: 'Average', color: '#f97316' },
          { label: 'Avoid', color: '#ef4444' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
