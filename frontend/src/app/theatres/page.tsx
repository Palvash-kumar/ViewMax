'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  MapPin,
  Search,
  ChevronRight,
  Tv,
  Calendar,
  Clock,
  Ticket,
  Sparkles,
  Compass,
} from 'lucide-react';
import api from '@/lib/axios';
import type { Theatre, Showtime, Movie } from '@/types';
import { Button, EmptyState, LoadingSkeleton } from '@/components/ui';

interface GroupedShowtimes {
  movie: Movie;
  slots: Showtime[];
}

export default function TheatresPage() {
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [loadingTheatres, setLoadingTheatres] = useState(true);
  const [selectedTheatre, setSelectedTheatre] = useState<Theatre | null>(null);
  
  // Showtimes state for selected theatre
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [cities, setCities] = useState<string[]>([]);

  // Fetch approved theatres
  useEffect(() => {
    setLoadingTheatres(true);
    api.get('/theatres', { params: { status: 'APPROVED', limit: 100 } })
      .then((res) => {
        const list = res.data.data?.data || res.data.data || [];
        setTheatres(list);
        
        // Extract unique cities
        const uniqueCities: string[] = Array.from(
          new Set(list.map((t: Theatre) => t.city).filter(Boolean))
        );
        setCities(uniqueCities);
      })
      .catch((err) => {
        console.error('Failed to load theatres:', err);
      })
      .finally(() => {
        setLoadingTheatres(false);
      });
  }, []);

  // Fetch showtimes when selected theatre changes
  useEffect(() => {
    if (!selectedTheatre) {
      setShowtimes([]);
      return;
    }
    setLoadingShowtimes(true);
    api.get('/showtimes', { params: { theatreId: selectedTheatre._id, limit: 100 } })
      .then((res) => {
        const list = res.data.data?.data || res.data.data || [];
        setShowtimes(list);
      })
      .catch((err) => {
        console.error('Failed to load showtimes:', err);
      })
      .finally(() => {
        setLoadingShowtimes(false);
      });
  }, [selectedTheatre]);

  // Filter theatres by search query and city selection
  const filteredTheatres = theatres.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'All' || t.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  // Group showtimes by movie ID
  const getGroupedShowtimes = (): GroupedShowtimes[] => {
    const groups: Record<string, GroupedShowtimes> = {};
    
    showtimes.forEach((st) => {
      const movieObj = st.movieId as unknown as Movie;
      if (!movieObj || !movieObj._id) return;
      
      if (!groups[movieObj._id]) {
        groups[movieObj._id] = {
          movie: movieObj,
          slots: [],
        };
      }
      groups[movieObj._id].slots.push(st);
    });

    // Sort slots by start time
    Object.keys(groups).forEach((key) => {
      groups[key].slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });

    return Object.values(groups);
  };

  const grouped = getGroupedShowtimes();

  // Helper to format screen types beautifully
  const formatScreenType = (type: string) => {
    return type.replace('_', ' ').replace('-', ' ');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <span className="hero-badge mb-2">
          <Compass className="w-3.5 h-3.5 text-[var(--color-gold-400)]" />
          Cinema Locator
        </span>
        <h1 className="text-3xl font-extrabold font-[var(--font-display)] text-[var(--color-text-primary)]">
          Explore Theatres
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          Locate premium cinema complexes and explore active showtime schedules
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Search & Theatres List (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Controls */}
          <div className="glass-card p-4 border border-[var(--color-border)] shadow-sm space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search theatres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)]/50 transition-all"
              />
            </div>

            {/* City Quick Filter */}
            <div>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Filter by City
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCity('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCity === 'All'
                      ? 'bg-[var(--color-gold-500)] text-[var(--color-bg-primary)] shadow-sm'
                      : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'
                  }`}
                >
                  All Cities
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedCity === city
                        ? 'bg-[var(--color-gold-500)] text-[var(--color-bg-primary)] shadow-sm'
                        : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Theatres List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {loadingTheatres ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="glass-card p-5 space-y-3 border border-[var(--color-border)]">
                  <LoadingSkeleton className="h-5 w-2/3" />
                  <LoadingSkeleton className="h-4 w-1/2" />
                  <LoadingSkeleton className="h-4 w-1/3" />
                </div>
              ))
            ) : filteredTheatres.length > 0 ? (
              filteredTheatres.map((theatre) => {
                const isSelected = selectedTheatre?._id === theatre._id;
                return (
                  <motion.div
                    key={theatre._id}
                    layoutId={`theatre-card-${theatre._id}`}
                    onClick={() => setSelectedTheatre(theatre)}
                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? 'bg-[var(--color-gold-500)]/10 border-[var(--color-gold-500)] shadow-md'
                        : 'bg-white/95 border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 pr-2">
                      <h3 className="font-bold text-base text-[var(--color-text-primary)] truncate">
                        {theatre.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                        <MapPin className="w-3.5 h-3.5 text-[var(--color-gold-500)] shrink-0" />
                        <span className="truncate">{theatre.address}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                        {theatre.city}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isSelected ? 'text-[var(--color-gold-500)] translate-x-1' : 'text-[var(--color-text-muted)]'
                      }`}
                    />
                  </motion.div>
                );
              })
            ) : (
              <EmptyState title="No Theatres Found" description="Try broadening your search or city filters." />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Showtime Details (7 cols) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!selectedTheatre ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card border border-[var(--color-border)] p-12 text-center flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--color-gold-500)]/10 flex items-center justify-center mb-4 text-[var(--color-gold-500)]">
                  <Tv className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  No Theatre Selected
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-sm">
                  Click on any theatre from the list to view its active movie listings and book showtimes.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedTheatre._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Theatre Header Card */}
                <div className="glass-card p-6 border border-[var(--color-border)] bg-gradient-to-br from-white to-[var(--color-bg-tertiary)] shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-gold-500)]/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <span className="section-label">Selected Venue</span>
                  <h2
                    className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {selectedTheatre.name}
                  </h2>
                  <div className="mt-3 space-y-1.5 text-sm text-[var(--color-text-secondary)]">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[var(--color-gold-500)]" />
                      {selectedTheatre.address}, {selectedTheatre.city}, {selectedTheatre.state}
                    </p>
                  </div>
                </div>

                {/* Showtimes Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[var(--color-gold-500)]" />
                    Now Playing
                  </h3>

                  {loadingShowtimes ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="glass-card p-5 space-y-3 border border-[var(--color-border)]">
                          <div className="flex gap-4">
                            <LoadingSkeleton className="w-16 h-24 rounded-lg" />
                            <div className="flex-1 space-y-2">
                              <LoadingSkeleton className="h-5 w-1/3" />
                              <LoadingSkeleton className="h-4 w-1/4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : grouped.length > 0 ? (
                    <div className="space-y-5">
                      {grouped.map(({ movie, slots }) => (
                        <div
                          key={movie._id}
                          className="glass-card p-5 border border-[var(--color-border)] bg-white shadow-sm flex flex-col md:flex-row gap-5 hover:shadow-md transition-shadow duration-300"
                        >
                          {/* Movie Poster */}
                          {movie.poster ? (
                            <div className="relative w-24 h-36 rounded-xl overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] self-start">
                              <img
                                src={movie.poster}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-36 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 text-white font-bold text-center p-2 text-xs">
                              {movie.title}
                            </div>
                          )}

                          {/* Movie Meta & Showtimes Grid */}
                          <div className="flex-1 space-y-4">
                            <div>
                              <h4 className="font-extrabold text-lg text-[var(--color-text-primary)] leading-tight">
                                {movie.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--color-text-muted)] mt-1.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {movie.duration} Mins
                                </span>
                                <span>•</span>
                                <span>{movie.genres.join(', ')}</span>
                              </div>
                            </div>

                            {/* Showtimes Grid */}
                            <div className="space-y-3">
                              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                                Select Showtime
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {slots.map((slot) => {
                                  const showtimeTime = new Date(slot.startTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                  });
                                  const screenName = (slot.screenId as any)?.name || 'Screen';
                                  const screenType = (slot.screenId as any)?.screenType || 'STANDARD';
                                  
                                  return (
                                    <Link key={slot._id} href={`/booking/${slot._id}`}>
                                      <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-gold-500)] hover:bg-[var(--color-gold-500)]/5 transition-all text-center group cursor-pointer">
                                        <p className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-gold-500)]">
                                          {showtimeTime}
                                        </p>
                                        <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1 truncate">
                                          {screenName} ({formatScreenType(screenType)})
                                        </p>
                                        <p className="text-[10px] font-semibold text-[var(--color-gold-500)] mt-1.5">
                                          ₹{slot.ticketPrice}
                                        </p>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No Showtimes Found"
                      description="There are currently no active shows scheduled for this venue today. Check back later!"
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
