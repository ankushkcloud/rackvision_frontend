'use client';

import { useQuery } from '@tanstack/react-query';
import { slaApi } from '@/lib/api';
import { SlaOverview } from '@/types';

export default function SlaPage() {
  const { data } = useQuery({
    queryKey: ['sla', 'overview'],
    queryFn: () => slaApi.overview().then(r => r.data as SlaOverview),
  });

  const overview = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="card p-6">
        <h1 className="text-3xl font-bold text-slate-900">SLA & Compliance Tracking</h1>
        <p className="mt-2 text-sm text-slate-500">Track uptime commitments, downtime impact, and enterprise-ready compliance history.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Metric label="Tracked Devices" value={overview?.totals.devices || 0} />
          <Metric label="Compliant Assets" value={overview?.totals.compliantDevices || 0} />
          <Metric label="Average Uptime" value={`${overview?.totals.avgUptime || 100}%`} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr,1fr]">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Asset SLA Status</h2>
            <div className="mt-4 space-y-3">
              {(overview?.deviceSummaries || []).map(item => (
                <div key={item.deviceId} className="rounded-[24px] border border-sky-100 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.deviceName}</p>
                      <p className="text-sm text-slate-500">Target {item.slaTarget}% • Downtime {item.downtimeMinutes} min</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${item.compliant ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {item.compliant ? 'compliant' : 'at risk'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Compliance Feed</h2>
            <div className="mt-4 space-y-3">
              {(overview?.compliance || []).map(log => (
                <div key={log._id} className="rounded-[24px] border border-sky-100 bg-sky-50/60 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{log.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{log.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-sky-50 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-sky-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
