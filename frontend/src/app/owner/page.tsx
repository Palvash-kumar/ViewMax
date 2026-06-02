'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Monitor, Calendar, Plus, Settings } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { Button, EmptyState } from '@/components/ui';
import type { Theatre, Screen, Showtime } from '@/types';

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheatre, setSelectedTheatre] = useState<string | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);

  useEffect(() => {
    api.get('/theatres/my')
      .then((res) => {
        const t = res.data.data || [];
        setTheatres(t);
        if (t.length > 0) setSelectedTheatre(t[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTheatre) return;
    api.get(`/theatres/${selectedTheatre}/screens`)
      .then((res) => setScreens(res.data.data || []))
      .catch(() => setScreens([]));
  }, [selectedTheatre]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-display)]">
            <Building2 className="w-8 h-8 inline-block mr-2 text-[var(--color-gold-400)]" />
            Owner Dashboard
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Manage your theatres, screens, and showtimes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card p-5 animate-shimmer h-24" />)}
        </div>
      ) : theatres.length === 0 ? (
        <EmptyState title="No Theatres" description="You haven't added any theatres yet. Contact an admin to get started." />
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Theatre sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Your Theatres</h3>
            {theatres.map((theatre) => (
              <button
                key={theatre._id}
                onClick={() => setSelectedTheatre(theatre._id)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer
                  ${selectedTheatre === theatre._id
                    ? 'bg-[var(--color-gold-500)]/10 border border-[var(--color-gold-500)]/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
              >
                <h4 className="font-medium text-sm">{theatre.name}</h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{theatre.city}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase
                  ${theatre.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)]'}`}>
                  {theatre.status}
                </span>
              </button>
            ))}
          </div>

          {/* Screens */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[var(--color-gold-400)]" /> Screens
              </h3>
            </div>

            {screens.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {screens.map((screen, i) => (
                  <motion.div
                    key={screen._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{screen.name}</h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-400">
                        {screen.screenType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xl font-bold">{screen.capacity}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">Capacity</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{screen.rows}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">Rows</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{screen.columns}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">Columns</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--color-text-muted)]">
                <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No screens configured for this theatre</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
