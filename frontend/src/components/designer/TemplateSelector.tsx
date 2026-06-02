'use client';

import { motion } from 'framer-motion';
import { Monitor, Rows3, Users } from 'lucide-react';
import type { TheatreTemplate } from '@/types';

interface TemplateSelectorProps {
  templates: TheatreTemplate[];
  onSelect: (templateId: string | null) => void;
}

const FORMAT_ICONS: Record<string, string> = {
  TRUE_IMAX: '🎬',
  IMAX_DIGITAL: '🖥️',
  EPIC: '✨',
  DOLBY: '🔊',
  FILM_35MM: '🎞️',
  FILM_70MM: '📽️',
  STANDARD: '🏛️',
  CUSTOM: '⚙️',
};

const FORMAT_GRADIENTS: Record<string, string> = {
  TRUE_IMAX: 'from-indigo-600/20 to-purple-600/20',
  IMAX_DIGITAL: 'from-blue-600/20 to-cyan-600/20',
  EPIC: 'from-amber-600/20 to-orange-600/20',
  DOLBY: 'from-red-600/20 to-pink-600/20',
  FILM_35MM: 'from-emerald-600/20 to-teal-600/20',
  FILM_70MM: 'from-violet-600/20 to-fuchsia-600/20',
  STANDARD: 'from-slate-600/20 to-gray-600/20',
  CUSTOM: 'from-[var(--color-gold-500)]/20 to-[var(--color-gold-700)]/20',
};

export default function TemplateSelector({
  templates,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl mx-4 glass-card p-8 max-h-[85vh] overflow-y-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-[var(--font-display)] text-gradient-gold">
            Choose a Theatre Template
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Select a format to start with pre-configured dimensions and seating, or start from scratch.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {templates.map((template, i) => (
            <motion.button
              key={template._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(template._id)}
              className={`group relative p-5 rounded-xl bg-gradient-to-br ${
                FORMAT_GRADIENTS[template.screenType] || FORMAT_GRADIENTS.CUSTOM
              } border border-white/5 hover:border-white/15 transition-all duration-300 text-left cursor-pointer hover:scale-[1.02]`}
            >
              {/* Icon */}
              <div className="text-3xl mb-3">
                {FORMAT_ICONS[template.screenType] || '🎬'}
              </div>

              {/* Name */}
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                {template.templateName}
              </h3>

              {/* Aspect ratio badge */}
              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/5 text-[var(--color-text-muted)] mb-3">
                {template.aspectRatio}
              </span>

              {/* Stats */}
              <div className="space-y-1.5 text-[11px] text-[var(--color-text-muted)]">
                <div className="flex items-center gap-1.5">
                  <Monitor className="w-3 h-3" />
                  {template.defaultScreenWidth}m × {template.defaultScreenHeight}m
                </div>
                <div className="flex items-center gap-1.5">
                  <Rows3 className="w-3 h-3" />
                  {template.defaultRows} rows
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  {template.defaultRows * template.defaultSeatsPerRow} seats
                </div>
              </div>

              {/* Description */}
              <p className="mt-3 text-[10px] text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
                {template.description}
              </p>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: '0 0 30px rgba(245, 158, 11, 0.1)' }} />
            </motion.button>
          ))}
        </div>

        {/* Start from scratch */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onSelect(null)}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline underline-offset-4 transition-colors cursor-pointer"
          >
            Start from scratch (blank layout)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
