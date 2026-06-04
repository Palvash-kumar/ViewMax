'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Activity, Database, Zap, Server, Cpu, RefreshCw,
  CheckCircle, XCircle, MemoryStick, Clock
} from 'lucide-react';
import api from '@/lib/axios';

function ServiceCard({ name, status, latency, icon: Icon }: { name: string; status: string; latency?: number; icon: any }) {
  const healthy = status === 'healthy';
  return (
    <div className={`glass-card p-5 border ${healthy ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className={healthy ? 'text-emerald-400' : 'text-red-400'} />
          <span className="font-medium text-sm text-[var(--color-text-primary)]">{name}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${healthy ? 'text-emerald-400' : 'text-red-400'}`}>
          {healthy ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {status}
        </div>
      </div>
      {latency !== undefined && (
        <p className="text-xs text-[var(--color-text-muted)]">Latency: {latency}ms</p>
      )}
    </div>
  );
}

function MetricCard({ label, value, unit, icon: Icon }: any) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-[var(--color-gold-400)]" />
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--color-text-primary)] font-display">
        {value}<span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">{unit}</span>
      </p>
    </div>
  );
}

export default function HealthPage() {
  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then(r => r.data.data || r.data),
    refetchInterval: 15000,
  });

  const health = data || {};
  const overallHealthy = health.status === 'healthy';

  function formatUptime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={18} className={overallHealthy ? 'text-emerald-400' : 'text-red-400'} />
              <p className={`text-xs font-semibold uppercase tracking-wider ${overallHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                System Health
              </p>
            </div>
            <h1 className="text-3xl font-bold text-gradient-gold font-display">Platform Health</h1>
            {dataUpdatedAt ? (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Last checked: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </p>
            ) : null}
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-[var(--color-text-secondary)] transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-6 mb-6 border-2 ${overallHealthy ? 'border-emerald-500/30' : 'border-red-500/30'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${overallHealthy ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {overallHealthy
                ? <CheckCircle size={24} className="text-emerald-400" />
                : <XCircle size={24} className="text-red-400" />
              }
            </div>
            <div>
              <h2 className={`text-xl font-bold ${overallHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                {overallHealthy ? 'All Systems Operational' : 'System Degraded'}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                ViewMax v{health.version || '4.0.0'} · Uptime: {health.uptime ? formatUptime(health.uptime) : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Services */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <ServiceCard
            name="MongoDB"
            status={health.services?.database?.status || 'unknown'}
            latency={health.services?.database?.latency}
            icon={Database}
          />
          <ServiceCard
            name="Redis"
            status={health.services?.redis?.status || 'unknown'}
            latency={health.services?.redis?.latency}
            icon={Zap}
          />
        </div>

        {/* System Metrics */}
        {health.system && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard label="CPU Cores" value={health.system.cpus} unit="cores" icon={Cpu} />
            <MetricCard label="Memory Usage" value={health.system.memoryUsage} unit="%" icon={MemoryStick} />
            <MetricCard label="Free Memory" value={health.system.freeMemoryMB} unit="MB" icon={Server} />
            <MetricCard label="Response" value={health.latency} unit="ms" icon={Clock} />
          </div>
        )}
      </div>
    </div>
  );
}
