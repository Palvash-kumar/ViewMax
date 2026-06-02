'use client';

import { Monitor, Armchair, Rows3, ChevronDown } from 'lucide-react';
import { useDesignerStore } from '@/stores/designer.store';
import type { SeatCategory } from '@/types';

const CATEGORY_COLORS: Record<SeatCategory, string> = {
  STANDARD: 'bg-slate-500',
  PREMIUM: 'bg-purple-500',
  VIP: 'bg-[var(--color-gold-500)]',
  RECLINER: 'bg-emerald-500',
  WHEELCHAIR: 'bg-blue-500',
  CUSTOM: 'bg-pink-500',
};

const CATEGORIES: SeatCategory[] = ['STANDARD', 'PREMIUM', 'VIP', 'RECLINER', 'WHEELCHAIR'];

export default function PropertiesPanel() {
  const {
    layout,
    selectedSeats,
    updateSeatCategory,
    updateScreenConfig,
  } = useDesignerStore();

  if (!layout) return null;

  // Count seats by category
  const categoryBreakdown = layout.seatMap.reduce(
    (acc, seat) => {
      if (seat.status === 'ACTIVE') {
        acc[seat.category] = (acc[seat.category] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const selectedSeatData = layout.seatMap.filter((s) => selectedSeats.includes(s.id));

  return (
    <div className="p-4 space-y-6">
      {/* Selected seats */}
      {selectedSeatData.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            Selected ({selectedSeatData.length})
          </h3>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--color-border)] space-y-3">
            {selectedSeatData.length === 1 && (
              <div>
                <span className="text-lg font-bold font-mono text-[var(--color-text-primary)]">
                  {selectedSeatData[0].id}
                </span>
                <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                  Row {selectedSeatData[0].row}, Seat {selectedSeatData[0].seatNumber}
                </span>
              </div>
            )}

            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">Category</label>
              <div className="relative">
                <select
                  value={selectedSeatData.length === 1 ? selectedSeatData[0].category : ''}
                  onChange={(e) => updateSeatCategory(selectedSeats, e.target.value as SeatCategory)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-gold-500)]/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {selectedSeatData.length > 1 && <option value="">Mixed</option>}
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Configuration */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" /> Screen
        </h3>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--color-border)] space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">Width (m)</label>
              <input
                type="number"
                value={layout.screenConfig.width}
                onChange={(e) => updateScreenConfig({ width: parseFloat(e.target.value) || 14 })}
                step={0.5}
                min={1}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-gold-500)]/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">Height (m)</label>
              <input
                type="number"
                value={layout.screenConfig.height}
                onChange={(e) => updateScreenConfig({ height: parseFloat(e.target.value) || 6 })}
                step={0.5}
                min={1}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-gold-500)]/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">Aspect Ratio</label>
            <input
              type="text"
              value={layout.screenConfig.aspectRatio}
              onChange={(e) => updateScreenConfig({ aspectRatio: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-gold-500)]/50 focus:outline-none transition-colors font-mono"
              placeholder="2.39:1"
            />
          </div>

          <div>
            <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">Elevation (m)</label>
            <input
              type="number"
              value={layout.screenConfig.elevation}
              onChange={(e) => updateScreenConfig({ elevation: parseFloat(e.target.value) || 1.5 })}
              step={0.5}
              min={0}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-gold-500)]/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Layout Summary */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5">
          <Armchair className="w-3.5 h-3.5" /> Summary
        </h3>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--color-border)] space-y-3">
          {/* Total stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-lg bg-white/[0.03]">
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {layout.totalCapacity}
              </p>
              <p className="text-[9px] text-[var(--color-text-muted)] uppercase">Total Seats</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/[0.03]">
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {layout.totalRows}
              </p>
              <p className="text-[9px] text-[var(--color-text-muted)] uppercase">Rows</p>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="space-y-2">
            <h4 className="text-[10px] text-[var(--color-text-muted)] uppercase font-medium">
              By Category
            </h4>
            {Object.entries(categoryBreakdown).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-sm ${CATEGORY_COLORS[cat as SeatCategory] || 'bg-gray-500'}`} />
                <span className="text-xs text-[var(--color-text-secondary)] flex-1">{cat}</span>
                <span className="text-xs font-mono font-semibold text-[var(--color-text-primary)]">
                  {count}
                </span>
              </div>
            ))}
          </div>

          {/* Blocked seats */}
          {layout.seatMap.filter((s) => s.status === 'BLOCKED').length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#1e293b] border border-white/10" />
              <span className="text-xs text-[var(--color-text-secondary)] flex-1">Blocked</span>
              <span className="text-xs font-mono text-[var(--color-text-muted)]">
                {layout.seatMap.filter((s) => s.status === 'BLOCKED').length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
