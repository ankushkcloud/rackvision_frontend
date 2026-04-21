'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ticketsApi } from '@/lib/api';
import { MaintenanceTicket } from '@/types';

export default function TicketsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketsApi.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => ticketsApi.create({ title, description, category: 'maintenance', priority: 'medium' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created');
      setTitle('');
      setDescription('');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ticketsApi.update(id, { status, timelineMessage: `Status changed to ${status}` }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });

  const tickets: MaintenanceTicket[] = data?.tickets || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr,1.35fr]">
        <div className="card p-6">
          <h1 className="text-3xl font-bold text-slate-900">Maintenance Tickets</h1>
          <p className="mt-2 text-sm text-slate-500">Track failures, assign engineers, and move issues through resolution.</p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="label">Ticket Title</label>
              <input className="field" value={title} onChange={e => setTitle(e.target.value)} placeholder="Power issue in Rack A" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="field min-h-[140px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the observed issue, affected asset, and impact." />
            </div>
            <button className="btn-blue w-full" onClick={() => createMutation.mutate()} disabled={!title || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create maintenance ticket'}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900">Active Workflow</h2>
          <div className="mt-5 space-y-4">
            {tickets.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/60 px-6 py-12 text-center text-sm text-slate-500">
                No tickets yet.
              </div>
            ) : tickets.map(ticket => (
              <div key={ticket._id} className="rounded-[24px] border border-sky-100 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{ticket.title}</p>
                    <p className="text-sm text-slate-500">{ticket.description || 'No additional notes'}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">{ticket.priority}</span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{ticket.status}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['open', 'assigned', 'in_progress', 'resolved'].map(status => (
                    <button key={status} className="btn-ghost px-3 py-2 text-xs" onClick={() => statusMutation.mutate({ id: ticket._id, status })}>
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
