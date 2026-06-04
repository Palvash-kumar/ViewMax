'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Ticket, Check, Shield, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  icon?: string;
  createdAt: string;
}

const iconMap: Record<string, any> = {
  ticket: Ticket,
  'check-circle': Check,
  'x-circle': X,
  shield: Shield,
  send: Send,
  default: Bell,
};

const typeColors: Record<string, string> = {
  BOOKING_CONFIRMED: 'text-emerald-400',
  PAYMENT_SUCCESS: 'text-emerald-400',
  BOOKING_CANCELLED: 'text-red-400',
  TICKET_EXPIRY: 'text-amber-400',
  MODERATOR_ASSIGNED: 'text-blue-400',
  SYSTEM_ALERT: 'text-red-400',
  TRANSFER_RECEIVED: 'text-purple-400',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data.data),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?limit=20').then(r => r.data.data),
    enabled: isAuthenticated && open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!isAuthenticated) return null;

  const unreadCount = unreadData?.count || 0;
  const notifications: Notification[] = notifData?.data || [];

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-gold-400)] hover:bg-white/5 transition-all duration-200"
        aria-label="Notifications"
        id="notification-bell"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-[var(--color-gold-500)] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 w-80 sm:w-96 glass-card overflow-hidden z-50 shadow-2xl"
            style={{ border: '1px solid rgba(245,158,11,0.15)' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[var(--color-gold-400)]" />
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-[var(--color-gold-500)] text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-gold-400)] transition-colors flex items-center gap-1"
                >
                  <CheckCheck size={12} /> All read
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-96 divide-y divide-white/5">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-[var(--color-gold-500)] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="mx-auto text-[var(--color-text-muted)] mb-2" />
                  <p className="text-sm text-[var(--color-text-muted)]">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const IconComp = iconMap[n.icon || 'default'] || Bell;
                  return (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-white/5 cursor-pointer transition-colors relative ${
                        !n.isRead ? 'bg-[var(--color-gold-500)]/5' : ''
                      }`}
                      onClick={() => {
                        if (!n.isRead) markReadMutation.mutate(n._id);
                        if (n.link) window.location.href = n.link;
                        setOpen(false);
                      }}
                    >
                      {!n.isRead && (
                        <span className="absolute right-4 top-4 w-2 h-2 bg-[var(--color-gold-500)] rounded-full" />
                      )}
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${typeColors[n.type] || 'text-gray-400'}`}>
                          <IconComp size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{n.title}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-white/5">
              <a
                href="/notifications"
                className="block text-center text-xs text-[var(--color-gold-400)] hover:text-[var(--color-gold-300)] transition-colors"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
