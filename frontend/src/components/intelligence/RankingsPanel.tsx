'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Medal, Award, Accessibility } from 'lucide-react';
import type { SeatRanking, SeatRankEntry } from '@/types';
import { getScoreColor } from './ScoreBar';

interface RankingsPanelProps {
  rankings: SeatRanking;
  onSeatSelect: (seatId: string) => void;
}

type TabKey = 'top5' | 'top10' | 'topVip' | 'topValue' | 'topAccessible';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'top5', label: 'Top 5', icon: <Crown size={13} /> },
  { key: 'top10', label: 'Top 10', icon: <Star size={13} /> },
  { key: 'topVip', label: 'VIP', icon: <Medal size={13} /> },
  { key: 'topValue', label: 'Value', icon: <Award size={13} /> },
  { key: 'topAccessible', label: 'Accessible', icon: <Accessibility size={13} /> },
];

const MEDAL_COLORS = ['#fbbf24', '#94a3b8', '#cd7f32'];

function RankEntry({
  entry,
  rank,
  onSelect,
}: {
  entry: SeatRankEntry;
  rank: number;
  onSelect: () => void;
}) {
  const medalColor = rank < 3 ? MEDAL_COLORS[rank] : undefined;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-white/5 group"
    >
      {/* Rank */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: medalColor
            ? `${medalColor}15`
            : 'rgba(255,255,255,0.04)',
          color: medalColor || '#64748b',
          border: medalColor
            ? `1px solid ${medalColor}30`
            : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {rank + 1}
      </div>

      {/* Seat info */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-display font-semibold text-text-primary">
            {entry.seatId}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background:
                entry.category === 'ELITE'
                  ? 'rgba(34,197,94,0.1)'
                  : entry.category === 'EXCELLENT'
                    ? 'rgba(59,130,246,0.1)'
                    : 'rgba(234,179,8,0.1)',
              color:
                entry.category === 'ELITE'
                  ? '#4ade80'
                  : entry.category === 'EXCELLENT'
                    ? '#60a5fa'
                    : '#facc15',
            }}
          >
            {entry.category}
          </span>
        </div>
        {/* Mini bars */}
        <div className="flex gap-2 mt-1">
          {[
            { label: 'I', value: entry.immersionScore },
            { label: 'C', value: entry.comfortScore },
            { label: 'S', value: entry.screenCoverageScore },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-0.5">
              <span className="text-[8px] text-text-muted">{m.label}</span>
              <div
                className="h-1 rounded-full"
                style={{
                  width: `${Math.max(8, m.value * 0.3)}px`,
                  background: getScoreColor(m.value),
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Score */}
      <span
        className="text-lg font-display font-bold tabular-nums flex-shrink-0"
        style={{ color: getScoreColor(entry.premiumExperienceScore) }}
      >
        {Math.round(entry.premiumExperienceScore)}
      </span>
    </motion.button>
  );
}

export default function RankingsPanel({
  rankings,
  onSeatSelect,
}: RankingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('top5');

  const entries: SeatRankEntry[] = rankings[activeTab] || [];
  const dist = rankings.categoryDistribution;

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <h3 className="text-base font-display font-semibold text-text-primary mb-1">
        Seat Rankings
      </h3>
      <p className="text-xs text-text-muted mb-4">
        {rankings.screenType.replace(/_/g, ' ')}
      </p>

      {/* Category Distribution */}
      <div className="flex gap-1 mb-5 h-2 rounded-full overflow-hidden">
        {[
          { key: 'elite', color: '#22c55e', count: dist.elite },
          { key: 'excellent', color: '#3b82f6', count: dist.excellent },
          { key: 'recommended', color: '#eab308', count: dist.recommended },
          { key: 'average', color: '#f97316', count: dist.average },
          { key: 'avoid', color: '#ef4444', count: dist.avoid },
        ].map((c) => {
          const total = Object.values(dist).reduce((s, v) => s + v, 0);
          const pct = total > 0 ? (c.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={c.key}
              className="h-full transition-all duration-500"
              style={{ width: `${pct}%`, background: c.color }}
              title={`${c.key}: ${c.count} seats`}
            />
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-1 justify-center ${
              activeTab === tab.key
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="hidden lg:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Ranking List */}
      <div className="space-y-1">
        {entries.length > 0 ? (
          entries.map((entry, i) => (
            <RankEntry
              key={entry.seatId}
              entry={entry}
              rank={i}
              onSelect={() => onSeatSelect(entry.seatId)}
            />
          ))
        ) : (
          <p className="text-xs text-text-muted text-center py-6">
            No seats in this category.
          </p>
        )}
      </div>
    </div>
  );
}
