'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Monitor, Smartphone, MapPin, Clock, LogOut, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    HIGH: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const icons: Record<string, any> = { LOW: CheckCircle, MEDIUM: AlertTriangle, HIGH: XCircle };
  const Icon = icons[level] || CheckCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colors[level] || colors.LOW}`}>
      <Icon size={10} /> {level} RISK
    </span>
  );
}

function EventBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    LOGIN_SUCCESS: { label: 'Login', color: 'text-emerald-400 bg-emerald-500/10' },
    LOGIN_FAILED: { label: 'Failed Login', color: 'text-red-400 bg-red-500/10' },
    LOGOUT: { label: 'Logout', color: 'text-gray-400 bg-gray-500/10' },
    PASSWORD_RESET: { label: 'Password Reset', color: 'text-amber-400 bg-amber-500/10' },
    SESSION_TERMINATED: { label: 'Session Terminated', color: 'text-purple-400 bg-purple-500/10' },
    SUSPICIOUS_ACTIVITY: { label: 'Suspicious', color: 'text-red-400 bg-red-500/10' },
  };
  const config = map[type] || { label: type, color: 'text-gray-400 bg-gray-500/10' };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>{config.label}</span>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function SecurityDashboard() {
  const queryClient = useQueryClient();

  const { data: dashboardData } = useQuery({
    queryKey: ['security-dashboard'],
    queryFn: () => api.get('/security/dashboard').then(r => r.data.data),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['security-sessions'],
    queryFn: () => api.get('/security/sessions').then(r => r.data.data),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['security-events'],
    queryFn: () => api.get('/security/events?limit=10').then(r => r.data.data),
  });

  const terminateMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/security/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['security-sessions'] }),
  });

  const terminateAllMutation = useMutation({
    mutationFn: () => api.delete('/security/sessions'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['security-sessions'] }),
  });

  const dashboard = dashboardData || { failedLoginsLast7Days: 0, riskLevel: 'LOW' };
  const sessions = sessionsData || [];
  const events = eventsData?.data || [];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-[var(--color-gold-400)]" />
            <p className="text-xs font-semibold text-[var(--color-gold-400)] uppercase tracking-wider">Account Security</p>
          </div>
          <h1 className="text-3xl font-bold text-gradient-gold font-display">Security Center</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage your sessions and monitor account activity</p>
        </div>

        {/* Risk Overview */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Security Status</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {dashboard.failedLoginsLast7Days} failed login{dashboard.failedLoginsLast7Days !== 1 ? 's' : ''} in the last 7 days
              </p>
            </div>
            <RiskBadge level={dashboard.riskLevel} />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Active Sessions</h2>
            {sessions.length > 1 && (
              <button
                onClick={() => terminateAllMutation.mutate()}
                className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
              >
                <LogOut size={12} /> Terminate all
              </button>
            )}
          </div>
          <div className="space-y-3">
            {sessions.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No active sessions found</p>
            )}
            {sessions.map((s: any) => (
              <motion.div
                key={s.sessionId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  s.isCurrent
                    ? 'border-[var(--color-gold-500)]/30 bg-[var(--color-gold-500)]/5'
                    : 'border-white/5 bg-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  {s.device?.includes('Mobile') ? (
                    <Smartphone size={18} className="text-[var(--color-text-secondary)]" />
                  ) : (
                    <Monitor size={18} className="text-[var(--color-text-secondary)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {s.browser || 'Unknown Browser'}
                    </p>
                    {s.isCurrent && (
                      <span className="text-xs bg-[var(--color-gold-500)]/20 text-[var(--color-gold-400)] px-1.5 py-0.5 rounded-full">Current</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {s.ipAddress && (
                      <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                        <MapPin size={10} /> {s.ipAddress}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <Clock size={10} /> {s.createdAt ? formatDate(s.createdAt) : 'Unknown'}
                    </span>
                  </div>
                </div>
                {!s.isCurrent && (
                  <button
                    onClick={() => terminateMutation.mutate(s.sessionId)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-all"
                  >
                    <LogOut size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Security Events */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {events.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No security events</p>
            )}
            {events.map((e: any) => (
              <div key={e._id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <EventBadge type={e.eventType} />
                <div className="flex-1 min-w-0">
                  {e.ipAddress && (
                    <span className="text-xs text-[var(--color-text-muted)]">{e.ipAddress}</span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
                  {formatDate(e.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
