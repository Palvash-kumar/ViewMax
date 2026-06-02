'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Suspense } from 'react';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setTokens, checkAuth } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      checkAuth().then(() => router.push('/movies'));
    } else {
      router.push('/login');
    }
  }, [searchParams, router, setTokens, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-gold-500)] border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--color-text-muted)]">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-sm text-[var(--color-text-muted)]">Loading...</p></div>}>
      <CallbackHandler />
    </Suspense>
  );
}
