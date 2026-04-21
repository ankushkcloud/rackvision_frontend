'use client';
// ─── FILE: frontend/src/app/dashboard/alerts/page.tsx ────────────────────────
// Create folder: frontend/src/app/dashboard/alerts/
// Create file:   frontend/src/app/dashboard/alerts/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi, rackApi } from '@/lib/api';
import { RackAlert, ALERT_META, PRIORITY_META } from '@/types';
import AlertsPanel from '@/components/alerts/AlertsPanel';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const qc = useQueryClient();
  const [selectedRack, setSelectedRack] = useState('');

  const { data: racksData } = useQuery({
    queryKey: ['racks'],
    queryFn:  () => rackApi.list().then(r => r.data),
  });

  const { data: alertData } = useQuery({
    queryKey: ['alerts', 'summary'],
    queryFn:  () => alertsApi.list({ limit: 1, status: 'active' }).then(r => r.data),
  });

  const generateMut = useMutation({
    mutationFn: (rackId: string) => alertsApi.generate(rackId),
    onSuccess:  (r) => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(`Generated ${r.data.created} new alert${r.data.created !== 1 ? 's' : ''}`);
    },
    onError: () => toast.error('Alert generation failed'),
  });

  const racks = racksData?.racks || [];
  const counts = alertData?.counts || { high: 0, medium: 0, low: 0 };
  const totalActive = counts.high + counts.medium + counts.low;

  return (
    <div className="p-7 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Alerts</h1>
          <p className="text-gray-500 text-sm mt-0.5">Monitor and manage infrastructure alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="field text-xs py-2 w-44"
            value={selectedRack}
            onChange={e => setSelectedRack(e.target.value)}>
            <option value="">All Racks</option>
            {racks.map((r: any) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
          <button
            disabled={!selectedRack || generateMut.isPending}
            onClick={() => generateMut.mutate(selectedRack)}
            className="btn-blue flex items-center gap-2 text-xs py-2 px-3 disabled:opacity-40">
            {generateMut.isPending
              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/>Scanning…</>
              : <>🔍 Scan Rack</>}
          </button>
        </div>
      </div>

      {/* Priority summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {(['high','medium','low'] as const).map(p => {
          const pm = PRIORITY_META[p];
          return (
            <div key={p} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${pm.dot}15`, border: `1px solid ${pm.dot}33` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: pm.dot, boxShadow: `0 0 8px ${pm.dot}` }}/>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono" style={{ color: pm.color }}>
                  {counts[p]}
                </p>
                <p className="text-[10px] text-gray-600 capitalize">{p} priority</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert type breakdown */}
      <div className="card p-5 mb-7">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">📊</span>
          <p className="text-sm font-bold text-white">Alert Types</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(ALERT_META).map(([type, am]) => (
            <div key={type} className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
              style={{ background: am.bg, border: `1px solid ${am.border}` }}>
              <span className="text-base">{am.icon}</span>
              <p className="text-[10px] text-gray-400 leading-tight capitalize">
                {type.replace(/_/g, ' ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main alert panel */}
      <div className="card p-5">
        <AlertsPanel rackId={selectedRack || undefined} />
      </div>
    </div>
  );
}
