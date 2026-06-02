'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Star } from 'lucide-react';
import type { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export default function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link href={`/movies/${movie._id}`} className="group block">
        <div className="glass-card glass-card-hover overflow-hidden transition-all duration-300">
          {/* Poster */}
          <div className="relative aspect-[2/3] overflow-hidden bg-[var(--color-bg-elevated)]">
            {movie.poster ? (
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🎬</span>
              </div>
            )}

            {/* Status badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase
                ${movie.status === 'NOW_SHOWING'
                  ? 'bg-emerald-500/80 text-white backdrop-blur-sm'
                  : movie.status === 'UPCOMING'
                  ? 'bg-[var(--color-gold-500)]/80 text-[var(--color-bg-primary)] backdrop-blur-sm'
                  : 'bg-white/10 text-white/80 backdrop-blur-sm'
                }`}>
                {movie.status.replace('_', ' ')}
              </span>
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-primary)] via-transparent to-transparent opacity-60" />
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-gold-400)] transition-colors">
              {movie.title}
            </h3>

            <div className="flex items-center gap-3 mt-2 text-[var(--color-text-muted)] text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(movie.duration)}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[var(--color-gold-400)]" />
                {movie.language}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {movie.genres.slice(0, 3).map((genre) => (
                <span key={genre}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-[var(--color-text-muted)]">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
