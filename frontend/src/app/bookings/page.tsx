'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Ticket, Clock, MapPin, Calendar, QrCode } from 'lucide-react';
import api from '@/lib/axios';
import { Button, EmptyState } from '@/components/ui';
import type { Booking } from '@/types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings')
      .then((res) => setBookings(res.data.data.data || res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CHECKED_IN': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'PENDING': return 'bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)] border-[var(--color-gold-500)]/20';
      case 'CANCELLED': return 'bg-[var(--color-crimson-500)]/10 text-[var(--color-crimson-400)] border-[var(--color-crimson-500)]/20';
      case 'EXPIRED': return 'bg-white/5 text-[var(--color-text-muted)] border-white/10';
      default: return 'bg-white/5 text-[var(--color-text-muted)] border-white/10';
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, bookingStatus: 'CANCELLED' } : b));
    } catch { /* ignore */ }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold font-[var(--font-display)] mb-2">My Bookings</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Your ticket history and upcoming shows</p>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-shimmer h-32" />
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking, i) => {
            const st = booking.showtimeId as any;
            const movie = st?.movieId;
            const theatre = st?.theatreId;
            const isCompleted = st?.endTime && new Date(st.endTime) < new Date();
            return (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                   {/* Poster */}
                  {movie?.poster && (
                    <div className="w-20 h-28 rounded-lg overflow-hidden shrink-0">
                      <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-lg truncate">{movie?.title || 'Movie'}</h3>
                        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {theatre?.name} · {theatre?.city}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border shrink-0 ${
                        isCompleted
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : getStatusColor(booking.bookingStatus)
                      }`}>
                        {isCompleted 
                          ? 'SHOW COMPLETED' 
                          : booking.bookingStatus === 'CHECKED_IN' 
                            ? 'IN THEATER' 
                            : booking.bookingStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[var(--color-text-secondary)]">
                      {st?.startTime && (
                        <>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(st.startTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {formatTime(st.startTime)}
                          </span>
                        </>
                      )}
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" /> {booking.seatNumbers.join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-lg font-bold text-gradient-gold">₹{booking.totalAmount}</span>

                      <div className="flex items-center gap-2">
                        {booking.qrCode && booking.bookingStatus === 'CONFIRMED' && (
                          <Link href={`/bookings/${booking._id}`}>
                            <Button variant="ghost" size="sm">
                              <QrCode className="w-4 h-4" /> View QR
                            </Button>
                          </Link>
                        )}
                        {booking.bookingStatus === 'CONFIRMED' && !isCompleted && (
                          <Button variant="danger" size="sm" onClick={() => handleCancel(booking._id)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No Bookings Yet" description="Your booked tickets will appear here. Start by browsing movies!" />
      )}
    </div>
  );
}
