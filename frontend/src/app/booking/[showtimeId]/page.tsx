'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, CreditCard, AlertCircle, Eye } from 'lucide-react';
import api from '@/lib/axios';
import SeatMap from '@/components/SeatMap';
import { Button } from '@/components/ui';
import { useBookingStore } from '@/stores/booking.store';
import { useAuthStore } from '@/stores/auth.store';
import dynamic from 'next/dynamic';

const SeatView3DModal = dynamic(
  () => import('@/components/theatre3d/SeatView3DModal'),
  { ssr: false },
);
import type { SeatAvailability } from '@/types';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { selectedSeats, totalAmount, setShowtime, clearSelection } = useBookingStore();

  const [seatData, setSeatData] = useState<{
    showtimeId: string;
    screenName: string;
    screenType: string;
    rows: number;
    columns: number;
    ticketPrice: number;
    seatAvailability: SeatAvailability[][];
  } | null>(null);
  const [showtime, setShowtimeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [show3DModal, setShow3DModal] = useState(false);
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [screenId, setScreenId] = useState<string | null>(null);

  useEffect(() => {
    if (!params.showtimeId) return;

    Promise.all([
      api.get(`/showtimes/${params.showtimeId}`),
      api.get(`/showtimes/${params.showtimeId}/seats`),
    ])
      .then(([stRes, seatsRes]) => {
        const st = stRes.data.data;
        setShowtimeData(st);
        const seats = seatsRes.data.data;
        setSeatData(seats);
        setShowtime(params.showtimeId as string, seats.ticketPrice);

        // Try to get layoutId from the screen for 3D view
        const sId = typeof st.screenId === 'string' ? st.screenId : st.screenId?._id;
        if (sId) {
          setScreenId(sId);
          api.get(`/theatre-design/public/screens/${sId}/layout`)
            .then((layoutRes) => {
              const layoutData = layoutRes.data.data || layoutRes.data;
              if (layoutData?._id) {
                setLayoutId(typeof layoutData._id === 'string' ? layoutData._id : layoutData._id.toString());
              }
            })
            .catch(() => {}); // Non-fatal — 3D view just won't be available
        }
      })
      .catch(() => setError('Failed to load seat data'))
      .finally(() => setLoading(false));

    return () => clearSelection();
  }, [params.showtimeId]);

  const handleBooking = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (selectedSeats.length === 0) return;

    setBookingLoading(true);
    setError('');

    try {
      const { data } = await api.post('/bookings', {
        showtimeId: params.showtimeId,
        seatNumbers: selectedSeats,
      });

      const checkoutUrl = data.data.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        router.push(`/bookings/${data.data.booking._id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-shimmer h-[500px] rounded-2xl" />
      </div>
    );
  }

  if (!seatData || !showtime) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Showtime Not Found</h1>
        <p className="text-[var(--color-text-muted)] mt-2">This showtime doesn&apos;t exist or has expired.</p>
      </div>
    );
  }

  const movie = showtime.movieId;
  const theatre = showtime.theatreId;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-6 cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Seat Map */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <SeatMap
              seatAvailability={seatData.seatAvailability}
              screenName={seatData.screenName}
              screenType={seatData.screenType}
            />
          </div>
        </div>

        {/* Booking summary */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 sticky top-24"
          >
            <h2 className="text-lg font-bold mb-4">Booking Summary</h2>

            {/* Movie info */}
            <div className="flex gap-3 mb-5 pb-5 border-b border-white/5">
              {movie?.poster && (
                <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0">
                  <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-sm">{movie?.title || 'Movie'}</h3>
                <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {theatre?.name || 'Theatre'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> {formatTime(showtime.startTime)} — {formatTime(showtime.endTime)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {formatDate(showtime.startTime)}
                </p>
              </div>
            </div>

            {/* Selected seats */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Selected Seats ({selectedSeats.length})
                </p>
                {selectedSeats.length > 0 && layoutId && (
                  <button
                    onClick={() => setShow3DModal(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-all cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    View from Seat
                  </button>
                )}
              </div>
              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.sort().map((seat) => (
                    <span key={seat} className="px-2 py-1 rounded-md text-xs font-medium bg-[var(--color-gold-500)]/15 text-[var(--color-gold-400)] border border-[var(--color-gold-500)]/20">
                      {seat}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">No seats selected</p>
              )}
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 mb-5 pb-5 border-b border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">
                  {selectedSeats.length} × ₹{seatData.ticketPrice}
                </span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">Convenience Fee</span>
                <span className="text-[var(--color-seat-available)]">FREE</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-5">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-gradient-gold">₹{totalAmount}</span>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-crimson-500)]/10 border border-[var(--color-crimson-500)]/20 mb-4">
                <AlertCircle className="w-4 h-4 text-[var(--color-crimson-400)] shrink-0" />
                <p className="text-xs text-[var(--color-crimson-400)]">{error}</p>
              </div>
            )}

            <Button
              size="lg"
              loading={bookingLoading}
              disabled={selectedSeats.length === 0}
              onClick={handleBooking}
              className="w-full"
            >
              <CreditCard className="w-4 h-4" />
              {isAuthenticated ? 'Proceed to Pay' : 'Sign In to Book'}
            </Button>

            <p className="text-[10px] text-[var(--color-text-muted)] text-center mt-3">
              Seats are locked for 10 minutes after booking starts
            </p>

            {/* Cancellation Policy Notice */}
            <div className="flex gap-2.5 items-start p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/15 mt-4">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-xs font-semibold text-blue-400">Cancellation Policy</p>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                  Cancellations with full refunds are available only up to 90 minutes before the show starts.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3D Seat View Modal */}
      {layoutId && screenId && (
        <SeatView3DModal
          isOpen={show3DModal}
          onClose={() => setShow3DModal(false)}
          layoutId={layoutId}
          screenId={screenId}
          seatLabel={selectedSeats[0] || ''}
        />
      )}
    </div>
  );
}
