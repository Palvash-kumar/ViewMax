'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Film, Building2, Users, Loader2, ArrowRight, Command } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface SearchResults {
  movies?: any[];
  theatres?: any[];
  users?: any[];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(prev => !prev);
    }
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [open]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () =>
      api.get(`/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`).then(r => r.data.data),
    enabled: debouncedQuery.length >= 2,
  });

  const results: SearchResults = data?.results || {};
  const hasResults = Object.values(results).some(arr => arr && arr.length > 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--color-text-muted)] text-sm transition-all duration-200"
        id="command-palette-trigger"
      >
        <Search size={14} />
        <span>Search...</span>
        <span className="flex items-center gap-0.5 ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded">
          <Command size={10} /> K
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl glass-card overflow-hidden shadow-2xl"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3 p-4 border-b border-white/5">
                {isLoading && debouncedQuery.length >= 2 ? (
                  <Loader2 size={18} className="text-[var(--color-gold-400)] animate-spin flex-shrink-0" />
                ) : (
                  <Search size={18} className="text-[var(--color-gold-400)] flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search movies, theatres, users..."
                  className="flex-1 bg-transparent outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] text-sm"
                  id="command-palette-input"
                />
                <kbd className="hidden sm:flex items-center gap-1 text-xs text-[var(--color-text-muted)] bg-white/5 px-2 py-1 rounded">
                  ESC
                </kbd>
              </div>

              <div className="max-h-96 overflow-y-auto p-2">
                {query.length < 2 && (
                  <div className="p-6 text-center">
                    <Search size={32} className="mx-auto text-[var(--color-text-muted)] mb-2 opacity-50" />
                    <p className="text-sm text-[var(--color-text-muted)]">Type at least 2 characters to search</p>
                  </div>
                )}

                {query.length >= 2 && !isLoading && !hasResults && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-[var(--color-text-muted)]">No results for &ldquo;{query}&rdquo;</p>
                  </div>
                )}

                {results.movies && results.movies.length > 0 && (
                  <div className="mb-3">
                    <p className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Movies</p>
                    {results.movies.map((m: any) => (
                      <button
                        key={m._id}
                        onClick={() => { router.push('/movies'); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                      >
                        <Film size={16} className="text-[var(--color-gold-400)] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{m.title}</p>
                          {m.genres?.length > 0 && (
                            <p className="text-xs text-[var(--color-text-muted)]">{m.genres.slice(0, 2).join(', ')}</p>
                          )}
                        </div>
                        <ArrowRight size={14} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {results.theatres && results.theatres.length > 0 && (
                  <div className="mb-3">
                    <p className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Theatres</p>
                    {results.theatres.map((t: any) => (
                      <button
                        key={t._id}
                        onClick={() => { router.push('/theatres'); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                      >
                        <Building2 size={16} className="text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{t.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{t.city}</p>
                        </div>
                        <ArrowRight size={14} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {results.users && results.users.length > 0 && (
                  <div className="mb-3">
                    <p className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Users</p>
                    {results.users.map((u: any) => (
                      <button
                        key={u._id}
                        onClick={() => { router.push('/admin'); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                      >
                        <div className="w-6 h-6 rounded-full bg-[var(--color-gold-500)]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[var(--color-gold-400)]">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)] truncate">{u.email}</p>
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)] bg-white/5 px-1.5 py-0.5 rounded">{u.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
