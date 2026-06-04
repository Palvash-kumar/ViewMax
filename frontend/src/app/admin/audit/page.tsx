'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, Download, Filter, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

function ActionBadge({ action }: { action: string }) {
  const isDelete = action.includes('DELETE') || action.includes('CANCEL') || action.includes('FAILED');
  const isCreate = action.includes('CREATE') || action.includes('CONFIRMED') || action.includes('REGISTER') || action.includes('CHECKED_IN');
  const color = isDelete
    ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : isCreate
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-mono font-medium ${color}`}>
      {action}
    </span>
  );
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, resourceFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (actionFilter) params.set('action', actionFilter);
      if (resourceFilter) params.set('resource', resourceFilter);
      return api.get(`/audit?${params}`).then(r => r.data.data);
    },
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList size={18} className="text-[var(--color-gold-400)]" />
              <p className="text-xs font-semibold text-[var(--color-gold-400)] uppercase tracking-wider">Compliance</p>
            </div>
            <h1 className="text-3xl font-bold text-gradient-gold font-display">Audit Logs</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">{total.toLocaleString()} total events</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
            >
              <RefreshCw size={16} />
            </button>
            <a
              href={`http://localhost:4000/api/export/audit-logs/csv${actionFilter ? `?action=${actionFilter}` : ''}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-[var(--color-text-secondary)] transition-all"
            >
              <Download size={14} /> Export CSV
            </a>
          </div>
        </div>

        <div className="glass-card p-4 mb-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search size={14} className="text-[var(--color-text-muted)] flex-shrink-0" />
            <input
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              placeholder="Filter by action..."
              className="bg-transparent outline-none text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Filter size={14} className="text-[var(--color-text-muted)] flex-shrink-0" />
            <input
              value={resourceFilter}
              onChange={e => { setResourceFilter(e.target.value); setPage(1); }}
              placeholder="Filter by resource..."
              className="bg-transparent outline-none text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] w-full"
            />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Actor', 'Action', 'Resource', 'Details', 'Timestamp'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-white/5 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                }
                {!isLoading && logs.map((log: any, i: number) => (
                  <motion.tr
                    key={log._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {log.actorId ? (
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)] text-xs">
                            {log.actorId.firstName} {log.actorId.lastName}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">{log.actorId.role}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><ActionBadge action={log.action} /></td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--color-text-secondary)]">{log.resource}</span>
                    </td>
                    <td className="px-4 py-3">
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <span className="text-xs text-[var(--color-text-muted)] font-mono truncate block max-w-xs">
                          {JSON.stringify(log.metadata).slice(0, 60)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-white/5">
              <p className="text-xs text-[var(--color-text-muted)]">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-secondary)] transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-secondary)] transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
