'use client';

import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const typeColors: Record<string, string> = {
  BOOKING_CONFIRMED: 'border-l-emerald-500',
  PAYMENT_SUCCESS: 'border-l-emerald-500',
  BOOKING_CANCELLED: 'border-l-red-500',
  TICKET_EXPIRY: 'border-l-amber-500',
  MODERATOR_ASSIGNED: 'border-l-blue-500',
  SYSTEM_ALERT: 'border-l-red-500',
  TRANSFER_RECEIVED: 'border-l-purple-500',
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

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: () => api.get('/notifications?limit=50').then(r => r.data.data),
    enabled: isAuthenticated,
    refetchInterval: 5000, // Poll all notifications every 5 seconds for real-time updates
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-notifications'] }),
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell size={18} className="text-[var(--color-gold-400)]" />
              <p className="text-xs font-semibold text-[var(--color-gold-400)] uppercase tracking-wider">Inbox</p>
            </div>
            <h1 className="text-3xl font-bold text-gradient-gold font-display">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-[var(--color-text-secondary)] transition-all"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--color-gold-500)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="glass-card p-16 text-center">
            <Bell size={48} className="mx-auto text-[var(--color-text-muted)] mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">All caught up!</h3>
            <p className="text-[var(--color-text-muted)]">No notifications yet.</p>
          </div>
        )}

        <div className="space-y-3">
          {notifications.map((n: any, i: number) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`glass-card p-4 border-l-4 relative ${
                typeColors[n.type] || 'border-l-gray-500'
              } ${!n.isRead ? 'bg-[var(--color-gold-500)]/[0.03]' : ''}`}
            >
              {!n.isRead && (
                <span className="absolute top-4 right-10 w-2 h-2 bg-[var(--color-gold-500)] rounded-full" />
              )}
              <div className="pr-8">
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{n.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{n.message}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">{timeAgo(n.createdAt)}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(n._id)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
