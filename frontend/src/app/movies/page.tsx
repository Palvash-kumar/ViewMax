'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import { EmptyState } from '@/components/ui';
import api from '@/lib/axios';
import type { Movie } from '@/types';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Animation'];
const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Kannada'];
const STATUSES = ['NOW_SHOWING', 'UPCOMING', 'ENDED'];

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '40', sort: 'releaseDate', order: 'desc' };
    if (search) params.search = search;
    if (selectedGenre) params.genre = selectedGenre;
    if (selectedLanguage) params.language = selectedLanguage;
    if (selectedStatus) params.status = selectedStatus;

    api.get('/movies', { params })
      .then((res) => setMovies(res.data.data.data || res.data.data || []))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [search, selectedGenre, selectedLanguage, selectedStatus]);

  const hasFilters = selectedGenre || selectedLanguage || selectedStatus;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-[var(--font-display)]">Movies</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">Discover the latest films now showing</p>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search movies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)]/50 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer
            ${showFilters || hasFilters
              ? 'bg-[var(--color-gold-500)]/10 border-[var(--color-gold-500)]/30 text-[var(--color-gold-400)]'
              : 'bg-white/5 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-white/10'
            }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasFilters && (
            <span className="w-2 h-2 rounded-full bg-[var(--color-gold-400)]" />
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="glass-card p-5 mb-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filters</h3>
            {hasFilters && (
              <button
                onClick={() => { setSelectedGenre(''); setSelectedLanguage(''); setSelectedStatus(''); }}
                className="text-xs text-[var(--color-gold-400)] hover:text-[var(--color-gold-300)] flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Genre</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button key={g}
                  onClick={() => setSelectedGenre(selectedGenre === g ? '' : g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                    ${selectedGenre === g
                      ? 'bg-[var(--color-gold-500)] text-[var(--color-bg-primary)]'
                      : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10'
                    }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Language</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button key={l}
                  onClick={() => setSelectedLanguage(selectedLanguage === l ? '' : l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                    ${selectedLanguage === l
                      ? 'bg-[var(--color-gold-500)] text-[var(--color-bg-primary)]'
                      : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10'
                    }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button key={s}
                  onClick={() => setSelectedStatus(selectedStatus === s ? '' : s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                    ${selectedStatus === s
                      ? 'bg-[var(--color-gold-500)] text-[var(--color-bg-primary)]'
                      : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10'
                    }`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <div className="aspect-[2/3] animate-shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-4 animate-shimmer rounded w-3/4" />
                <div className="h-3 animate-shimmer rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {movies.map((movie, i) => (
            <MovieCard key={movie._id} movie={movie} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState title="No Movies Found" description="Try adjusting your filters or search terms." />
      )}
    </div>
  );
}
