'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { Suspense } from 'react';

function CancelContent() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-10 text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-full bg-[var(--color-crimson-500)]/10 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-[var(--color-crimson-400)]" />
        </div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] mb-2">Payment Cancelled</h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          Your payment was cancelled. The seats have been released. You can try booking again.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/movies">
            <Button size="lg" className="w-full">
              Browse Movies <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function BookingCancelPage() {
  return <Suspense fallback={null}><CancelContent /></Suspense>;
}
