'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { healthApi, monitoringApi } from '@/lib/api';
import { useRealtimeFeed } from '@/lib/useRealtimeFeed';
import { DeviceHealth, PingLog } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  deviceId: string;
  deviceName: string;
}

const STATUS_STYLES: Record<'online' | 'offline' | 'unknown', { color: string; dot: string; bg: string; border: string; label: string }> = {
  online: { color: '#34d399', dot: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', label: 'Online' },
  offline: { color: '#f87171', dot: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', label: 'Offline' },
  unknown: { color: '#94a3b8', dot: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.35)', label: 'Unknown' },
};

function formatDateTime(value?: string | null) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(value?: string | null) {
  if (!value) return 'No recent check';
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.round(diffHours / 24)} day ago`;
}

export default function DeviceHealthCard({ deviceId, deviceName }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<DeviceHealth>>({});
  const events = useRealtimeFeed(true);

  const { data, isLoading } = useQuery({
    queryKey: ['health', deviceId],
    queryFn: () => healthApi.get(deviceId).then(r => r.data),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['monitoring-history', deviceId],
    queryFn: () => monitoringApi.history(deviceId, { limit: 12 }).then(r => r.data),
  });

  useEffect(() => {
    const hasMonitoringEvent = events.some(event => event.type === 'monitoring.updated' && event.payload?.deviceId === deviceId);
    if (!hasMonitoringEvent) return;

    qc.invalidateQueries({ queryKey: ['health', deviceId] });
    qc.invalidateQueries({ queryKey: ['monitoring-history', deviceId] });
  }, [deviceId, events, qc]);

  const mut = useMutation({
    mutationFn: (payload: object) => healthApi.update(deviceId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health', deviceId] });
      toast.success('Health updated');
      setEditing(false);
    },
    onError: () => toast.error('Update failed'),
  });

  const health: DeviceHealth | null = data?.health || null;
  const logs: PingLog[] = historyData?.logs || [];

  const score = health?.healthScore ?? 100;
  const scoreClr = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const pingStatus = health?.pingStatus ?? 'unknown';
  const pingStyle = STATUS_STYLES[pingStatus];
  const powerClr = health?.powerStatus === 'on' ? '#10b981' : health?.powerStatus === 'off' ? '#ef4444' : '#6b7280';
  const tempClr = (health?.cpuTempC ?? 0) > (health?.tempThreshold ?? 75)
    ? '#ef4444'
    : (health?.cpuTempC ?? 0) > (health?.tempThreshold ?? 75) - 10
      ? '#f59e0b'
      : '#10b981';

  const timelineSummary = useMemo(() => {
    const onlineCount = logs.filter(log => log.status === 'online').length;
    const offlineCount = logs.filter(log => log.status === 'offline').length;
    return { onlineCount, offlineCount };
  }, [logs]);

  const openEdit = () => {
    setForm({
      pingStatus: health?.pingStatus ?? 'unknown',
      powerStatus: health?.powerStatus ?? 'unknown',
      cpuTempC: health?.cpuTempC ?? undefined,
      ambientTempC: health?.ambientTempC ?? undefined,
      tempThreshold: health?.tempThreshold ?? 75,
      pingLatencyMs: health?.pingLatencyMs ?? undefined,
      uptimePct: health?.uptimePct ?? 100,
      notes: health?.notes ?? '',
    });
    setEditing(true);
  };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">Health</span>
          <p className="text-sm font-bold text-white">Device Health</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: pingStyle.color, background: pingStyle.bg, borderColor: pingStyle.border }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: pingStyle.dot }} />
            {pingStyle.label}
          </span>
          <button onClick={openEdit} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Edit</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500">Loading...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[auto,1fr] gap-4 rounded-2xl border border-gray-800 bg-[#111827]/70 p-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#1f2937" strokeWidth="4" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke={scoreClr}
                  strokeWidth="4"
                  strokeDasharray={`${(score / 100) * 100.5} 100.5`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold font-mono" style={{ color: scoreClr }}>{score}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white">Monitoring Snapshot</p>
              <p className="text-[10px] text-gray-500">
                {score >= 80 ? 'Healthy and stable' : score >= 60 ? 'Needs attention' : 'Critical - immediate action recommended'}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[10px] text-gray-400">
                <span>Last ping: <span className="font-mono text-gray-200">{formatRelativeTime(health?.lastPingAt)}</span></span>
                <span>Latency: <span className="font-mono text-gray-200">{health?.pingLatencyMs ? `${health.pingLatencyMs} ms` : 'n/a'}</span></span>
                <span>Uptime: <span className="font-mono text-green-400">{typeof health?.uptimePct === 'number' ? `${health.uptimePct.toFixed(1)}%` : 'n/a'}</span></span>
                <span>Failures: <span className="font-mono text-gray-200">{health?.consecutiveFailures ? `${health.consecutiveFailures} probes` : 'Stable'}</span></span>
              </div>
              {health?.statusMessage && (
                <p className="pt-1 text-[10px] text-gray-500">{health.statusMessage}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricTile
              label="Ping Status"
              value={pingStyle.label}
              sub={health?.lastPingAt ? formatDateTime(health.lastPingAt) : undefined}
              color={pingStyle.color}
            />
            <MetricTile
              label="Power Status"
              value={health?.powerStatus ?? 'unknown'}
              sub={health?.powerWatts ? `${health.powerWatts}W draw` : undefined}
              color={powerClr}
            />
            <MetricTile
              label="CPU Temperature"
              value={health?.cpuTempC !== undefined ? `${health.cpuTempC} C` : 'n/a'}
              sub={health?.ambientTempC ? `Ambient ${health.ambientTempC} C` : undefined}
              color={health?.cpuTempC !== undefined ? tempClr : '#6b7280'}
            />
            <MetricTile
              label="Downtime"
              value={health?.lastDowntime ? formatDateTime(health.lastDowntime) : 'No outage'}
              sub={health?.totalDowntimeMinutes ? `${health.totalDowntimeMinutes} min total` : undefined}
              color="#94a3b8"
            />
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#0f172a]/55 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-white">Ping History</p>
                <p className="text-[10px] text-gray-500">Recent monitoring checks for {deviceName}</p>
              </div>
              <div className="text-right text-[10px] font-mono">
                <p className="text-green-400">{timelineSummary.onlineCount} online</p>
                <p className="text-red-400">{timelineSummary.offlineCount} offline</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {historyLoading ? (
                <p className="text-[10px] text-gray-500">Loading history...</p>
              ) : logs.length === 0 ? (
                <p className="text-[10px] text-gray-500">No monitoring history yet.</p>
              ) : logs.map(log => {
                const style = STATUS_STYLES[log.status];
                return (
                  <div key={log._id} className="rounded-xl border border-gray-800 bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: style.dot }} />
                          <span className="text-[11px] font-semibold" style={{ color: style.color }}>{style.label}</span>
                          <span className="text-[9px] uppercase tracking-[0.16em] text-gray-600">{log.source}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-gray-500">{formatDateTime(log.checkedAt)}</p>
                        <p className="mt-1 break-all text-[10px] text-gray-400">{log.target}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-mono text-white">
                          {typeof log.responseTimeMs === 'number' ? `${log.responseTimeMs} ms` : 'timeout'}
                        </p>
                        {log.errorMessage && (
                          <p className="mt-1 max-w-[130px] text-[9px] text-red-400">{log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {health?.notes && (
            <p className="rounded-lg border border-gray-800 bg-gray-900/50 p-2.5 text-[10px] text-gray-500">{health.notes}</p>
          )}

          {!health && (
            <p className="py-2 text-center text-[10px] text-gray-600">No health data yet. Click Edit to add.</p>
          )}
        </>
      )}

      {editing && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setEditing(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0f1117] animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
              <h3 className="text-sm font-bold text-white">Update Health - {deviceName}</h3>
              <button onClick={() => setEditing(false)} className="text-gray-600 hover:text-gray-300">X</button>
            </div>
            <div className="space-y-3 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ping Status</label>
                  <select className="field text-xs" value={form.pingStatus} onChange={e => setForm({ ...form, pingStatus: e.target.value as DeviceHealth['pingStatus'] })}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="label">Power Status</label>
                  <select className="field text-xs" value={form.powerStatus} onChange={e => setForm({ ...form, powerStatus: e.target.value as DeviceHealth['powerStatus'] })}>
                    <option value="on">On</option>
                    <option value="off">Off</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="label">CPU Temp (C)</label>
                  <input type="number" className="field text-xs" value={form.cpuTempC ?? ''} onChange={e => setForm({ ...form, cpuTempC: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="label">Temp Threshold (C)</label>
                  <input type="number" className="field text-xs" value={form.tempThreshold ?? 75} onChange={e => setForm({ ...form, tempThreshold: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Ping Latency (ms)</label>
                  <input type="number" className="field text-xs" value={form.pingLatencyMs ?? ''} onChange={e => setForm({ ...form, pingLatencyMs: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="label">Uptime %</label>
                  <input type="number" min={0} max={100} className="field text-xs" value={form.uptimePct ?? 100} onChange={e => setForm({ ...form, uptimePct: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Ambient Temp (C)</label>
                  <input type="number" className="field text-xs" value={form.ambientTempC ?? ''} onChange={e => setForm({ ...form, ambientTempC: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="label">Last Downtime</label>
                  <input type="date" className="field text-xs" value={form.lastDowntime ? new Date(form.lastDowntime).toISOString().split('T')[0] : ''} onChange={e => setForm({ ...form, lastDowntime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="field resize-none text-xs" rows={2} value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditing(false)} className="btn-ghost flex-1 py-2 text-xs">Cancel</button>
                <button onClick={() => mut.mutate(form)} disabled={mut.isPending} className="btn-blue flex-1 py-2 text-xs">
                  {mut.isPending ? 'Saving...' : 'Save Health'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
      <p className="text-[9px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className="mt-1 text-xs font-semibold capitalize" style={{ color }}>{value}</p>
      {sub && <p className="mt-1 font-mono text-[9px] text-gray-700">{sub}</p>}
    </div>
  );
}
