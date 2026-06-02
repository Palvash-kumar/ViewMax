'use client';

import { useMemo, useCallback, useRef, useState } from 'react';
import { useDesignerStore } from '@/stores/designer.store';
import type { SeatCategory } from '@/types';

const CATEGORY_FILLS: Record<SeatCategory, string> = {
  STANDARD: '#64748b',
  PREMIUM: '#a855f7',
  VIP: '#f59e0b',
  RECLINER: '#22c55e',
  WHEELCHAIR: '#3b82f6',
  CUSTOM: '#ec4899',
};

const BLOCKED_FILL = '#1e293b';
const SELECTED_STROKE = '#fbbf24';

export default function SeatCanvas() {
  const { layout, selectedSeats, selectSeats, clearSelection, toggleSeatStatus } = useDesignerStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const seatSize = 20;
  const seatGap = 4;
  const rowLabelWidth = 36;
  const topPadding = 60;
  const leftPadding = 16;

  const sortedRows = useMemo(
    () => (layout?.rows ? [...layout.rows].sort((a, b) => a.order - b.order) : []),
    [layout?.rows],
  );

  const maxSeats = useMemo(
    () => Math.max(...sortedRows.map((r) => r.seatCount), 0),
    [sortedRows],
  );

  const totalWidth = leftPadding + rowLabelWidth + maxSeats * (seatSize + seatGap) + 40;
  const totalHeight = topPadding + sortedRows.length * (seatSize + seatGap) + 60;

  const handleSeatClick = useCallback(
    (seatId: string, e: React.MouseEvent) => {
      if (e.shiftKey) {
        // Multi-select
        selectSeats(
          selectedSeats.includes(seatId)
            ? selectedSeats.filter((s) => s !== seatId)
            : [...selectedSeats, seatId],
        );
      } else if (e.altKey) {
        // Toggle status
        toggleSeatStatus(seatId);
      } else {
        selectSeats([seatId]);
      }
    },
    [selectedSeats, selectSeats, toggleSeatStatus],
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.metaKey)) {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      }
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    },
    [isPanning],
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  if (!layout) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-muted)]">
        No layout loaded
      </div>
    );
  }

  return (
    <div
      className="w-full h-full overflow-hidden bg-[var(--color-bg-primary)] relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoom indicator */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="text-[10px] font-mono text-[var(--color-text-muted)] bg-white/5 px-2 py-1 rounded-md">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] bg-white/5 px-2 py-1 rounded-md transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex gap-3 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
        {Object.entries(CATEGORY_FILLS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-[var(--color-text-muted)]">{cat}</span>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 right-3 z-10 text-[9px] text-[var(--color-text-muted)] bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
        Click: Select • Shift+Click: Multi-select • Alt+Click: Block/Unblock • Scroll: Zoom
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="w-full h-full"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center',
        }}
        onClick={(e) => {
          if (e.target === svgRef.current) clearSelection();
        }}
      >
        {/* Screen */}
        <g>
          <rect
            x={leftPadding + rowLabelWidth + (maxSeats * (seatSize + seatGap) - maxSeats * (seatSize + seatGap) * 0.7) / 2}
            y={10}
            width={maxSeats * (seatSize + seatGap) * 0.7}
            height={8}
            rx={2}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={2}
            opacity={0.6}
          />
          <text
            x={leftPadding + rowLabelWidth + (maxSeats * (seatSize + seatGap)) / 2}
            y={32}
            textAnchor="middle"
            className="text-[9px] fill-[var(--color-text-muted)]"
            fontFamily="var(--font-sans)"
          >
            SCREEN ({layout.screenConfig.width}m × {layout.screenConfig.height}m)
          </text>
        </g>

        {/* Seats */}
        {sortedRows.map((row, ri) => {
          const rowSeats = layout.seatMap.filter((s) => s.row === row.label);
          const rowY = topPadding + ri * (seatSize + seatGap);
          const rowWidth = row.seatCount * (seatSize + seatGap);
          const offsetX = (maxSeats * (seatSize + seatGap) - rowWidth) / 2;

          return (
            <g key={row.label}>
              {/* Row label */}
              <text
                x={leftPadding + 16}
                y={rowY + seatSize / 2 + 4}
                textAnchor="middle"
                className="text-[11px] font-mono font-bold fill-[var(--color-text-muted)]"
                fontFamily="var(--font-sans)"
              >
                {row.label}
              </text>

              {/* Seats in row */}
              {rowSeats
                .filter((s) => s.status !== 'REMOVED')
                .map((seat) => {
                  const seatX =
                    leftPadding +
                    rowLabelWidth +
                    offsetX +
                    (seat.seatNumber - 1) * (seatSize + seatGap);
                  const isSelected = selectedSeats.includes(seat.id);
                  const isBlocked = seat.status === 'BLOCKED';

                  return (
                    <g
                      key={seat.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeatClick(seat.id, e);
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x={seatX}
                        y={rowY}
                        width={seatSize}
                        height={seatSize}
                        rx={4}
                        fill={isBlocked ? BLOCKED_FILL : CATEGORY_FILLS[seat.category]}
                        opacity={isBlocked ? 0.4 : 0.85}
                        stroke={isSelected ? SELECTED_STROKE : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                      <text
                        x={seatX + seatSize / 2}
                        y={rowY + seatSize / 2 + 3.5}
                        textAnchor="middle"
                        className="text-[7px] fill-white pointer-events-none"
                        fontFamily="var(--font-sans)"
                        opacity={0.7}
                      >
                        {seat.seatNumber}
                      </text>
                    </g>
                  );
                })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
