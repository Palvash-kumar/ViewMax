'use client';

import { motion } from 'framer-motion';
import { getScoreColor } from './ScoreBar';

interface MetricRadarChartProps {
  metrics: { label: string; value: number }[];
  size?: number;
}

export default function MetricRadarChart({
  metrics,
  size = 220,
}: MetricRadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const levels = 4;
  const count = metrics.length;
  const angleSlice = (Math.PI * 2) / count;

  // Grid circles
  const gridCircles = Array.from({ length: levels }, (_, i) => {
    const r = (maxR / levels) * (i + 1);
    return (
      <circle
        key={`grid-${i}`}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1}
      />
    );
  });

  // Axis lines
  const axisLines = metrics.map((_, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x2 = cx + maxR * Math.cos(angle);
    const y2 = cy + maxR * Math.sin(angle);
    return (
      <line
        key={`axis-${i}`}
        x1={cx}
        y1={cy}
        x2={x2}
        y2={y2}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
      />
    );
  });

  // Data polygon points
  const dataPoints = metrics.map((m, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const r = (m.value / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const polygonPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Labels
  const labels = metrics.map((m, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const labelR = maxR + 22;
    const x = cx + labelR * Math.cos(angle);
    const y = cy + labelR * Math.sin(angle);

    return (
      <text
        key={`label-${i}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#94a3b8"
        fontSize={9}
        fontWeight={500}
      >
        {m.label}
      </text>
    );
  });

  // Value dots
  const dots = dataPoints.map((p, i) => (
    <motion.circle
      key={`dot-${i}`}
      cx={p.x}
      cy={p.y}
      r={3.5}
      fill={getScoreColor(metrics[i].value)}
      stroke="#0a0e1a"
      strokeWidth={1.5}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
    />
  ));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridCircles}
      {axisLines}
      <motion.polygon
        points={polygonPath}
        fill="rgba(59, 130, 246, 0.12)"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {dots}
      {labels}
    </svg>
  );
}
