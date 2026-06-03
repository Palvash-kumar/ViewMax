'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Building2, Users, Ticket, BarChart3, Shield, Plus, Search, Loader2, Trash2, X } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui';
import type { Movie, Theatre, User, Role } from '@/types';

export default function AdminDashboard() {
  const { user: currentUser } = useAuthStore();
  const [stats, setStats] = useState({ movies: 0, theatres: 0, users: 0 });
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'movies' | 'theatres' | 'users'>('movies');
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Movie Modal
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    poster: '',
    trailer: '',
    duration: 120,
    genres: '',
    language: '',
    releaseDate: '',
    status: 'UPCOMING',
  });

  useEffect(() => {
    Promise.all([
      api.get('/movies', { params: { limit: 20 } }),
      api.get('/theatres', { params: { limit: 20 } }),
      api.get('/users', { params: { limit: 50 } }),
    ])
      .then(([moviesRes, theatresRes, usersRes]) => {
        const m = moviesRes.data.data.data || moviesRes.data.data || [];
        const t = theatresRes.data.data.data || theatresRes.data.data || [];
        const u = usersRes.data.data.data || usersRes.data.data || [];
        const totalUsers = usersRes.data.data?.total ?? u.length;
        setMovies(m);
        setTheatres(t);
        setUsers(u);
        setStats({ movies: m.length, theatres: t.length, users: totalUsers });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setUpdatingUserId(userId);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleOpenAddMovie = () => {
    setMovieForm({
      title: '',
      description: '',
      poster: '',
      trailer: '',
      duration: 120,
      genres: '',
      language: '',
      releaseDate: '',
      status: 'UPCOMING',
    });
    setIsMovieModalOpen(true);
  };

  const handleMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...movieForm,
        duration: Number(movieForm.duration),
        genres: movieForm.genres.split(',').map((g) => g.trim()).filter(Boolean),
        releaseDate: new Date(movieForm.releaseDate).toISOString(),
      };
      
      const res = await api.post('/movies', payload);
      const newMovie = res.data.data;
      setMovies((prev) => [newMovie, ...prev]);
      setStats((prev) => ({ ...prev, movies: prev.movies + 1 }));
      setIsMovieModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add movie');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm('Are you sure you want to delete this movie? This will also affect showtimes.')) return;
    try {
      await api.delete(`/movies/${movieId}`);
      setMovies((prev) => prev.filter((m) => m._id !== movieId));
      setStats((prev) => ({ ...prev, movies: Math.max(0, prev.movies - 1) }));
    } catch (err) {
      console.error(err);
      alert('Failed to delete movie');
    }
  };

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
            Welcome back, {currentUser?.firstName}. Manage your platform.
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
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleOpenAddMovie} className="flex items-center gap-1.5 text-xs">
              <Plus className="w-4 h-4" /> Add Movie
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {movies.map((movie) => (
              <div key={movie._id} className="glass-card p-4 flex gap-4 relative group">
                <div className="w-16 h-24 rounded-lg overflow-hidden bg-[var(--color-bg-elevated)] shrink-0">
                  {movie.poster ? (
                    <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-white/5">🎬</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold truncate text-sm text-[var(--color-text-primary)]">{movie.title}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{movie.description}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                      {movie.language} · {movie.duration}m
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                      movie.status === 'NOW_SHOWING' ? 'bg-emerald-500/10 text-emerald-400' :
                      movie.status === 'UPCOMING' ? 'bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)]' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {movie.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMovie(movie._id)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer animate-fade-in"
                  title="Delete Movie"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
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
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            users.map((u) => {
              const initials = `${u.firstName?.charAt(0) || ''}${u.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
              return (
                <div key={u._id} className="glass-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-gold-500)]/20 to-[var(--color-gold-600)]/20 border border-[var(--color-gold-500)]/30 flex items-center justify-center text-[var(--color-gold-400)] font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        {u.firstName} {u.lastName}
                        {u._id === currentUser?._id && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase bg-white/10 text-[var(--color-text-muted)]">
                            You
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)]">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {updatingUserId === u._id && (
                      <Loader2 className="w-4 h-4 text-[var(--color-gold-400)] animate-spin" />
                    )}
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value as Role)}
                      disabled={updatingUserId === u._id || u._id === currentUser?._id}
                      className="bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-gold-500)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="CUSTOMER" className="bg-[var(--color-bg-primary)]">Customer</option>
                      <option value="THEATRE_OWNER" className="bg-[var(--color-bg-primary)]">Theatre Owner</option>
                      <option value="THEATRE_MODERATOR" className="bg-[var(--color-bg-primary)]">Theatre Moderator</option>
                      <option value="ADMIN" className="bg-[var(--color-bg-primary)]">Admin</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Movie Modal */}
      {isMovieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-lg p-6 shadow-2xl relative my-8"
          >
            <button
              onClick={() => setIsMovieModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4 font-[var(--font-display)] flex items-center gap-2">
              <Film className="w-5 h-5 text-[var(--color-gold-400)]" />
              Add New Movie
            </h3>
            
            <form onSubmit={handleMovieSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Movie Title</label>
                  <input
                    type="text"
                    required
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                    placeholder="e.g. Inception"
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Description</label>
                  <textarea
                    required
                    value={movieForm.description}
                    onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                    placeholder="Brief movie synopsis..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Language</label>
                  <input
                    type="text"
                    required
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    placeholder="English"
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Release Date</label>
                  <input
                    type="date"
                    required
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Status</label>
                  <select
                    value={movieForm.status}
                    onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all cursor-pointer text-white"
                  >
                    <option value="UPCOMING" className="bg-[var(--color-bg-primary)]">Upcoming</option>
                    <option value="NOW_SHOWING" className="bg-[var(--color-bg-primary)]">Now Showing</option>
                    <option value="ENDED" className="bg-[var(--color-bg-primary)]">Ended</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Genres (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={movieForm.genres}
                    onChange={(e) => setMovieForm({ ...movieForm, genres: e.target.value })}
                    placeholder="Action, Sci-Fi, Adventure"
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Poster Image URL</label>
                  <input
                    type="text"
                    value={movieForm.poster}
                    onChange={(e) => setMovieForm({ ...movieForm, poster: e.target.value })}
                    placeholder="https://example.com/poster.jpg"
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Trailer Video URL</label>
                  <input
                    type="text"
                    value={movieForm.trailer}
                    onChange={(e) => setMovieForm({ ...movieForm, trailer: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsMovieModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={submitting}
                  className="flex-1"
                >
                  Add Movie
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
