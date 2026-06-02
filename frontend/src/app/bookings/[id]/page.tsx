'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, Calendar, Ticket, Download } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui';
import type { Booking } from '@/types';

export default function BookingDetailPage() {
  const params = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    api.get(`/bookings/${params.id}`)
      .then((res) => setBooking(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8"><div className="animate-shimmer h-96 rounded-2xl" /></div>;
  }

  if (!booking) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Booking Not Found</h1></div>;
  }

  const st = booking.showtimeId;
  const movie = st?.movieId;
  const theatre = st?.theatreId;
  const screen = st?.screenId;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <Link href="/bookings" className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--color-gold-500)]/10 to-[var(--color-gold-600)]/5 px-6 py-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{movie?.title || 'Movie'}</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{theatre?.name} · {screen?.name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase
              ${booking.bookingStatus === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-[var(--color-text-muted)]'}`}>
              {booking.bookingStatus}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            {st?.startTime && (
              <>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</p>
                  <p className="text-sm font-medium">{formatDate(st.startTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Time</p>
                  <p className="text-sm font-medium">{formatTime(st.startTime)} — {formatTime(st.endTime)}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1 flex items-center gap-1"><Ticket className="w-3 h-3" /> Seats</p>
              <div className="flex flex-wrap gap-1">
                {booking.seatNumbers.map((s: string) => (
                  <span key={s} className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-gold-500)]/15 text-[var(--color-gold-400)]">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</p>
              <p className="text-sm font-medium">{theatre?.city}</p>
            </div>
          </div>

          {/* QR Code */}
          {booking.qrCode && booking.bookingStatus === 'CONFIRMED' && (
            <div className="flex flex-col items-center py-6 border-t border-b border-white/5">
              <p className="text-xs text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">Your Ticket QR Code</p>
              <div className="bg-white p-3 rounded-xl">
                <img src={booking.qrCode} alt="QR Code" className="w-40 h-40" />
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-3">Show this code at the cinema entrance</p>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-[var(--color-text-muted)]">Total Amount</span>
            <span className="text-2xl font-bold text-gradient-gold">₹{booking.totalAmount}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
