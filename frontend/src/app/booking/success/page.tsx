'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('success'); // Fallback if direct access without sessionId
      return;
    }

    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 3;

    const verifySession = async () => {
      try {
        const res = await api.post('/payments/verify-session', { sessionId });
        if (res.data.data?.success) {
          if (isMounted) setStatus('success');
        } else {
          // If not paid yet, retry or fail
          if (attempts < maxAttempts - 1) {
            attempts++;
            setTimeout(verifySession, 2000);
          } else {
            if (isMounted) {
              setStatus('failed');
              setErrorMessage(res.data.data?.status === 'unpaid' ? 'Payment is unpaid' : 'Verification pending');
            }
          }
        }
      } catch (err: any) {
        if (attempts < maxAttempts - 1) {
          attempts++;
          setTimeout(verifySession, 2000);
        } else if (isMounted) {
          setStatus('failed');
          setErrorMessage(err.response?.data?.message || 'Failed to verify payment');
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-10 text-center max-w-md"
      >
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold font-[var(--font-display)] mb-2">Verifying Payment</h1>
            <p className="text-[var(--color-text-muted)] mb-8">
              Please wait while we confirm your payment and secure your seats...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold font-[var(--font-display)] mb-2">Booking Confirmed!</h1>
            <p className="text-[var(--color-text-muted)] mb-8">
              Your payment was successful and your seats are confirmed. Check your bookings for the QR ticket.
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold font-[var(--font-display)] mb-2">Verification Pending</h1>
            <p className="text-[var(--color-text-muted)] mb-8">
              We couldn&apos;t confirm your payment status immediately ({errorMessage}). If money was deducted, your booking will be updated shortly via our system.
            </p>
          </>
        )}

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
