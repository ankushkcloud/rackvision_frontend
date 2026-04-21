'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { reportsApi } from '@/lib/api';
import { ReportSchedule } from '@/types';

export default function ReportsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<ReportSchedule['frequency']>('weekly');
  const [recipients, setRecipients] = useState('');

  const { data: previewData } = useQuery({
    queryKey: ['reports', 'preview'],
    queryFn: () => reportsApi.preview().then(r => r.data),
  });
  const { data } = useQuery({
    queryKey: ['reports', 'schedules'],
    queryFn: () => reportsApi.listSchedules().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => reportsApi.createSchedule({
      name,
      frequency,
      recipients: recipients.split(',').map(item => item.trim()).filter(Boolean),
      includeModules: ['summary', 'alerts', 'sla'],
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports', 'schedules'] });
      toast.success('Schedule created');
      setName('');
      setRecipients('');
    },
  });

  const schedules: ReportSchedule[] = data?.schedules || [];
  const summary = previewData?.report?.summary;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,1.3fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h1 className="text-3xl font-bold text-slate-900">Scheduled Reports</h1>
            <p className="mt-2 text-sm text-slate-500">Configure automated operational summaries for clients, managers, and support teams.</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="label">Report Name</label>
                <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="Weekly client summary" />
              </div>
              <div>
                <label className="label">Frequency</label>
                <select className="field" value={frequency} onChange={e => setFrequency(e.target.value as ReportSchedule['frequency'])}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="label">Recipients</label>
                <textarea className="field min-h-[120px]" value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="ops@example.com, client@example.com" />
              </div>
              <button className="btn-blue w-full" onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Create schedule'}
              </button>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-bold text-slate-900">Preview Summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryBox label="Racks" value={summary?.racks || 0} />
              <SummaryBox label="Devices" value={summary?.devices || 0} />
              <SummaryBox label="Active Alerts" value={summary?.activeAlerts || 0} />
              <SummaryBox label="Open Tickets" value={summary?.openTickets || 0} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900">Active Schedules</h2>
          <div className="mt-5 space-y-4">
            {schedules.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/60 px-6 py-12 text-center text-sm text-slate-500">
                No report schedules configured yet.
              </div>
            ) : schedules.map(schedule => (
              <div key={schedule._id} className="rounded-[24px] border border-sky-100 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{schedule.name}</p>
                    <p className="text-sm text-slate-500">{schedule.frequency} • {schedule.recipients.join(', ') || 'No recipients yet'}</p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                    {schedule.enabled ? 'enabled' : 'disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-sky-50 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-sky-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
