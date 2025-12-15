import React, { useState, useEffect, useCallback } from 'react';
import { supabase, Tables } from '../../lib/supabase';

type AuditLog = Tables<'audit_log'>;

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ table: string; action: string }>({
    table: '',
    action: '',
  });

  const fetchLogs = useCallback(async () => {
    try {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter.table) {
        query = query.eq('table_name', filter.table);
      }
      if (filter.action) {
        query = query.eq('action', filter.action);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      setError('Failed to load audit logs');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'UPDATE':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'DELETE':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-[#262626] text-[#737373]';
    }
  };

  const tables = [...new Set(logs.map((l) => l.table_name))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#525252] font-mono text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-space-grotesk font-bold text-white">Audit Log</h1>
        <p className="text-sm text-[#737373] font-mono">Track all content changes</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">
            Table
          </label>
          <select
            value={filter.table}
            onChange={(e) => setFilter((prev) => ({ ...prev, table: e.target.value }))}
            className="px-4 py-2 bg-[#0A0A0A] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
          >
            <option value="">All Tables</option>
            {tables.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">
            Action
          </label>
          <select
            value={filter.action}
            onChange={(e) => setFilter((prev) => ({ ...prev, action: e.target.value }))}
            className="px-4 py-2 bg-[#0A0A0A] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setFilter({ table: '', action: '' })}
            className="px-4 py-2 text-sm font-mono text-[#525252] hover:text-white transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Security notice */}
      <div className="mb-6 p-4 bg-[#2563EB]/5 border border-[#2563EB]/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#2563EB] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h3 className="text-sm font-space-grotesk font-semibold text-white mb-1">
              Immutable Audit Trail
            </h3>
            <p className="text-xs text-[#737373] font-mono">
              Every content change is automatically logged with timestamps. These records cannot be modified or deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Log list */}
      {logs.length === 0 ? (
        <div className="p-8 bg-[#0A0A0A] border border-[#262626] text-center">
          <p className="text-sm text-[#525252] font-mono">No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-[#0A0A0A] border border-[#262626] overflow-hidden"
            >
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#0A0A0A]/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border ${getActionColor(log.action)}`}
                  >
                    {log.action}
                  </span>
                  <span className="text-sm font-mono text-white">{log.table_name}</span>
                  <span className="text-xs font-mono text-[#525252]">#{log.record_id}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-[#525252]">
                    {formatDate(log.created_at)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-[#525252] transition-transform ${
                      expandedId === log.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded details */}
              {expandedId === log.id && (
                <div className="px-4 pb-4 border-t border-[#1f2937]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {log.action !== 'CREATE' && log.old_data && (
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest text-red-400 font-mono mb-2">
                          Old Data
                        </h4>
                        <pre className="p-3 bg-[#050505] border border-[#1f2937] text-xs text-[#a3a3a3] font-mono overflow-x-auto max-h-48">
                          {JSON.stringify(log.old_data, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.action !== 'DELETE' && log.new_data && (
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest text-green-400 font-mono mb-2">
                          New Data
                        </h4>
                        <pre className="p-3 bg-[#050505] border border-[#1f2937] text-xs text-[#a3a3a3] font-mono overflow-x-auto max-h-48">
                          {JSON.stringify(log.new_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="mt-4 pt-4 border-t border-[#1f2937] flex flex-wrap gap-4 text-xs font-mono text-[#525252]">
                    {log.ip_address && (
                      <div>
                        <span className="text-[#737373]">IP:</span> {log.ip_address}
                      </div>
                    )}
                    {log.user_agent && (
                      <div className="truncate max-w-xs">
                        <span className="text-[#737373]">UA:</span> {log.user_agent}
                      </div>
                    )}
                    <div>
                      <span className="text-[#737373]">ID:</span> {log.id}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      <div className="mt-4 text-xs text-[#525252] font-mono">
        Showing {logs.length} entries (max 100)
      </div>
    </div>
  );
};

export default AuditLogViewer;
