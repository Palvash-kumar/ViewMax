'use client';

import { motion } from 'framer-motion';
import { MapPin, Sparkles, ArrowRight } from 'lucide-react';
import type { PersonalizedRecommendation, SeatRankEntry } from '@/types';
import { getScoreColor } from './ScoreBar';

interface RecommendationCardProps {
  recommendation: PersonalizedRecommendation;
  onViewSeat: (seatId: string) => void;
}

function SeatChip({
  entry,
  isPrimary,
  onSelect,
}: {
  entry: SeatRankEntry;
  isPrimary?: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
        isPrimary ? 'col-span-full' : ''
      }`}
      style={{
        background: isPrimary
          ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))'
          : 'rgba(255,255,255,0.03)',
        border: isPrimary
          ? '1px solid rgba(245,158,11,0.2)'
          : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Score circle */}
      <div
        className={`${isPrimary ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-sm'} rounded-xl flex items-center justify-center font-display font-bold flex-shrink-0`}
        style={{
          background: `${getScoreColor(entry.premiumExperienceScore)}15`,
          color: getScoreColor(entry.premiumExperienceScore),
          border: `1px solid ${getScoreColor(entry.premiumExperienceScore)}25`,
        }}
      >
        {entry.seatId}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span
            className={`${isPrimary ? 'text-base' : 'text-sm'} font-display font-bold text-text-primary`}
          >
            {Math.round(entry.premiumExperienceScore)}/100
          </span>
          {isPrimary && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-400">
              Best Match
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-0.5">
          <span className="text-[10px] text-text-muted">
            Imm: {Math.round(entry.immersionScore)}
          </span>
          <span className="text-[10px] text-text-muted">
            Com: {Math.round(entry.comfortScore)}
          </span>
          <span className="text-[10px] text-text-muted">
            Cov: {Math.round(entry.screenCoverageScore)}
          </span>
        </div>
      </div>
      <ArrowRight size={14} className="text-text-muted flex-shrink-0" />
    </motion.button>
  );
}

export default function RecommendationCard({
  recommendation,
  onViewSeat,
}: RecommendationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header gradient */}
      <div
        className="px-5 py-4"
        style={{
          background:
            'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-blue-400" />
          <h3 className="text-base font-display font-semibold text-text-primary">
            Your Recommendation
          </h3>
        </div>
        <p className="text-xs text-text-muted">
          Based on your preferences
        </p>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Primary recommendation */}
        <SeatChip
          entry={recommendation.primary}
          isPrimary
          onSelect={() => onViewSeat(recommendation.primary.seatId)}
        />

        {/* Explanation */}
        <div
          className="p-3.5 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <p className="text-sm text-text-secondary leading-relaxed">
            {recommendation.explanation}
          </p>
        </div>

        {/* Alternates */}
        {recommendation.alternates.length > 0 && (
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-2">
              Also Great
            </p>
            <div className="grid gap-2">
              {recommendation.alternates.map((alt) => (
                <SeatChip
                  key={alt.seatId}
                  entry={alt}
                  onSelect={() => onViewSeat(alt.seatId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* View on heatmap */}
        <button
          onClick={() => onViewSeat(recommendation.primary.seatId)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.01]"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.15)',
            color: '#fbbf24',
          }}
        >
          <MapPin size={14} />
          View on Heatmap
        </button>
      </div>
    </motion.div>
  );
}
