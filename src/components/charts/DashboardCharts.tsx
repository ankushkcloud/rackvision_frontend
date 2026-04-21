'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { AnalyticsDashboard, DEVICE_META, DeviceType } from '@/types';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const AXIS_STYLE = { fontSize: 10, fill: '#4b5563', fontFamily: 'JetBrains Mono, monospace' };
const GRID_STYLE = { stroke: '#1f2937', strokeDasharray: '3 3' };
const TOOLTIP_STYLE = {
  contentStyle: { background: '#161b27', border: '1px solid #374151', borderRadius: 8, fontSize: 11 },
  labelStyle: { color: '#9ca3af' },
  itemStyle: { color: '#e2e8f0' },
};

function toNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DashboardCharts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.dashboard().then(r => r.data as AnalyticsDashboard),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-56 animate-pulse">
            <div className="w-32 h-3 bg-gray-800 rounded mb-4" />
            <div className="h-36 bg-gray-900/60 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-500 text-sm">Analytics unavailable</p>
      </div>
    );
  }

  const { rackUtilization, deviceGrowth, alertTrend, downtimeTrend, deviceTypeDistribution } = data;
  const typeColors = Object.entries(DEVICE_META).map(([, meta]) => meta.border);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Rack Utilization" subtitle="Used U per rack" icon="📊">
          {rackUtilization.length === 0 ? (
            <EmptyState msg="No racks yet" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={rackUtilization} barSize={18} margin={{ left: -20, right: 10, top: 4, bottom: 0 }}>
                  <CartesianGrid {...GRID_STYLE} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value, name) => [
                      `${toNumber(value)}U`,
                      String(name) === 'usedU' ? 'Used' : 'Free',
                    ]}
                  />
                  <Bar
                    dataKey="usedU"
                    stackId="a"
                    fill="#3b82f6"
                    radius={[0, 0, 3, 3]}
                    label={{
                      position: 'insideTop',
                      fontSize: 9,
                      fill: '#93c5fd',
                      formatter: value => (toNumber(value) > 0 ? `${toNumber(value)}U` : ''),
                    }}
                  />
                  <Bar dataKey="freeU" stackId="a" fill="#1f2937" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-1">
                <LegendDot color="#3b82f6" label="Used U" />
                <LegendDot color="#1f2937" label="Free U" />
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Device Distribution" subtitle="Count by type" icon="🥧">
          {deviceTypeDistribution.length === 0 ? (
            <EmptyState msg="No devices yet" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie
                    data={deviceTypeDistribution}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {deviceTypeDistribution.map((entry, i) => (
                      <Cell
                        key={entry.type}
                        fill={DEVICE_META[entry.type as DeviceType]?.border || typeColors[i % typeColors.length]}
                        opacity={0.85}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    formatter={(value, name) => [toNumber(value), String(name).replace('_', ' ')]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {deviceTypeDistribution.map(item => {
                  const meta = DEVICE_META[item.type as DeviceType];
                  return (
                    <div key={item.type} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta?.border || '#6b7280' }} />
                        <span className="text-[10px] text-gray-400 capitalize">{meta?.label || item.type.replace('_', ' ')}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-white">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Device Growth" subtitle="Cumulative devices over 12 months" icon="📈">
          {deviceGrowth.every(item => item.count === 0) ? (
            <EmptyState msg="No device history yet" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={deviceGrowth} margin={{ left: -20, right: 10, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID_STYLE} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#colorTotal)" name="Total Devices" dot={false} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={1.5} fill="url(#colorNew)" name="New This Month" dot={false} strokeDasharray="4 2" />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: '#6b7280' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Alert Trend" subtitle="Alerts by priority (last 30 days)" icon="🔔">
          {alertTrend.every(item => item.high + item.medium + item.low === 0) ? (
            <EmptyState msg="No alerts in last 30 days" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={alertTrend} barSize={12} margin={{ left: -20, right: 10, top: 4, bottom: 0 }}>
                <CartesianGrid {...GRID_STYLE} vertical={false} />
                <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="high" stackId="a" fill="#ef4444" name="High" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="a" fill="#f59e0b" name="Medium" />
                <Bar dataKey="low" stackId="a" fill="#10b981" name="Low" radius={[3, 3, 0, 0]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: '#6b7280' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Downtime Events" subtitle="Device-down alerts per day (last 30 days)" icon="📉">
        {downtimeTrend.every(item => item.count === 0) ? (
          <EmptyState msg="No downtime events recorded yet" />
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={downtimeTrend} margin={{ left: -20, right: 10, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_STYLE} vertical={false} />
              <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} formatter={value => [toNumber(value), 'Downtime Events']} />
              <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} fill="url(#colorDown)" dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{icon}</span>
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-[10px] text-gray-600">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return <div className="flex items-center justify-center h-36 text-gray-700 text-sm">{msg}</div>;
}
