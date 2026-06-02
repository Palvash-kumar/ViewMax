'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--color-gold-500)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading ViewMax...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
