'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Film, Sparkles, ArrowRight, Popcorn, Ticket, Shield } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import api from '@/lib/axios';
import type { Movie } from '@/types';
import { Button } from '@/components/ui';

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies', { params: { limit: 8, sort: 'releaseDate', order: 'desc' } })
      .then((res) => setMovies(res.data.data.data || res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[var(--color-gold-500)]/5 blur-[120px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-bg-primary)_70%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-gold-500)]/10 border border-[var(--color-gold-500)]/20 text-[var(--color-gold-400)] text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Next-Gen Cinema Experience
              </span>

              <h1 className="text-5xl md:text-7xl font-extrabold font-[var(--font-display)] leading-[1.1] mb-6">
                <span className="text-[var(--color-text-primary)]">Your Seat,</span>
                <br />
                <span className="text-gradient-gold">Your View,</span>
                <br />
                <span className="text-[var(--color-text-primary)]">Your Movie.</span>
              </h1>

              <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-xl mb-8 leading-relaxed">
                Book premium cinema tickets with immersive seat selection. Experience movies the way they were meant to be seen.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/movies">
                  <Button size="lg">
                    Browse Movies <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="lg">
                    Create Account
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Popcorn,
                title: 'Premium Screens',
                desc: 'IMAX, Dolby, 70mm — choose the ultimate format for every film.',
              },
              {
                icon: Ticket,
                title: 'Smart Seat Selection',
                desc: 'Interactive seat maps with real-time availability and instant locking.',
              },
              {
                icon: Shield,
                title: 'Secure Payments',
                desc: 'Stripe-powered checkout with instant QR ticket generation.',
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card p-6 hover:bg-white/[0.03] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-gold-500)]/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[var(--color-gold-400)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Movies section */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-[var(--font-display)]">
                Now Showing
              </h2>
              <p className="text-[var(--color-text-muted)] text-sm mt-1">The latest movies at your favorite cinemas</p>
            </div>
            <Link href="/movies" className="text-[var(--color-gold-400)] hover:text-[var(--color-gold-300)] text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {movies.map((movie, i) => (
                <MovieCard key={movie._id} movie={movie} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Film className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Movies Available</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Check back soon for the latest releases.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-gold-400)] to-[var(--color-gold-600)] flex items-center justify-center">
              <Film className="w-4 h-4 text-[var(--color-bg-primary)]" />
            </div>
            <span className="text-sm font-bold text-gradient-gold">ViewMax</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} ViewMax. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
