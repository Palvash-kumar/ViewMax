'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { Suspense } from 'react';

function SuccessContent() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-10 text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] mb-2">Booking Confirmed!</h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          Your payment was successful and your seats are confirmed. Check your bookings for the QR ticket.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/bookings">
            <Button size="lg" className="w-full">
              View My Bookings <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/movies">
            <Button variant="secondary" size="lg" className="w-full">
              Browse More Movies
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return <Suspense fallback={null}><SuccessContent /></Suspense>;
}
