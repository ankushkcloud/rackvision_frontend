'use client';
// ─── FILE: frontend/src/app/dashboard/analytics/page.tsx ─────────────────────
// Create folder: frontend/src/app/dashboard/analytics/
// Create file:   frontend/src/app/dashboard/analytics/page.tsx
import DashboardCharts from '@/components/charts/DashboardCharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn:  () => analyticsApi.dashboard().then(r => r.data),
    staleTime: 60_000,
  });

  const totals = data?.totals || { racks: 0, devices: 0, alerts: 0 };

  return (
    <div className="p-7 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Infrastructure health, growth, and alert trends</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-600 font-mono">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Quick totals */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { label: 'Total Racks',    value: totals.racks,   icon: '🗄️', color: '#3b82f6' },
          { label: 'Total Devices',  value: totals.devices,  icon: '💻', color: '#10b981' },
          { label: 'Active Alerts',  value: totals.alerts,   icon: '🔔', color: totals.alerts > 0 ? '#ef4444' : '#10b981' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${color}15`, border: `1px solid ${color}33` }}>
                {icon}
              </div>
              <div>
                <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
                <p className="text-[10px] text-gray-600">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts />
    </div>
  );
}
