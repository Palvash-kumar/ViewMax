'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Calendar, Globe, MapPin, ArrowLeft, Play, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import type { Movie, Showtime, Theatre } from '@/types';
import { Button } from '@/components/ui';

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!params.id) return;

    Promise.all([
      api.get(`/movies/${params.id}`),
      api.get('/showtimes', { params: { movieId: params.id, limit: 50 } }),
    ])
      .then(([movieRes, showtimeRes]) => {
        setMovie(movieRes.data.data);
        setShowtimes(showtimeRes.data.data.data || showtimeRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const formatDuration = (min: number) => `${Math.floor(min / 60)}h ${min % 60}m`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0]);
  }, []);

  const filteredShowtimes = selectedDate
    ? showtimes.filter((s) => s.startTime.startsWith(selectedDate))
    : showtimes;

  // Group by theatre
  const groupedByTheatre = filteredShowtimes.reduce((acc, s) => {
    const theatre = s.theatreId as Theatre;
    const key = theatre?._id || 'unknown';
    if (!acc[key]) acc[key] = { theatre, shows: [] };
    acc[key].shows.push(s);
    return acc;
  }, {} as Record<string, { theatre: Theatre; shows: Showtime[] }>);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-shimmer h-96 rounded-2xl mb-8" />
        <div className="space-y-4">
          <div className="animate-shimmer h-8 rounded w-1/3" />
          <div className="animate-shimmer h-4 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Movie Not Found</h1>
        <p className="text-[var(--color-text-muted)] mt-2">The movie you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/movies" className="mt-4 inline-block">
          <Button variant="secondary"><ArrowLeft className="w-4 h-4" /> Back to Movies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-primary)] via-[var(--color-bg-primary)]/80 to-transparent" />
        {movie.poster && (
          <div className="absolute inset-0 opacity-20">
            <img src={movie.poster} alt="" className="w-full h-full object-cover blur-sm" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-6 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-56 md:w-64 shrink-0"
            >
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl glow-gold">
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-6xl">🎬</div>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-display)]">{movie.title}</h1>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-[var(--color-text-secondary)] text-sm">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {formatDuration(movie.duration)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> {movie.language}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {formatDate(movie.releaseDate)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres.map((g) => (
                  <span key={g} className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-[var(--color-text-muted)]">{g}</span>
                ))}
              </div>

              <p className="text-[var(--color-text-secondary)] mt-6 leading-relaxed max-w-2xl">{movie.description}</p>

              {movie.trailer && (
                <a href={movie.trailer} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 text-[var(--color-gold-400)] hover:text-[var(--color-gold-300)] text-sm font-medium">
                  <Play className="w-4 h-4" /> Watch Trailer
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Showtimes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-xl font-bold mb-6">Showtimes</h2>

        {/* Date picker */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {dates.map((d) => {
            const date = new Date(d);
            const isSelected = selectedDate === d;
            const isToday = d === dates[0];
            return (
              <button key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center px-4 py-2.5 rounded-xl min-w-[70px] transition-all cursor-pointer
                  ${isSelected
                    ? 'bg-[var(--color-gold-500)] text-[var(--color-bg-primary)]'
                    : 'bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)]'
                  }`}>
                <span className="text-[10px] font-medium uppercase">
                  {isToday ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
                <span className="text-lg font-bold">{date.getDate()}</span>
                <span className="text-[10px]">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
              </button>
            );
          })}
        </div>

        {/* Theatre groups */}
        {Object.keys(groupedByTheatre).length > 0 ? (
          <div className="space-y-4">
            {Object.values(groupedByTheatre).map(({ theatre, shows }) => (
              <div key={theatre._id} className="glass-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{theatre.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {theatre.city}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {shows.map((show) => (
                    <Link key={show._id} href={`/booking/${show._id}`}>
                      <button className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white/5 hover:border-[var(--color-gold-500)]/50 hover:bg-[var(--color-gold-500)]/5 transition-all cursor-pointer group">
                        <span className="text-sm font-semibold text-[var(--color-gold-400)] group-hover:text-[var(--color-gold-300)]">
                          {formatTime(show.startTime)}
                        </span>
                        <span className="block text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          ₹{show.ticketPrice}
                        </span>
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--color-text-muted)]">No showtimes available for this date.</p>
          </div>
        )}
      </section>
    </div>
  );
}
