'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/stores/booking.store';
import type { SeatAvailability } from '@/types';

interface SeatMapProps {
  seatAvailability: SeatAvailability[][];
  screenName: string;
  screenType: string;
}

export default function SeatMap({ seatAvailability, screenName, screenType }: SeatMapProps) {
  const { selectedSeats, toggleSeat } = useBookingStore();

  const getSeatColor = (seat: SeatAvailability) => {
    if (selectedSeats.includes(seat.seatNumber)) return 'bg-[var(--color-seat-selected)] text-[var(--color-bg-primary)] scale-110 shadow-lg shadow-[var(--color-gold-500)]/30';
    if (seat.isBooked) return 'bg-[var(--color-seat-booked)]/60 cursor-not-allowed';
    if (seat.isLocked) return 'bg-[var(--color-seat-locked)]/60 cursor-not-allowed';
    if (seat.type === 'BLOCKED') return 'invisible';
    if (seat.type === 'VIP') return 'bg-[var(--color-seat-vip)]/20 border border-[var(--color-seat-vip)]/40 hover:bg-[var(--color-seat-vip)]/40 text-[var(--color-seat-vip)]';
    if (seat.type === 'PREMIUM') return 'bg-[var(--color-seat-premium)]/20 border border-[var(--color-seat-premium)]/40 hover:bg-[var(--color-seat-premium)]/40 text-[var(--color-seat-premium)]';
    if (seat.type === 'RECLINER') return 'bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/40 text-emerald-400';
    if (seat.type === 'WHEELCHAIR') return 'bg-blue-500/20 border border-blue-500/40 hover:bg-blue-500/40 text-blue-400';
    if (seat.type === 'CUSTOM') return 'bg-pink-500/20 border border-pink-500/40 hover:bg-pink-500/40 text-pink-400';
    return 'bg-[var(--color-seat-available)]/15 border border-[var(--color-seat-available)]/30 hover:bg-[var(--color-seat-available)]/30 text-[var(--color-seat-available)]';
  };

  return (
    <div className="space-y-6">
      {/* Screen */}
      <div className="relative flex flex-col items-center">
        <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-[var(--color-gold-400)] to-transparent rounded-full opacity-60" />
        <div className="w-2/3 h-px bg-gradient-to-r from-transparent via-[var(--color-gold-400)]/30 to-transparent mt-1" />
        <p className="text-[var(--color-text-muted)] text-xs mt-2 uppercase tracking-widest">
          {screenName} — {screenType.replace('_', ' ')}
        </p>
      </div>

      {/* Seat grid */}
      <div className="flex flex-col items-center gap-1.5 py-4">
        {seatAvailability.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-1.5">
            <span className="w-6 text-center text-[10px] font-medium text-[var(--color-text-muted)]">
              {row[0]?.row}
            </span>

            {row.map((seat) => (
              <motion.button
                key={seat.seatNumber}
                whileHover={seat.isAvailable ? { scale: 1.15 } : undefined}
                whileTap={seat.isAvailable ? { scale: 0.95 } : undefined}
                disabled={!seat.isAvailable}
                onClick={() => seat.isAvailable && toggleSeat(seat.seatNumber)}
                className={`w-7 h-7 rounded-md text-[9px] font-semibold transition-all duration-200 cursor-pointer
                  ${getSeatColor(seat)}`}
                title={`${seat.seatNumber} - ${seat.type}${seat.isBooked ? ' (Booked)' : seat.isLocked ? ' (Locked)' : ''}`}
              >
                {seat.type !== 'BLOCKED' ? seat.column : ''}
              </motion.button>
            ))}

            <span className="w-6 text-center text-[10px] font-medium text-[var(--color-text-muted)]">
              {row[0]?.row}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-white/5">
        {[
          { color: 'bg-[var(--color-seat-available)]/30 border border-[var(--color-seat-available)]/50', label: 'Available' },
          { color: 'bg-[var(--color-seat-selected)]', label: 'Selected' },
          { color: 'bg-[var(--color-seat-booked)]/60', label: 'Booked' },
          { color: 'bg-[var(--color-seat-premium)]/30 border border-[var(--color-seat-premium)]/50', label: 'Premium' },
          { color: 'bg-[var(--color-seat-vip)]/30 border border-[var(--color-seat-vip)]/50', label: 'VIP' },
          { color: 'bg-emerald-500/30 border border-emerald-500/50', label: 'Recliner' },
          { color: 'bg-blue-500/30 border border-blue-500/50', label: 'Wheelchair' },
          { color: 'bg-pink-500/30 border border-pink-500/50', label: 'Custom' },
          { color: 'bg-[var(--color-seat-locked)]/60', label: 'Locked' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded-sm ${color}`} />
            <span className="text-[11px] text-[var(--color-text-muted)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
