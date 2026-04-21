'use client';
// ─── FILE: frontend/src/components/alerts/AlertsPanel.tsx ────────────────────
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api';
import { RackAlert, ALERT_META, PRIORITY_META, AlertStatus, AlertPriority } from '@/types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  const m  = Math.floor(ms / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  if (m < 1440)return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
}

interface Props { rackId?: string; compact?: boolean; }

export default function AlertsPanel({ rackId, compact = false }: Props) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<AlertStatus | 'all'>('active');
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority | 'all'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', rackId, filter, priorityFilter],
    queryFn:  () => alertsApi.list({
      ...(rackId   ? { rackId }               : {}),
      ...(filter !== 'all'         ? { status:   filter         } : {}),
      ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
      limit: 40,
    }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const ackMut = useMutation({
    mutationFn: (id: string) => alertsApi.ack(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Alert acknowledged'); },
  });
  const resMut = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Alert resolved'); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Alert deleted'); },
  });

  const alerts: RackAlert[] = data?.alerts || [];
  const counts = data?.counts || { high: 0, medium: 0, low: 0 };
  const total  = counts.high + counts.medium + counts.low;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-xl">🔔</span>
            {total > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {total > 9 ? '9+' : total}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Alerts</h2>
            <p className="text-[10px] text-gray-600">
              {counts.high > 0 && <span className="text-red-400 mr-2">{counts.high} high</span>}
              {counts.medium > 0 && <span className="text-amber-400 mr-2">{counts.medium} medium</span>}
              {counts.low > 0 && <span className="text-green-400">{counts.low} low</span>}
              {total === 0 && <span className="text-gray-600">No active alerts</span>}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {(['all','active','acknowledged','resolved'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={clsx('px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all border',
                filter === s ? 'bg-blue-600/20 border-blue-600/50 text-blue-400' : 'border-gray-800 text-gray-600 hover:text-gray-300')}>
              {s}
            </button>
          ))}
          <select className="field text-[10px] py-1 px-2 w-24"
            value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as AlertPriority | 'all')}>
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          <span className="text-xs text-gray-500">Loading alerts…</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm font-semibold text-gray-400">All Clear</p>
          <p className="text-xs text-gray-600 mt-1">No alerts matching current filters</p>
        </div>
      ) : (
        <div className={clsx('space-y-2', compact && 'max-h-80 overflow-y-auto pr-1')}>
          {alerts.map(alert => <AlertCard key={alert._id} alert={alert} onAck={() => ackMut.mutate(alert._id)} onResolve={() => resMut.mutate(alert._id)} onDelete={() => delMut.mutate(alert._id)} />)}
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, onAck, onResolve, onDelete }: {
  alert: RackAlert; onAck: () => void; onResolve: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const am = ALERT_META[alert.type];
  const pm = PRIORITY_META[alert.priority];
  const rackName = typeof alert.rack === 'string' ? '' : alert.rack?.name;

  return (
    <div className="rounded-xl border transition-all" style={{ background: am.bg, borderColor: am.border }}>
      <div className="flex items-start gap-3 p-3.5 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        {/* Icon */}
        <span className="text-lg flex-shrink-0 mt-0.5">{am.icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-white">{alert.title}</span>
            {/* Priority badge */}
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1"
              style={{ color: pm.color, background: `${pm.dot}22`, border: `1px solid ${pm.dot}44` }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: pm.dot }} />
              {pm.label}
            </span>
            {/* Status badge */}
            {alert.status !== 'active' && (
              <span className={clsx('text-[9px] font-semibold px-1.5 py-0.5 rounded',
                alert.status === 'acknowledged' ? 'bg-amber-900/30 text-amber-400' : 'bg-green-900/30 text-green-400')}>
                {alert.status}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{alert.message}</p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
            {rackName && <span>📍 {rackName}</span>}
            {alert.device?.name && <span>💻 {alert.device.name}</span>}
            <span className="ml-auto">{timeAgo(alert.createdAt)}</span>
          </div>
        </div>

        <span className="text-gray-700 text-xs flex-shrink-0 mt-1">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="px-4 pb-3 pt-0 border-t border-white/5 flex items-center gap-2 flex-wrap">
          {alert.status === 'active' && (
            <button onClick={onAck} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-amber-900/30 border border-amber-800/40 text-amber-400 hover:bg-amber-900/50 transition-all">
              ✓ Acknowledge
            </button>
          )}
          {alert.status !== 'resolved' && (
            <button onClick={onResolve} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-green-900/30 border border-green-800/40 text-green-400 hover:bg-green-900/50 transition-all">
              ✅ Resolve
            </button>
          )}
          <button onClick={onDelete} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-900/30 text-red-500 hover:bg-red-900/40 transition-all ml-auto">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
