'use client';

import { WifiOff, Film, RefreshCcw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center px-4">
      <div className="glass-card p-12 text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--color-gold-500)]/10 border border-[var(--color-gold-500)]/20 mb-6">
          <WifiOff size={36} className="text-[var(--color-gold-400)]" />
        </div>
        <h1 className="text-3xl font-bold text-gradient-gold font-display mb-3">You&apos;re offline</h1>
        <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
          Check your internet connection and try again. Your bookings are saved and will sync when you&apos;re back online.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-600)] text-black font-semibold text-sm hover:shadow-lg hover:shadow-[var(--color-gold-500)]/20 transition-all"
          >
            <RefreshCcw size={16} /> Try Again
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-[var(--color-text-secondary)] font-medium text-sm hover:bg-white/10 transition-all"
          >
            <Film size={16} /> Home
          </a>
        </div>
      </div>
    </div>
  );
}
