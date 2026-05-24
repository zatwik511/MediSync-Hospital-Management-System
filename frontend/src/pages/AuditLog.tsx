import { useState, useMemo } from 'react';
import { useAuditLogs } from '../hooks/useAudit';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { AuditLog } from '../api/auditApi';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 50;

const ACTION_COLOURS: Record<string, string> = {
  LOGIN:  'bg-green-100 text-green-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  CREATE: 'bg-blue-100 text-blue-700',
  READ:   'bg-purple-100 text-purple-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  EXPORT: 'bg-orange-100 text-orange-700',
};

const ENTITY_TYPES = ['', 'patient', 'appointment', 'image', 'staff', 'financial', 'auth'];
const ACTIONS      = ['', 'LOGIN', 'LOGOUT', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function AuditLog() {
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [staffSearch, setStaffSearch]   = useState('');
  const [page, setPage]                 = useState(1);

  const { data, isLoading, refetch, isFetching } = useAuditLogs(
    { action: actionFilter || undefined, entityType: entityFilter || undefined },
    page,
    PAGE_SIZE,
  );

  const logs  = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = useMemo(() => {
    if (!staffSearch.trim()) return logs;
    const q = staffSearch.toLowerCase();
    return logs.filter((l: AuditLog) => l.staff_name.toLowerCase().includes(q));
  }, [logs, staffSearch]);

  const resetPage = () => setPage(1);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-gray-500 mt-1">{total} events</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filter bar */}
        <div className="card p-4 mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); resetPage(); }}
              className="input-field text-sm py-1.5"
            >
              {ACTIONS.map(a => (
                <option key={a} value={a}>{a || 'All actions'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity type</label>
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); resetPage(); }}
              className="input-field text-sm py-1.5"
            >
              {ENTITY_TYPES.map(t => (
                <option key={t} value={t}>{t || 'All types'}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search staff name</label>
            <input
              type="text"
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              placeholder="Filter by name..."
              className="input-field text-sm py-1.5 w-full"
            />
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">No audit events match the current filters.</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((log: AuditLog) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {log.staff_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${ACTION_COLOURS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-600 capitalize">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="block text-xs font-mono text-gray-400 truncate max-w-[100px]">
                            {log.entity_id}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs">
                        <span className="line-clamp-2">{log.description}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono whitespace-nowrap">
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {page} of {totalPages} &mdash; {total} total events
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                  className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
