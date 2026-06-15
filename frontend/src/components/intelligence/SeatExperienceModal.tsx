'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Ruler,
  Eye,
  Armchair,
  Monitor,
  Target,
  ArrowUpDown,
  ArrowLeftRight,
  Star,
  GitCompareArrows,
  Sparkles,
} from 'lucide-react';
import type { SeatScore, SeatExplanation } from '@/types';
import ScoreBar, { getScoreColor } from './ScoreBar';
import MetricRadarChart from './MetricRadarChart';

interface SeatExperienceModalProps {
  seat: SeatScore;
  explanation: SeatExplanation | null;
  isOpen: boolean;
  onClose: () => void;
  onCompare: (seat: SeatScore) => void;
  onFetchExplanation: (seatScoreId: string) => void;
}

const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; glow: string; label: string }
> = {
  ELITE: {
    bg: 'rgba(34,197,94,0.15)',
    text: '#4ade80',
    glow: '0 0 20px rgba(34,197,94,0.2)',
    label: 'Elite',
  },
  EXCELLENT: {
    bg: 'rgba(59,130,246,0.15)',
    text: '#60a5fa',
    glow: '0 0 20px rgba(59,130,246,0.2)',
    label: 'Excellent',
  },
  RECOMMENDED: {
    bg: 'rgba(234,179,8,0.15)',
    text: '#facc15',
    glow: '0 0 20px rgba(234,179,8,0.2)',
    label: 'Recommended',
  },
  AVERAGE: {
    bg: 'rgba(249,115,22,0.15)',
    text: '#fb923c',
    glow: '0 0 20px rgba(249,115,22,0.2)',
    label: 'Average',
  },
  AVOID: {
    bg: 'rgba(239,68,68,0.15)',
    text: '#f87171',
    glow: '0 0 20px rgba(239,68,68,0.2)',
    label: 'Avoid',
  },
};

export default function SeatExperienceModal({
  seat,
  explanation,
  isOpen,
  onClose,
  onCompare,
  onFetchExplanation,
}: SeatExperienceModalProps) {
  const catStyle = CATEGORY_STYLES[seat.category] || CATEGORY_STYLES.AVERAGE;

  useEffect(() => {
    if (isOpen && seat._id) {
      onFetchExplanation(seat._id);
    }
  }, [isOpen, seat._id, onFetchExplanation]);

  const radarMetrics = [
    { label: 'Distance', value: seat.distanceScore },
    { label: 'H.Angle', value: seat.horizontalAngleScore },
    { label: 'V.Angle', value: seat.verticalAngleScore },
    { label: 'Alignment', value: seat.centerAlignmentScore },
    { label: 'Coverage', value: seat.screenCoverageScore },
    { label: 'Immersion', value: seat.immersionScore },
    { label: 'Comfort', value: seat.comfortScore },
    { label: 'Premium', value: seat.premiumExperienceScore },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[580px] sm:max-h-[85vh] z-50 overflow-y-auto rounded-2xl"
            style={{
              background: 'var(--color-bg-card)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--color-border)',
              boxShadow:
                '0 25px 60px rgba(15,23,42,0.1), 0 0 40px rgba(30,64,175,0.05)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-5 border-b border-white/5"
              style={{ boxShadow: catStyle.glow }}
            >
              <div className="flex items-center gap-4">
                {/* Seat ID badge */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-display font-bold"
                  style={{
                    background: catStyle.bg,
                    color: catStyle.text,
                    boxShadow: catStyle.glow,
                  }}
                >
                  {seat.seatId}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-display font-semibold text-text-primary">
                      Seat Experience
                    </h2>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: catStyle.bg,
                        color: catStyle.text,
                      }}
                    >
                      {catStyle.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Row {seat.row} · Seat {seat.seatNumber} · {seat.screenType.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-muted hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-6">
              {/* Premium Score */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="inline-flex flex-col items-center"
                >
                  <span className="text-xs text-text-muted uppercase tracking-widest mb-1">
                    Premium Experience Score
                  </span>
                  <span
                    className="text-5xl font-display font-bold tabular-nums"
                    style={{ color: getScoreColor(seat.premiumExperienceScore) }}
                  >
                    {Math.round(seat.premiumExperienceScore)}
                  </span>
                  <span className="text-xs text-text-muted">/100</span>
                </motion.div>
              </div>

              {/* Radar Chart */}
              <div className="flex justify-center">
                <MetricRadarChart metrics={radarMetrics} size={240} />
              </div>

              {/* Raw Measurements */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: <Ruler size={14} />,
                    label: 'Distance',
                    value: `${seat.distanceMeters.toFixed(1)}m`,
                  },
                  {
                    icon: <ArrowLeftRight size={14} />,
                    label: 'H. Angle',
                    value: `${seat.horizontalAngleDegrees.toFixed(1)}°`,
                  },
                  {
                    icon: <ArrowUpDown size={14} />,
                    label: 'V. Angle',
                    value: `${seat.verticalAngleDegrees.toFixed(1)}°`,
                  },
                  {
                    icon: <Monitor size={14} />,
                    label: 'FOV Coverage',
                    value: `${seat.screenCoverageFovPercent.toFixed(1)}%`,
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ background: 'var(--color-bg-tertiary)' }}
                  >
                    <span className="text-text-muted">{item.icon}</span>
                    <div>
                      <p className="text-[10px] text-text-muted">{item.label}</p>
                      <p className="text-sm font-semibold text-text-primary tabular-nums">
                        {item.value}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Score Bars */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Detailed Scores
                </h3>
                <ScoreBar score={seat.distanceScore} label="Distance" delay={0.1} />
                <ScoreBar score={seat.horizontalAngleScore} label="Horizontal Angle" delay={0.15} />
                <ScoreBar score={seat.verticalAngleScore} label="Vertical Angle" delay={0.2} />
                <ScoreBar score={seat.centerAlignmentScore} label="Center Alignment" delay={0.25} />
                <ScoreBar score={seat.screenCoverageScore} label="Screen Coverage" delay={0.3} />
                <div className="border-t border-white/5 pt-3 mt-3">
                  <ScoreBar score={seat.immersionScore} label="Immersion" size="lg" delay={0.35} />
                </div>
                <ScoreBar score={seat.comfortScore} label="Comfort" size="lg" delay={0.4} />
                <ScoreBar
                  score={seat.premiumExperienceScore}
                  label="Premium Experience"
                  size="lg"
                  delay={0.45}
                />
              </div>

              {/* Explanation */}
              {explanation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                      Analysis
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {explanation.explanation}
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => onCompare(seat)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(168,85,247,0.1)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    color: '#c084fc',
                  }}
                >
                  <GitCompareArrows size={16} />
                  Add to Comparison
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
