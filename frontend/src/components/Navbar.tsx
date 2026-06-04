'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Film, User, LogOut, Menu, X, Ticket, LayoutDashboard, ChevronDown, Shield, Scan } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import NotificationCenter from './NotificationCenter';
import CommandPalette from './CommandPalette';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinks = [
    { href: '/movies', label: 'Movies', icon: Film },
    { href: '/bookings', label: 'My Bookings', icon: Ticket, auth: true },
  ];

  const adminLinks = user?.role === 'ADMIN'
    ? [{ href: '/admin', label: 'Admin', icon: LayoutDashboard }]
    : user?.role === 'THEATRE_OWNER'
    ? [{ href: '/owner', label: 'Dashboard', icon: LayoutDashboard }]
    : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)]"
      style={{ background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-gold-400)] to-[var(--color-gold-600)] flex items-center justify-center shadow-lg">
              <Film className="w-5 h-5 text-[var(--color-bg-primary)]" />
            </div>
            <span className="text-xl font-bold font-[var(--font-display)] text-gradient-gold">
              ViewMax
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon, auth }) => {
              if (auth && !isAuthenticated) return null;
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                    }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${pathname.startsWith(href)
                    ? 'bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                  }`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <CommandPalette />
            {isAuthenticated && <NotificationCenter />}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-gold-400)] to-[var(--color-gold-600)] flex items-center justify-center text-sm font-bold text-[var(--color-bg-primary)]">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="text-sm text-[var(--color-text-primary)]">{user.firstName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-56 glass-card p-2 shadow-2xl">
                      <div className="px-3 py-2 border-b border-white/5">
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)]">
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                      <Link href="/profile"
                        className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)] transition-all"
                        onClick={() => setProfileOpen(false)}>
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link href="/profile/security"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)] transition-all"
                        onClick={() => setProfileOpen(false)}>
                        <Shield className="w-4 h-4" /> Security
                      </Link>
                      {['ADMIN', 'THEATRE_OWNER', 'THEATRE_MODERATOR'].includes(user.role) && (
                        <Link href="/scanner"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)] transition-all"
                          onClick={() => setProfileOpen(false)}>
                          <Scan className="w-4 h-4" /> Scanner
                        </Link>
                      )}
                      <button
                        onClick={() => { logout().then(() => router.push('/')); setProfileOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[var(--color-crimson-400)] hover:bg-[var(--color-crimson-500)]/10 transition-all cursor-pointer">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"
                  className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all">
                  Sign In
                </Link>
                <Link href="/register"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-600)] text-[var(--color-bg-primary)] hover:shadow-lg hover:shadow-[var(--color-gold-500)]/20 transition-all">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 cursor-pointer" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-[var(--color-border)] overflow-hidden"
            style={{ background: 'rgba(10, 14, 26, 0.95)' }}>
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ href, label, icon: Icon, auth }) => {
                if (auth && !isAuthenticated) return null;
                return (
                  <Link key={href} href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all">
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                );
              })}
              {!isAuthenticated && (
                <div className="flex gap-2 pt-2 border-t border-white/5 mt-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-white/5">
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-600)] text-[var(--color-bg-primary)]">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
