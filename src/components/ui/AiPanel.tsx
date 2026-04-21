'use client';
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import { AiAlert, AiAnalysis } from '@/types';
import clsx from 'clsx';

export default function AiPanel({ rackId }: { rackId: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai', rackId],
    queryFn:  () => aiApi.analyze(rackId).then(r => r.data as AiAnalysis),
    staleTime: 60_000,
  });

  if (isLoading) return (
    <div className="flex items-center gap-3 py-4">
      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
      <span className="text-sm text-gray-500">Analyzing rack…</span>
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-red-400">Analysis failed</span>
      <button onClick={() => refetch()} className="text-xs text-blue-400 hover:underline">Retry</button>
    </div>
  );

  const { alerts, tips, summary } = data;
  const all = [...alerts, ...tips];
  const scoreColor = summary.score >= 80 ? '#10b981' : summary.score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header + score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <p className="text-sm font-bold text-white">AI Rack Insights</p>
            <p className="text-[10px] text-gray-600">{all.length === 0 ? 'Everything looks healthy!' : `${alerts.length} alert${alerts.length !== 1 ? 's' : ''}, ${tips.length} tip${tips.length !== 1 ? 's' : ''}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Health score ring */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1f2937" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15" fill="none" stroke={scoreColor} strokeWidth="3"
                strokeDasharray={`${(summary.score / 100) * 94} 94`} strokeLinecap="round"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold font-mono" style={{ color: scoreColor }}>{summary.score}</span>
          </div>
          <button onClick={() => refetch()} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">↻ Refresh</button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label:'Utilization', value:`${summary.utilizationPct}%`, color: summary.utilizationPct >= 90 ? '#ef4444' : summary.utilizationPct >= 75 ? '#f59e0b' : '#10b981' },
          { label:'Devices',     value: summary.deviceCount,  color:'#60a5fa' },
          { label:'Active Ports',value:`${summary.activePorts}/${summary.totalPorts}`, color:'#34d399' },
          { label:'Free U',      value: summary.freeU,        color:'#a78bfa' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900/60 border border-gray-800 rounded-lg p-2.5 text-center">
            <p className="text-sm font-bold font-mono" style={{ color }}>{value}</p>
            <p className="text-[9px] text-gray-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Alerts + tips */}
      {all.length === 0 ? (
        <div className="flex items-center gap-2.5 bg-green-900/20 border border-green-800/40 rounded-xl px-4 py-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-400">All Good!</p>
            <p className="text-[11px] text-green-700">No issues detected. Rack is healthy and well configured.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {all.map((item, i) => <AlertCard key={i} item={item} />)}
        </div>
      )}
    </div>
  );
}

function AlertCard({ item }: { item: AiAlert }) {
  const bg     = item.type === 'critical' ? 'rgba(239,68,68,0.08)'  : item.type === 'warning' ? 'rgba(245,158,11,0.08)'  : 'rgba(59,130,246,0.06)';
  const border = item.type === 'critical' ? 'rgba(239,68,68,0.3)'   : item.type === 'warning' ? 'rgba(245,158,11,0.3)'   : 'rgba(59,130,246,0.25)';
  const text   = item.type === 'critical' ? '#fca5a5'               : item.type === 'warning' ? '#fcd34d'                : '#93c5fd';

  return (
    <div className="flex gap-3 rounded-xl px-4 py-3 border" style={{ background: bg, borderColor: border }}>
      <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: text }}>{item.title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{item.msg}</p>
      </div>
    </div>
  );
}
