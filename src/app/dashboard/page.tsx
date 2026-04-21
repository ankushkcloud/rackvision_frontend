'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { rackApi, slaApi, ticketsApi, supportApi } from '@/lib/api';
import { Rack, RealtimeEvent } from '@/types';
import { timeAgo, utilColor } from '@/lib/utils';
import { useRealtimeFeed } from '@/lib/useRealtimeFeed';

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const events = useRealtimeFeed(true);

  const { data, isLoading } = useQuery({
    queryKey: ['racks', search],
    queryFn: () => rackApi.list({ search }).then(r => r.data),
  });
  const { data: slaData } = useQuery({
    queryKey: ['sla', 'overview', 'summary'],
    queryFn: () => slaApi.overview().then(r => r.data),
  });
  const { data: ticketData } = useQuery({
    queryKey: ['tickets', 'summary'],
    queryFn: () => ticketsApi.list({ status: 'open' }).then(r => r.data),
  });
  const { data: supportData } = useQuery({
    queryKey: ['support', 'summary'],
    queryFn: () => supportApi.list({ status: 'open' }).then(r => r.data),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => rackApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['racks'] });
      toast.success('Rack deleted');
    },
    onError: (e: AxiosError<{ error: string }>) => toast.error(e.response?.data?.error || 'Delete failed'),
  });

  const racks: Rack[] = data?.racks || [];
  const totalU = racks.reduce((sum, rack) => sum + rack.totalU, 0);
  const totalUsedU = racks.reduce((sum, rack) => sum + (rack.usedU || 0), 0);
  const totalDevices = racks.reduce((sum, rack) => sum + (rack.deviceCount || 0), 0);
  const avgUtil = totalU ? Math.round((totalUsedU / totalU) * 100) : 0;
  const openTickets = ticketData?.tickets?.length || 0;
  const openSupport = supportData?.requests?.length || 0;
  const avgUptime = slaData?.totals?.avgUptime || 100;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-6 bg-gradient-to-r from-slate-950 via-blue-950 to-sky-700 px-6 py-7 text-white sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.32em] text-sky-200">Enterprise Rack Operations</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Modern infrastructure visibility for your racks, devices, and teams.</h1>
            <p className="mt-3 text-sm text-sky-100/85 sm:text-base">
              Live activity, compliance tracking, discovery workflows, maintenance operations, and client-ready reporting from one command center.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/discovery" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-sky-700 shadow-lg shadow-sky-900/20">
              Run Discovery
            </Link>
            <Link href="/dashboard/tickets" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white">
              Manage Tickets
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Racks', value: racks.length, sub: 'active estates', color: 'text-sky-600' },
          { label: 'Devices', value: totalDevices, sub: 'tracked assets', color: 'text-blue-700' },
          { label: 'Utilization', value: `${avgUtil}%`, sub: `${totalUsedU}/${totalU || 0}U used`, color: 'text-indigo-600' },
          { label: 'Open Tickets', value: openTickets, sub: `${openSupport} support requests`, color: 'text-amber-600' },
          { label: 'Avg Uptime', value: `${avgUptime}%`, sub: 'SLA compliance view', color: 'text-emerald-600' },
        ].map(item => (
          <div key={item.label} className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className={`mt-3 text-3xl font-bold ${item.color}`}>{item.value}</p>
            <p className="mt-1 text-sm text-slate-500">{item.sub}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr,1fr]">
        <div className="card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Rack Estate</h2>
              <p className="text-sm text-slate-500">Manage layout, capacity, and field operations from a cleaner command view.</p>
            </div>
            <Link href="/dashboard/create" className="btn-blue">Create Rack</Link>
          </div>

          <div className="relative mt-5 max-w-md">
            <input className="field" placeholder="Search racks, locations, or tags" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {isLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[...Array(4)].map((_, index) => <div key={index} className="h-56 rounded-[24px] bg-sky-50 animate-pulse" />)}
            </div>
          ) : racks.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-sky-200 bg-sky-50/60 px-6 py-14 text-center">
              <p className="text-lg font-semibold text-slate-700">No racks yet</p>
              <p className="mt-2 text-sm text-slate-500">Create your first rack to unlock discovery, monitoring, and enterprise reports.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {racks.map(rack => (
                <RackCard
                  key={rack._id}
                  rack={rack}
                  onDelete={() => {
                    if (confirm(`Delete "${rack.name}" and all its devices?`)) delMut.mutate(rack._id);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-slate-900">Live Activity</h2>
            <p className="mt-1 text-sm text-slate-500">Real-time operational feed from monitoring, discovery, support, and backup actions.</p>
            <div className="mt-5 space-y-3">
              {events.length === 0 ? (
                <p className="rounded-2xl bg-sky-50 px-4 py-4 text-sm text-slate-500">Waiting for live events. Monitoring updates and operational actions will appear here.</p>
              ) : (
                events.map((event, index) => (
                  <div key={`${event.type}-${event.ts}-${index}`} className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">{formatEventTitle(event)}</p>
                      <span className="text-xs text-slate-400">{timeAgo(new Date(event.ts).toISOString())}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{JSON.stringify(event.payload || {})}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-slate-900">Quick Access</h2>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {[
                { href: '/dashboard/discovery', title: 'Auto discovery', sub: 'Run ping, SNMP, or Nmap-based workflows' },
                { href: '/dashboard/reports', title: 'Scheduled reports', sub: 'Configure daily, weekly, and monthly executive reports' },
                { href: '/dashboard/settings', title: 'Branding & access', sub: 'White-label the product and manage user roles' },
              ].map(link => (
                <Link key={link.href} href={link.href} className="rounded-2xl border border-sky-100 bg-white px-4 py-4 transition hover:bg-sky-50">
                  <p className="text-sm font-semibold text-slate-800">{link.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{link.sub}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function RackCard({ rack, onDelete }: { rack: Rack; onDelete: () => void }) {
  const usedU = rack.usedU || 0;
  const freeU = rack.totalU - usedU;
  const pct = Math.round((usedU / rack.totalU) * 100) || 0;
  const barClr = utilColor(pct);

  const copyShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${rack.shareToken}`);
    toast.success('Share link copied');
  };

  return (
    <div className="rounded-[26px] border border-sky-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">{rack.totalU}U</span>
            {rack.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">{tag}</span>
            ))}
          </div>
          <h3 className="truncate text-lg font-bold text-slate-900">{rack.name}</h3>
          {rack.location && <p className="mt-1 text-sm text-slate-500">{rack.location}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={copyShare} className="btn-ghost px-3 py-2 text-xs">Share</button>
          <button onClick={onDelete} className="btn-red px-3 py-2 text-xs">Delete</button>
        </div>
      </div>

      <div className="mt-4 flex gap-1 h-9 items-end">
        {Array.from({ length: rack.totalU }, (_, i) => {
          const filled = i < usedU;
          return <div key={i} className="flex-1 rounded-full" style={{ height: filled ? '100%' : '40%', background: filled ? barClr : '#dbeafe' }} />;
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
        <span>{rack.deviceCount || 0} devices</span>
        <span>{freeU}U free</span>
        <span className="ml-auto">{timeAgo(rack.createdAt)}</span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Utilization</span>
          <span className="font-semibold" style={{ color: barClr }}>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-sky-100">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barClr }} />
        </div>
      </div>

      <div className="mt-5 flex gap-2 border-t border-sky-100 pt-4">
        <Link href={`/dashboard/rack/${rack._id}`} className="btn-blue flex-1 text-center">Open Rack</Link>
        <Link href={`/dashboard/rack/${rack._id}/edit`} className="btn-ghost flex-1 text-center">Edit</Link>
      </div>
    </div>
  );
}

function formatEventTitle(event: RealtimeEvent) {
  return event.type.replace(/\./g, ' ').replace(/_/g, ' ');
}
