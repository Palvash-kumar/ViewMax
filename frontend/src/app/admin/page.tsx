'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Building2, Users, Ticket, BarChart3, Shield, Plus, Search, Loader2, Trash2, X, Monitor, Calendar, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui';
import type { Movie, Theatre, User, Role, Screen, Showtime } from '@/types';

export default function AdminDashboard() {
  const { user: currentUser } = useAuthStore();
  const [stats, setStats] = useState({ movies: 0, theatres: 0, users: 0, showtimes: 0 });
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [activeTab, setActiveTab] = useState<'movies' | 'theatres' | 'users' | 'showtimes'>('movies');
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

  // Theatre Screens
  const [selectedTheatreForScreens, setSelectedTheatreForScreens] = useState<string | null>(null);
  const [theatreScreens, setTheatreScreens] = useState<Screen[]>([]);
  const [loadingScreens, setLoadingScreens] = useState(false);

  // Screen Modal
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [screenForm, setScreenForm] = useState({
    name: '',
    screenType: 'STANDARD',
    rows: 10,
    columns: 12,
  });

  // Showtime Modal
  const [isShowtimeModalOpen, setIsShowtimeModalOpen] = useState(false);
  const [showtimeForm, setShowtimeForm] = useState({
    movieId: '',
    theatreId: '',
    screenId: '',
    startTime: '',
    endTime: '',
    ticketPrice: 250,
    isRecurring: false,
    recurringEndDate: '',
  });
  const [showtimeScreens, setShowtimeScreens] = useState<Screen[]>([]);
  const [loadingShowtimeScreens, setLoadingShowtimeScreens] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/movies', { params: { limit: 50 } }),
      api.get('/theatres', { params: { limit: 50 } }),
      api.get('/users', { params: { limit: 50 } }),
      api.get('/showtimes', { params: { limit: 50 } }),
    ])
      .then(([moviesRes, theatresRes, usersRes, showtimesRes]) => {
        const m = moviesRes.data.data.data || moviesRes.data.data || [];
        const t = theatresRes.data.data.data || theatresRes.data.data || [];
        const u = usersRes.data.data.data || usersRes.data.data || [];
        const s = showtimesRes.data.data.data || showtimesRes.data.data || [];
        const totalUsers = usersRes.data.data?.total ?? u.length;
        setMovies(m);
        setTheatres(t);
        setUsers(u);
        setShowtimes(s);
        setStats({ movies: m.length, theatres: t.length, users: totalUsers, showtimes: s.length });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ─── Role Management ──────────────────────────────────────────────────────
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

  const handleToggleBlock = async (userId: string, isCurrentlyBlocked: boolean) => {
    if (!confirm(`Are you sure you want to ${isCurrentlyBlocked ? 'unblock' : 'block'} this user?`)) return;
    setUpdatingUserId(userId);
    try {
      await api.patch(`/users/${userId}/block`, { isBlocked: !isCurrentlyBlocked });
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === userId ? { ...u, isBlocked: !isCurrentlyBlocked } : u))
      );
    } catch (err) {
      console.error('Failed to toggle block status:', err);
      alert('Failed to update block status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action is permanent and will cancel all active bookings.')) return;
    setUpdatingUserId(userId);
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== userId));
      setStats((prev) => ({ ...prev, users: Math.max(0, prev.users - 1) }));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ─── Movie CRUD ───────────────────────────────────────────────────────────
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

  // ─── Theatre Status ───────────────────────────────────────────────────────
  const handleTheatreStatus = async (theatreId: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    try {
      await api.patch(`/theatres/${theatreId}/status`, { status });
      setTheatres((prev) =>
        prev.map((t) => (t._id === theatreId ? { ...t, status } : t))
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update theatre status');
    }
  };

  // ─── Screen Management ────────────────────────────────────────────────────
  const handleToggleScreens = async (theatreId: string) => {
    if (selectedTheatreForScreens === theatreId) {
      setSelectedTheatreForScreens(null);
      setTheatreScreens([]);
      return;
    }
    setSelectedTheatreForScreens(theatreId);
    setLoadingScreens(true);
    try {
      const res = await api.get(`/theatres/${theatreId}/screens`);
      setTheatreScreens(res.data.data || []);
    } catch {
      setTheatreScreens([]);
    } finally {
      setLoadingScreens(false);
    }
  };

  const handleOpenAddScreen = () => {
    setScreenForm({ name: '', screenType: 'STANDARD', rows: 10, columns: 12 });
    setIsScreenModalOpen(true);
  };

  const handleScreenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTheatreForScreens) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/theatres/${selectedTheatreForScreens}/screens`, {
        name: screenForm.name,
        screenType: screenForm.screenType,
        rows: Number(screenForm.rows),
        columns: Number(screenForm.columns),
      });
      setTheatreScreens((prev) => [...prev, res.data.data]);
      setIsScreenModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create screen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteScreen = async (screenId: string) => {
    if (!confirm('Delete this screen? This cannot be undone.')) return;
    try {
      await api.delete(`/screens/${screenId}`);
      setTheatreScreens((prev) => prev.filter((s) => s._id !== screenId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete screen');
    }
  };

  // ─── Showtime Management ──────────────────────────────────────────────────
  const handleOpenAddShowtime = () => {
    setShowtimeForm({
      movieId: movies[0]?._id || '',
      theatreId: '',
      screenId: '',
      startTime: '',
      endTime: '',
      ticketPrice: 250,
      isRecurring: false,
      recurringEndDate: '',
    });
    setShowtimeScreens([]);
    setIsShowtimeModalOpen(true);
  };

  const handleShowtimeTheatreChange = async (theatreId: string) => {
    setShowtimeForm((prev) => ({ ...prev, theatreId, screenId: '' }));
    if (!theatreId) {
      setShowtimeScreens([]);
      return;
    }
    setLoadingShowtimeScreens(true);
    try {
      const res = await api.get(`/theatres/${theatreId}/screens`);
      const screens = res.data.data || [];
      setShowtimeScreens(screens);
      if (screens.length > 0) {
        setShowtimeForm((prev) => ({ ...prev, screenId: screens[0]._id }));
      }
    } catch {
      setShowtimeScreens([]);
    } finally {
      setLoadingShowtimeScreens(false);
    }
  };

  const handleShowtimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parseLocalDatetime = (str: string) => {
        if (!str) return new Date();
        const [datePart, timePart] = str.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes, 0, 0);
      };

      const payload: any = {
        movieId: showtimeForm.movieId,
        theatreId: showtimeForm.theatreId,
        screenId: showtimeForm.screenId,
        startTime: parseLocalDatetime(showtimeForm.startTime).toISOString(),
        endTime: parseLocalDatetime(showtimeForm.endTime).toISOString(),
        ticketPrice: Number(showtimeForm.ticketPrice),
      };

      if (showtimeForm.isRecurring && showtimeForm.recurringEndDate) {
        payload.isRecurring = true;
        const [year, month, day] = showtimeForm.recurringEndDate.split('-').map(Number);
        const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        payload.recurringEndDate = endDate.toISOString();
      }

      const res = await api.post('/showtimes', payload);
      const created = res.data.data;
      if (Array.isArray(created)) {
        setShowtimes((prev) => [...created, ...prev]);
        setStats((prev) => ({ ...prev, showtimes: prev.showtimes + created.length }));
      } else {
        setShowtimes((prev) => [created, ...prev]);
        setStats((prev) => ({ ...prev, showtimes: prev.showtimes + 1 }));
      }
      setIsShowtimeModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create showtime';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShowtime = async (showtimeId: string) => {
    if (!confirm('Delete this showtime?')) return;
    try {
      await api.delete(`/showtimes/${showtimeId}`);
      setShowtimes((prev) => prev.filter((s) => s._id !== showtimeId));
      setStats((prev) => ({ ...prev, showtimes: Math.max(0, prev.showtimes - 1) }));
    } catch (err) {
      console.error(err);
      alert('Failed to delete showtime');
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const approvedTheatres = theatres.filter((t) => t.status === 'APPROVED');

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  const getMovieTitle = (movieId: any) => {
    if (typeof movieId === 'object' && movieId?.title) return movieId.title;
    const m = movies.find((mov) => mov._id === movieId);
    return m?.title || 'Unknown';
  };

  const getTheatreName = (theatreId: any) => {
    if (typeof theatreId === 'object' && theatreId?.name) return theatreId.name;
    const t = theatres.find((th) => th._id === theatreId);
    return t?.name || 'Unknown';
  };

  const getScreenName = (screenId: any) => {
    if (typeof screenId === 'object' && screenId?.name) return screenId.name;
    return 'Screen';
  };

  // ─── Stat Cards & Tabs ────────────────────────────────────────────────────
  const statCards = [
    { label: 'Movies', value: stats.movies, icon: Film, color: 'from-[var(--color-gold-500)] to-[var(--color-gold-600)]' },
    { label: 'Theatres', value: stats.theatres, icon: Building2, color: 'from-purple-500 to-purple-600' },
    { label: 'Users', value: stats.users, icon: Users, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Showtimes', value: stats.showtimes, icon: Calendar, color: 'from-blue-500 to-blue-600' },
  ];

  const tabs = [
    { key: 'movies' as const, label: 'Movies', icon: Film },
    { key: 'theatres' as const, label: 'Theatres', icon: Building2 },
    { key: 'showtimes' as const, label: 'Showtimes', icon: Calendar },
    { key: 'users' as const, label: 'Users', icon: Users },
  ];

  // ─── Input class helper ───────────────────────────────────────────────────
  const inputClass = "w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all";
  const selectClass = `${inputClass} cursor-pointer text-white`;
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1";

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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
      <div className="flex gap-1 mb-6 border-b border-white/5 pb-px overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all cursor-pointer border-b-2 -mb-px whitespace-nowrap
              ${activeTab === key
                ? 'text-[var(--color-gold-400)] border-[var(--color-gold-500)]'
                : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-primary)]'
              }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ MOVIES TAB ═══════════════════ */}
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

      {/* ═══════════════════ THEATRES TAB ═══════════════════ */}
      {activeTab === 'theatres' && (
        <div className="space-y-3">
          {theatres.map((theatre) => (
            <div key={theatre._id} className="glass-card overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{theatre.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{theatre.city}, {theatre.state}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase
                    ${theatre.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                      theatre.status === 'PENDING' ? 'bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)]' :
                      theatre.status === 'SUSPENDED' ? 'bg-orange-500/10 text-orange-400' :
                      'bg-[var(--color-crimson-500)]/10 text-[var(--color-crimson-400)]'}`}>
                    {theatre.status}
                  </span>

                  {/* Status Actions */}
                  {theatre.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleTheatreStatus(theatre._id, 'APPROVED')}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all cursor-pointer"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTheatreStatus(theatre._id, 'REJECTED')}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {theatre.status === 'APPROVED' && (
                    <button
                      onClick={() => handleTheatreStatus(theatre._id, 'SUSPENDED')}
                      className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-all cursor-pointer"
                      title="Suspend"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                  {(theatre.status === 'REJECTED' || theatre.status === 'SUSPENDED') && (
                    <button
                      onClick={() => handleTheatreStatus(theatre._id, 'APPROVED')}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all cursor-pointer"
                      title="Re-approve"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                  {/* Manage Screens Toggle */}
                  <button
                    onClick={() => handleToggleScreens(theatre._id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
                      selectedTheatreForScreens === theatre._id
                        ? 'bg-[var(--color-gold-500)]/15 text-[var(--color-gold-400)] border-[var(--color-gold-500)]/30'
                        : 'bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] border-white/10'
                    }`}
                  >
                    <Monitor className="w-3 h-3" /> Screens
                  </button>
                </div>
              </div>

              {/* Expanded Screens Panel */}
              {selectedTheatreForScreens === theatre._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-white/5 px-4 py-4 bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 text-[var(--color-text-primary)]">
                      <Monitor className="w-4 h-4 text-[var(--color-gold-400)]" /> Screens for {theatre.name}
                    </h4>
                    <button
                      onClick={handleOpenAddScreen}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)] hover:bg-[var(--color-gold-500)]/20 border border-[var(--color-gold-500)]/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Screen
                    </button>
                  </div>

                  {loadingScreens ? (
                    <div className="flex items-center gap-2 py-4 justify-center text-[var(--color-text-muted)] text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading screens...
                    </div>
                  ) : theatreScreens.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)] text-center py-4">No screens yet. Add one above.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {theatreScreens.map((screen) => (
                        <div key={screen._id} className="bg-white/5 border border-white/5 rounded-xl p-3 relative group">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">{screen.name}</h5>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-purple-500/10 text-purple-400">
                              {screen.screenType.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
                            <span>{screen.capacity} seats</span>
                            <span>{screen.rows}R × {screen.columns}C</span>
                          </div>
                          <button
                            onClick={() => handleDeleteScreen(screen._id)}
                            className="absolute top-3 right-3 p-1 rounded hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Delete Screen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════ SHOWTIMES TAB ═══════════════════ */}
      {activeTab === 'showtimes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleOpenAddShowtime} className="flex items-center gap-1.5 text-xs">
              <Plus className="w-4 h-4" /> Schedule Showtime
            </Button>
          </div>

          {showtimes.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No showtimes scheduled yet</p>
              <p className="text-xs mt-1">Assign a movie to a screen to get started.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {showtimes.map((st) => (
                <div key={st._id} className="glass-card p-4 relative group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                        🎬 {getMovieTitle(st.movieId)}
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        🏛 {getTheatreName(st.theatreId)} · {getScreenName(st.screenId)}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                      st.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-400' :
                      st.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {st.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDateTime(st.startTime)}
                    </span>
                    <span className="font-semibold text-[var(--color-gold-400)]">₹{st.ticketPrice}</span>
                    <span>{st.bookedSeats?.length || 0} booked</span>
                  </div>
                  <button
                    onClick={() => handleDeleteShowtime(st._id)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete Showtime"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ USERS TAB ═══════════════════ */}
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
                        {u.isBlocked && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                            Blocked
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

                    <button
                      onClick={() => handleToggleBlock(u._id, !!u.isBlocked)}
                      disabled={updatingUserId === u._id || u._id === currentUser?._id}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        u.isBlocked
                          ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                          : 'bg-white/5 text-[var(--color-text-muted)] border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                      title={u.isBlocked ? 'Unblock User' : 'Block User'}
                    >
                      <Ban className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      disabled={updatingUserId === u._id || u._id === currentUser?._id}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════════ MOVIE MODAL ═══════════════════ */}
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
                  <label className={labelClass}>Movie Title</label>
                  <input
                    type="text"
                    required
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                    placeholder="e.g. Inception"
                    className={inputClass}
                  />
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea
                    required
                    value={movieForm.description}
                    onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                    placeholder="Brief movie synopsis..."
                    rows={3}
                    className={`${inputClass} resize-none font-sans`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Duration (mins)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Language</label>
                  <input
                    type="text"
                    required
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    placeholder="English"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Release Date</label>
                  <input
                    type="date"
                    required
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                    className={`${inputClass} text-white`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={movieForm.status}
                    onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
                    className={selectClass}
                  >
                    <option value="UPCOMING" className="bg-[var(--color-bg-primary)]">Upcoming</option>
                    <option value="NOW_SHOWING" className="bg-[var(--color-bg-primary)]">Now Showing</option>
                    <option value="ENDED" className="bg-[var(--color-bg-primary)]">Ended</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Genres (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={movieForm.genres}
                    onChange={(e) => setMovieForm({ ...movieForm, genres: e.target.value })}
                    placeholder="Action, Sci-Fi, Adventure"
                    className={inputClass}
                  />
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Poster Image URL</label>
                  <input
                    type="text"
                    value={movieForm.poster}
                    onChange={(e) => setMovieForm({ ...movieForm, poster: e.target.value })}
                    placeholder="https://example.com/poster.jpg"
                    className={inputClass}
                  />
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Trailer Video URL</label>
                  <input
                    type="text"
                    value={movieForm.trailer}
                    onChange={(e) => setMovieForm({ ...movieForm, trailer: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className={inputClass}
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

      {/* ═══════════════════ SCREEN MODAL ═══════════════════ */}
      {isScreenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setIsScreenModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4 font-[var(--font-display)] flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[var(--color-gold-400)]" />
              Add Screen
            </h3>
            <form onSubmit={handleScreenSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Screen Name</label>
                <input
                  type="text"
                  required
                  value={screenForm.name}
                  onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                  placeholder="e.g. Screen 1 - Laser Max"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Screen Format</label>
                <select
                  value={screenForm.screenType}
                  onChange={(e) => setScreenForm({ ...screenForm, screenType: e.target.value })}
                  className={selectClass}
                >
                  <option value="STANDARD" className="bg-[var(--color-bg-primary)]">Standard Screen</option>
                  <option value="TRUE_IMAX" className="bg-[var(--color-bg-primary)]">True IMAX</option>
                  <option value="IMAX_DIGITAL" className="bg-[var(--color-bg-primary)]">IMAX Digital</option>
                  <option value="EPIC" className="bg-[var(--color-bg-primary)]">Epic Screen</option>
                  <option value="DOLBY" className="bg-[var(--color-bg-primary)]">Dolby Cinema</option>
                  <option value="FILM_35MM" className="bg-[var(--color-bg-primary)]">35mm Film</option>
                  <option value="FILM_70MM" className="bg-[var(--color-bg-primary)]">70mm Film</option>
                  <option value="CUSTOM" className="bg-[var(--color-bg-primary)]">Custom Format</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Rows (Max 30)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={30}
                    value={screenForm.rows}
                    onChange={(e) => setScreenForm({ ...screenForm, rows: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Columns (Max 50)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={screenForm.columns}
                    onChange={(e) => setScreenForm({ ...screenForm, columns: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" type="button" onClick={() => setIsScreenModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={submitting} className="flex-1">
                  Create Screen
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ═══════════════════ SHOWTIME MODAL ═══════════════════ */}
      {isShowtimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-lg p-6 shadow-2xl relative my-8"
          >
            <button
              onClick={() => setIsShowtimeModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4 font-[var(--font-display)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--color-gold-400)]" />
              Schedule Showtime
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-4 -mt-2">
              Assign a movie to a screen at a specific time.
            </p>

            <form onSubmit={handleShowtimeSubmit} className="space-y-4">
              {/* Movie */}
              <div>
                <label className={labelClass}>Movie</label>
                <select
                  required
                  value={showtimeForm.movieId}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, movieId: e.target.value })}
                  className={selectClass}
                >
                  <option value="" className="bg-[var(--color-bg-primary)]">— Select a movie —</option>
                  {movies
                    .filter((m) => m.status !== 'ENDED')
                    .map((m) => (
                      <option key={m._id} value={m._id} className="bg-[var(--color-bg-primary)]">
                        {m.title} ({m.language}, {m.duration}m)
                      </option>
                    ))}
                </select>
              </div>

              {/* Theatre */}
              <div>
                <label className={labelClass}>Theatre</label>
                <select
                  required
                  value={showtimeForm.theatreId}
                  onChange={(e) => handleShowtimeTheatreChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="" className="bg-[var(--color-bg-primary)]">— Select a theatre —</option>
                  {approvedTheatres.map((t) => (
                    <option key={t._id} value={t._id} className="bg-[var(--color-bg-primary)]">
                      {t.name} ({t.city})
                    </option>
                  ))}
                </select>
                {theatres.length > 0 && approvedTheatres.length === 0 && (
                  <p className="text-[10px] text-[var(--color-crimson-400)] mt-1">
                    No approved theatres. Approve a theatre first in the Theatres tab.
                  </p>
                )}
              </div>

              {/* Screen */}
              <div>
                <label className={labelClass}>Screen</label>
                {loadingShowtimeScreens ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] py-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading screens...
                  </div>
                ) : (
                  <select
                    required
                    value={showtimeForm.screenId}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, screenId: e.target.value })}
                    className={selectClass}
                    disabled={!showtimeForm.theatreId}
                  >
                    <option value="" className="bg-[var(--color-bg-primary)]">— Select a screen —</option>
                    {showtimeScreens.map((s) => (
                      <option key={s._id} value={s._id} className="bg-[var(--color-bg-primary)]">
                        {s.name} ({s.screenType.replace('_', ' ')}, {s.capacity} seats)
                      </option>
                    ))}
                  </select>
                )}
                {showtimeForm.theatreId && !loadingShowtimeScreens && showtimeScreens.length === 0 && (
                  <p className="text-[10px] text-[var(--color-crimson-400)] mt-1">
                    No screens for this theatre. Add screens first in the Theatres tab.
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={showtimeForm.startTime}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, startTime: e.target.value })}
                    className={`${inputClass} text-white`}
                  />
                </div>
                <div>
                  <label className={labelClass}>End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={showtimeForm.endTime}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, endTime: e.target.value })}
                    className={`${inputClass} text-white`}
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className={labelClass}>Ticket Price (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={showtimeForm.ticketPrice}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, ticketPrice: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>

              {/* Recurring Switch */}
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={showtimeForm.isRecurring}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, isRecurring: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-[var(--color-gold-500)] focus:ring-[var(--color-gold-500)]/30 cursor-pointer"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-white cursor-pointer select-none">
                  Repeat Daily (Schedule for everyday)
                </label>
              </div>

              {/* Recurring End Date */}
              {showtimeForm.isRecurring && (
                <div className="space-y-1">
                  <label className={labelClass}>Repeat Until (End Date)</label>
                  <input
                    type="date"
                    required={showtimeForm.isRecurring}
                    value={showtimeForm.recurringEndDate}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, recurringEndDate: e.target.value })}
                    className={`${inputClass} text-white`}
                  />
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    Showtimes will be scheduled daily at the specified time up to and including this date.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" type="button" onClick={() => setIsShowtimeModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={submitting}
                  className="flex-1"
                >
                  Schedule Showtime
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
