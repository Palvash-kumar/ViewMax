'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Building2, Users, Ticket, BarChart3, Shield, Plus, Search } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui';
import type { Movie, Theatre } from '@/types';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ movies: 0, theatres: 0, users: 0 });
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [activeTab, setActiveTab] = useState<'movies' | 'theatres' | 'users'>('movies');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/movies', { params: { limit: 20 } }),
      api.get('/theatres', { params: { limit: 20 } }),
    ])
      .then(([moviesRes, theatresRes]) => {
        const m = moviesRes.data.data.data || moviesRes.data.data || [];
        const t = theatresRes.data.data.data || theatresRes.data.data || [];
        setMovies(m);
        setTheatres(t);
        setStats({ movies: m.length, theatres: t.length, users: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Movies', value: stats.movies, icon: Film, color: 'from-[var(--color-gold-500)] to-[var(--color-gold-600)]' },
    { label: 'Theatres', value: stats.theatres, icon: Building2, color: 'from-purple-500 to-purple-600' },
    { label: 'Users', value: stats.users, icon: Users, color: 'from-emerald-500 to-emerald-600' },
  ];

  const tabs = [
    { key: 'movies' as const, label: 'Movies', icon: Film },
    { key: 'theatres' as const, label: 'Theatres', icon: Building2 },
    { key: 'users' as const, label: 'Users', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-display)]">
            <Shield className="w-8 h-8 inline-block mr-2 text-[var(--color-gold-400)]" />
            Admin Dashboard
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Welcome back, {user?.firstName}. Manage your platform.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/5 pb-px">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all cursor-pointer border-b-2 -mb-px
              ${activeTab === key
                ? 'text-[var(--color-gold-400)] border-[var(--color-gold-500)]'
                : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-primary)]'
              }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'movies' && (
        <div className="space-y-3">
          {movies.map((movie) => (
            <div key={movie._id} className="glass-card p-4 flex items-center gap-4">
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-[var(--color-bg-elevated)] shrink-0">
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🎬</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{movie.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)]">{movie.language} · {movie.genres.join(', ')}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase
                ${movie.status === 'NOW_SHOWING' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[var(--color-text-muted)]'}`}>
                {movie.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'theatres' && (
        <div className="space-y-3">
          {theatres.map((theatre) => (
            <div key={theatre._id} className="glass-card p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium">{theatre.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)]">{theatre.city}, {theatre.state}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase
                ${theatre.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                  theatre.status === 'PENDING' ? 'bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)]' :
                  'bg-[var(--color-crimson-500)]/10 text-[var(--color-crimson-400)]'}`}>
                {theatre.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>User management coming soon</p>
        </div>
      )}
    </div>
  );
}
