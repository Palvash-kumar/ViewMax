'use client';

import { Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';
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

export default function RowPanel() {
  const {
    layout,
    selectedRow,
    addRow,
    removeRow,
    updateRow,
    selectRow,
    addAisle,
    removeAisle,
    addZone,
    removeZone,
  } = useDesignerStore();

  if (!layout) return null;

  return (
    <div className="p-4 space-y-6">
      {/* Rows Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Rows ({layout.rows.length})
          </h3>
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)] hover:bg-[var(--color-gold-500)]/20 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>

        <div className="space-y-1">
          {layout.rows
            .sort((a, b) => a.order - b.order)
            .map((row) => (
              <div
                key={row.label}
                onClick={() => selectRow(selectedRow === row.label ? null : row.label)}
                className={`group flex items-center gap-2 p-2.5 rounded-lg transition-all cursor-pointer ${
                  selectedRow === row.label
                    ? 'bg-[var(--color-gold-500)]/10 border border-[var(--color-gold-500)]/30'
                    : 'bg-white/[0.02] hover:bg-white/5 border border-transparent'
                }`}
              >
                <GripVertical className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Category dot */}
                <div className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[row.category]}`} />

                {/* Row label */}
                <span className="text-sm font-mono font-semibold text-[var(--color-text-primary)] w-6">
                  {row.label}
                </span>

                {/* Seat count */}
                <span className="text-xs text-[var(--color-text-muted)] flex-1">
                  {row.seatCount} seats
                </span>

                {/* Category badge */}
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-white/5 text-[var(--color-text-muted)]">
                  {row.category}
                </span>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRow(row.label);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-crimson-500)]/10 text-[var(--color-crimson-400)] transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Row Editor (when row selected) */}
      {selectedRow && (() => {
        const row = layout.rows.find((r) => r.label === selectedRow);
        if (!row) return null;
        return (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--color-border)] space-y-3">
            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">
              Row {row.label} Settings
            </h4>

            {/* Seat count */}
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">Seats</label>
              <input
                type="number"
                value={row.seatCount}
                onChange={(e) => updateRow(row.label, { seatCount: Math.max(1, parseInt(e.target.value) || 1) })}
                min={1}
                max={80}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-gold-500)]/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">Category</label>
              <div className="relative">
                <select
                  value={row.category}
                  onChange={(e) => updateRow(row.label, { category: e.target.value as SeatCategory })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-gold-500)]/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              </div>
            </div>

            {/* Offset */}
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">Horizontal Offset</label>
              <input
                type="number"
                value={row.offset}
                onChange={(e) => updateRow(row.label, { offset: parseFloat(e.target.value) || 0 })}
                step={0.1}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-gold-500)]/50 focus:outline-none transition-colors"
              />
            </div>
          </div>
        );
      })()}

      {/* Divider */}
      <div className="border-t border-[var(--color-border)]" />

      {/* Aisles Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Aisles ({layout.aisles.length})
          </h3>
          <button
            onClick={() => addAisle({ position: Math.floor(layout.rows[0]?.seatCount / 2) || 8, type: 'CENTER', width: 1.0 })}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        <div className="space-y-1.5">
          {layout.aisles.map((aisle, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-transparent hover:border-[var(--color-border)] transition-all">
              <span className="text-xs text-[var(--color-text-muted)] flex-1">
                {aisle.type} @ seat {aisle.position}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {aisle.width}m
              </span>
              <button
                onClick={() => removeAisle(i)}
                className="p-1 rounded hover:bg-[var(--color-crimson-500)]/10 text-[var(--color-crimson-400)] transition-all cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)]" />

      {/* Zones Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Zones ({layout.zones.length})
          </h3>
          <button
            onClick={() => addZone({ name: 'New Zone', type: 'VIP', rows: [], color: '#f59e0b' })}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        <div className="space-y-1.5">
          {layout.zones.map((zone, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: zone.color }} />
              <span className="text-xs text-[var(--color-text-primary)] flex-1">{zone.name}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">{zone.type}</span>
              <button
                onClick={() => removeZone(i)}
                className="p-1 rounded hover:bg-[var(--color-crimson-500)]/10 text-[var(--color-crimson-400)] transition-all cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
