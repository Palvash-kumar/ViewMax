'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, DollarSign, Ticket, Film, Building2,
  Activity, ArrowUpRight, BarChart3, Download
} from 'lucide-react';
import api, { API_URL } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 font-display">{value}</p>
          {subtitle && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/5`}>
          <Icon size={22} className={color} />
        </div>
      </div>
    </motion.div>
  );
}

function MiniBarChart({ data }: { data: Array<{ date: string; revenue: number; bookings: number }> }) {
  if (!data?.length) return null;
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const last14 = data.slice(-14);
  return (
    <div className="flex items-end gap-1 h-32">
      {last14.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-sm bg-gradient-to-t from-[var(--color-gold-600)] to-[var(--color-gold-400)] min-h-[2px] transition-all duration-500"
            style={{ height: maxRevenue > 0 ? `${(d.revenue / maxRevenue) * 100}%` : '2px' }}
            title={`${d.date}: ₹${d.revenue}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.push('/');
  }, [user, router]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-platform'],
    queryFn: () => api.get('/analytics/platform').then(r => r.data.data),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['analytics-revenue'],
    queryFn: () => api.get('/analytics/revenue?days=30').then(r => r.data.data),
  });

  const { data: moviesData } = useQuery({
    queryKey: ['analytics-movies'],
    queryFn: () => api.get('/analytics/movies?limit=5').then(r => r.data.data),
  });

  const { data: theatresData } = useQuery({
    queryKey: ['analytics-theatres'],
    queryFn: () => api.get('/analytics/theatres/top?limit=5').then(r => r.data.data),
  });

  const { data: distributionData } = useQuery({
    queryKey: ['analytics-distribution'],
    queryFn: () => api.get('/analytics/bookings/distribution').then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-gold-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const platformStats = stats || {
    users: { total: 0, newLast7Days: 0 },
    bookings: { total: 0, confirmed: 0, cancelled: 0, cancellationRate: 0 },
    revenue: { total: 0, currency: 'INR' },
  };

  const statusColors: Record<string, string> = {
    CONFIRMED: 'bg-emerald-500',
    PENDING: 'bg-amber-500',
    CANCELLED: 'bg-red-500',
    EXPIRED: 'bg-gray-500',
    CHECKED_IN: 'bg-blue-500',
    REFUNDED: 'bg-purple-500',
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={20} className="text-[var(--color-gold-400)]" />
              <p className="text-xs font-semibold text-[var(--color-gold-400)] uppercase tracking-wider">Command Center</p>
            </div>
            <h1 className="text-3xl font-bold text-gradient-gold font-display">Analytics Dashboard</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Real-time platform insights</p>
          </div>
          <div className="flex gap-2">
            <a
              href={`${API_URL}/export/bookings/csv`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
            >
              <Download size={14} /> Export CSV
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Users"
            value={platformStats.users.total.toLocaleString()}
            subtitle={`+${platformStats.users.newLast7Days} this week`}
            icon={Users}
            color="text-blue-400"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${(platformStats.revenue.total / 100).toLocaleString()}`}
            subtitle="Confirmed bookings"
            icon={DollarSign}
            color="text-[var(--color-gold-400)]"
          />
          <StatCard
            title="Total Bookings"
            value={platformStats.bookings.total.toLocaleString()}
            subtitle={`${platformStats.bookings.confirmed} confirmed`}
            icon={Ticket}
            color="text-emerald-400"
          />
          <StatCard
            title="Cancellation Rate"
            value={`${platformStats.bookings.cancellationRate}%`}
            subtitle={`${platformStats.bookings.cancelled} cancelled`}
            icon={Activity}
            color="text-red-400"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Revenue (Last 30 Days)</h3>
              <TrendingUp size={16} className="text-[var(--color-gold-400)]" />
            </div>
            {revenueData && <MiniBarChart data={revenueData} />}
            {(!revenueData || revenueData.length === 0) && (
              <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                No revenue data yet
              </div>
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Booking Status</h3>
            <div className="space-y-3">
              {(distributionData || []).map((d: any) => {
                const total = (distributionData || []).reduce((s: number, x: any) => s + x.count, 0);
                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                return (
                  <div key={d._id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-text-secondary)]">{d._id}</span>
                      <span className="text-[var(--color-text-primary)] font-medium">{d.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-full ${statusColors[d._id] || 'bg-gray-500'}`}
                      />
                    </div>
                  </div>
                );
              })}
              {(!distributionData || distributionData.length === 0) && (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No data</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Film size={16} className="text-[var(--color-gold-400)]" />
              <h3 className="font-semibold text-[var(--color-text-primary)]">Top Movies by Revenue</h3>
            </div>
            <div className="space-y-3">
              {(moviesData || []).map((m: any, i: number) => (
                <div key={m._id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--color-text-muted)] w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{m.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{m.totalBookings} bookings</p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-gold-400)]">
                    ₹{(m.totalRevenue / 100).toLocaleString()}
                  </span>
                </div>
              ))}
              {(!moviesData || moviesData.length === 0) && (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No data yet</p>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-blue-400" />
              <h3 className="font-semibold text-[var(--color-text-primary)]">Top Theatres by Revenue</h3>
            </div>
            <div className="space-y-3">
              {(theatresData || []).map((t: any, i: number) => (
                <div key={t._id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--color-text-muted)] w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{t.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{t.city} · {t.totalBookings} bookings</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    ₹{(t.totalRevenue / 100).toLocaleString()}
                  </span>
                </div>
              ))}
              {(!theatresData || theatresData.length === 0) && (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No data yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
