'use client';
// ─── FILE: frontend/src/components/audit/AuditLogTable.tsx ───────────────────
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api';
import { AuditLog } from '@/types';
import clsx from 'clsx';

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  const m  = Math.floor(ms / 60000);
  if (m < 1)    return 'just now';
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ACTION_META: Record<string, { icon: string; color: string; label: string }> = {
  device_created:    { icon: '➕', color: '#10b981', label: 'Device Created'    },
  device_updated:    { icon: '✏️', color: '#3b82f6', label: 'Device Updated'    },
  device_deleted:    { icon: '🗑️', color: '#ef4444', label: 'Device Deleted'    },
  rack_created:      { icon: '🗄️', color: '#10b981', label: 'Rack Created'      },
  rack_updated:      { icon: '✏️', color: '#3b82f6', label: 'Rack Updated'      },
  rack_deleted:      { icon: '🗑️', color: '#ef4444', label: 'Rack Deleted'      },
  port_updated:      { icon: '🔌', color: '#a78bfa', label: 'Port Updated'      },
  port_bulk_updated: { icon: '🔌', color: '#a78bfa', label: 'Ports Bulk Updated'},
  rack_exported_pdf: { icon: '📄', color: '#f59e0b', label: 'Exported PDF'      },
  rack_exported_png: { icon: '🖼️', color: '#f59e0b', label: 'Exported PNG'      },
  health_updated:    { icon: '💊', color: '#22d3ee', label: 'Health Updated'    },
  warranty_created:  { icon: '📋', color: '#10b981', label: 'Warranty Added'    },
  warranty_updated:  { icon: '📋', color: '#3b82f6', label: 'Warranty Updated'  },
  alert_acknowledged:{ icon: '✓',  color: '#f59e0b', label: 'Alert Acknowledged'},
  alert_resolved:    { icon: '✅', color: '#10b981', label: 'Alert Resolved'    },
  user_login:        { icon: '🔑', color: '#6b7280', label: 'User Login'        },
  user_register:     { icon: '👤', color: '#6b7280', label: 'User Registered'   },
};

interface Props {
  rackId?:  string;    // if provided, shows only rack-scoped logs
  compact?: boolean;   // shorter version for sidebar
  limit?:   number;
}

export default function AuditLogTable({ rackId, compact = false, limit = 50 }: Props) {
  const [page,       setPage]       = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', rackId, actionFilter, entityFilter, page],
    queryFn: () =>
      rackId
        ? auditApi.rack(rackId).then(r => r.data)
        : auditApi.list({ action: actionFilter || undefined, entityType: entityFilter || undefined, page, limit }).then(r => r.data),
    staleTime: 15_000,
  });

  const logs: AuditLog[] = data?.logs || [];
  const total: number    = data?.total || 0;
  const pages            = Math.ceil(total / limit);

  const actionGroups = [
    { label: 'All',      value: '' },
    { label: 'Devices',  value: 'device_created' },
    { label: 'Racks',    value: 'rack_created'   },
    { label: 'Ports',    value: 'port_updated'   },
    { label: 'Exports',  value: 'rack_exported_pdf' },
    { label: 'Health',   value: 'health_updated' },
    { label: 'Warranty', value: 'warranty_created'},
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📜</span>
            <div>
              <h2 className="font-bold text-white text-sm">Audit Log</h2>
              <p className="text-[10px] text-gray-600">{total} total entries</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {actionGroups.map(g => (
              <button key={g.value} onClick={() => { setActionFilter(g.value); setPage(1); }}
                className={clsx('px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border',
                  actionFilter === g.value
                    ? 'bg-blue-600/20 border-blue-600/50 text-blue-400'
                    : 'border-gray-800 text-gray-600 hover:text-gray-300')}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Log list */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-6">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          <span className="text-xs text-gray-500">Loading audit logs…</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
          <p className="text-2xl mb-2">📜</p>
          <p className="text-sm text-gray-500">No audit logs yet</p>
          <p className="text-xs text-gray-700 mt-1">Actions you perform will appear here</p>
        </div>
      ) : (
        <div className={clsx('space-y-1.5', compact && 'max-h-72 overflow-y-auto pr-1')}>
          {logs.map(log => {
            const am = ACTION_META[log.action] || { icon: '•', color: '#6b7280', label: log.action };
            return (
              <div key={log._id}
                className="flex items-start gap-3 px-3.5 py-2.5 rounded-lg bg-gray-900/40 border border-gray-800/40 hover:border-gray-700/60 transition-all group">
                {/* Icon */}
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-sm"
                  style={{ background: `${am.color}18`, border: `1px solid ${am.color}33` }}>
                  <span className="text-xs">{am.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-white">{am.label}</span>
                    {log.entityName && (
                      <span className="text-[10px] text-gray-500 truncate max-w-[140px]">— {log.entityName}</span>
                    )}
                    {log.rackName && !rackId && (
                      <span className="text-[9px] text-gray-700 bg-gray-800 rounded px-1.5 py-0.5 ml-auto flex-shrink-0">{log.rackName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-gray-600">👤 {log.userName}</span>
                    <span className="text-[10px] text-gray-700 ml-auto">{timeAgo(log.createdAt)}</span>
                  </div>
                  {/* Changes preview */}
                  {log.changes && !compact && (
                    <div className="mt-1 text-[9px] font-mono text-gray-700 bg-gray-950/60 rounded px-2 py-1 border border-gray-800/40 max-w-full overflow-hidden">
                      {JSON.stringify(log.changes).slice(0, 120)}{JSON.stringify(log.changes).length > 120 ? '…' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!compact && pages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-600 pt-2">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 disabled:opacity-40 hover:text-gray-200 transition-all">
              ← Prev
            </button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 disabled:opacity-40 hover:text-gray-200 transition-all">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
