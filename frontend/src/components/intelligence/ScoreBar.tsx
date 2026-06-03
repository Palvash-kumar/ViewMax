'use client';

import { motion } from 'framer-motion';

interface ScoreBarProps {
  score: number;
  label: string;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  delay?: number;
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#3b82f6';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getScoreGradient(score: number): string {
  if (score >= 90) return 'linear-gradient(90deg, #22c55e, #4ade80)';
  if (score >= 75) return 'linear-gradient(90deg, #3b82f6, #60a5fa)';
  if (score >= 60) return 'linear-gradient(90deg, #eab308, #facc15)';
  if (score >= 40) return 'linear-gradient(90deg, #f97316, #fb923c)';
  return 'linear-gradient(90deg, #ef4444, #f87171)';
}

export default function ScoreBar({
  score,
  label,
  maxScore = 100,
  size = 'md',
  showValue = true,
  delay = 0,
}: ScoreBarProps) {
  const percent = Math.min(100, (score / maxScore) * 100);
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };
  const barHeight = heights[size];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        {showValue && (
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: getScoreColor(score) }}
          >
            {Math.round(score)}
          </span>
        )}
      </div>
      <div
        className={`w-full ${barHeight} rounded-full overflow-hidden`}
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <motion.div
          className={`${barHeight} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{
            duration: 0.8,
            delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            background: getScoreGradient(score),
            boxShadow: `0 0 8px ${getScoreColor(score)}40`,
          }}
        />
      </div>
    </div>
  );
}

export { getScoreColor, getScoreGradient };
