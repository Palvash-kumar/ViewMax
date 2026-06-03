'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Minus } from 'lucide-react';
import type { SeatScore, SeatComparisonResult } from '@/types';
import ScoreBar, { getScoreColor } from './ScoreBar';

interface SeatComparisonProps {
  seats: SeatScore[];
  result: SeatComparisonResult | null;
  isOpen: boolean;
  onClose: () => void;
  onRemoveSeat: (seatId: string) => void;
  onCompare: () => void;
}

const METRICS = [
  { key: 'immersionScore' as const, label: 'Immersion' },
  { key: 'comfortScore' as const, label: 'Comfort' },
  { key: 'screenCoverageScore' as const, label: 'Coverage' },
  { key: 'distanceScore' as const, label: 'Distance' },
  { key: 'centerAlignmentScore' as const, label: 'Alignment' },
  { key: 'horizontalAngleScore' as const, label: 'H. Angle' },
  { key: 'verticalAngleScore' as const, label: 'V. Angle' },
  { key: 'premiumExperienceScore' as const, label: 'Premium' },
];

export default function SeatComparison({
  seats,
  result,
  isOpen,
  onClose,
  onRemoveSeat,
  onCompare,
}: SeatComparisonProps) {
  if (!isOpen || seats.length === 0) return null;

  const comparedSeats: SeatScore[] = result?.seats || seats;
  const winner = result?.winner;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="glass-card p-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-display font-semibold text-text-primary">
            Seat Comparison
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Seat headers */}
        <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `120px repeat(${comparedSeats.length}, 1fr)` }}>
          <div />
          {comparedSeats.map((seat) => (
            <div
              key={seat.seatId}
              className="text-center relative"
            >
              {winner === seat.seatId && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  <Trophy size={14} className="text-gold-400" />
                </motion.div>
              )}
              <div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  background: winner === seat.seatId
                    ? 'rgba(245,158,11,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  border: winner === seat.seatId
                    ? '1px solid rgba(245,158,11,0.2)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span className="text-sm font-display font-bold text-text-primary">
                  {seat.seatId}
                </span>
                <button
                  onClick={() => onRemoveSeat(seat.seatId)}
                  className="text-text-muted hover:text-red-400 transition-colors"
                >
                  <Minus size={12} />
                </button>
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                {Math.round(seat.premiumExperienceScore)}/100
              </p>
            </div>
          ))}
        </div>

        {/* Metric rows */}
        <div className="space-y-2.5">
          {METRICS.map((metric) => {
            const values = comparedSeats.map((s) => s[metric.key]);
            const maxVal = Math.max(...values);

            return (
              <div
                key={metric.key}
                className="grid gap-3 items-center"
                style={{ gridTemplateColumns: `120px repeat(${comparedSeats.length}, 1fr)` }}
              >
                <span className="text-xs text-text-secondary font-medium">
                  {metric.label}
                </span>
                {comparedSeats.map((seat) => {
                  const val = seat[metric.key];
                  const isBest = val === maxVal && comparedSeats.length > 1;
                  return (
                    <div key={`${seat.seatId}-${metric.key}`} className="relative">
                      <ScoreBar
                        score={val}
                        label=""
                        size="sm"
                        showValue={false}
                      />
                      <span
                        className={`absolute right-0 -top-0.5 text-[10px] font-bold tabular-nums ${
                          isBest ? 'text-gold-400' : ''
                        }`}
                        style={{ color: isBest ? '#fbbf24' : getScoreColor(val) }}
                      >
                        {Math.round(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Insights */}
        {result?.insights && result.insights.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/5 space-y-2">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Insights
            </h4>
            {result.insights.map((insight, i) => (
              <p key={i} className="text-xs text-text-secondary leading-relaxed">
                {insight}
              </p>
            ))}
          </div>
        )}

        {/* Compare button */}
        {!result && seats.length >= 2 && (
          <div className="mt-5 pt-4 border-t border-white/5">
            <button
              onClick={onCompare}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
                border: '1px solid rgba(59,130,246,0.2)',
                color: '#93c5fd',
              }}
            >
              Compare {seats.length} Seats
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
