'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supportApi } from '@/lib/api';
import { SupportRequest } from '@/types';

export default function SupportPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState<SupportRequest['module']>('other');

  const { data } = useQuery({
    queryKey: ['support'],
    queryFn: () => supportApi.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => supportApi.create({ title, description, module, priority: 'medium' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support'] });
      toast.success('Support request submitted');
      setTitle('');
      setDescription('');
    },
  });

  const requests: SupportRequest[] = data?.requests || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr,1.35fr]">
        <div className="card p-6">
          <h1 className="text-3xl font-bold text-slate-900">Customer Support</h1>
          <p className="mt-2 text-sm text-slate-500">Capture internal requests, operational blockers, and ongoing support history in one place.</p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="label">Issue Title</label>
              <input className="field" value={title} onChange={e => setTitle(e.target.value)} placeholder="Dashboard report mismatch" />
            </div>
            <div>
              <label className="label">Module</label>
              <select className="field" value={module} onChange={e => setModule(e.target.value as SupportRequest['module'])}>
                <option value="dashboard">Dashboard</option>
                <option value="rack">Rack</option>
                <option value="device">Device</option>
                <option value="alerts">Alerts</option>
                <option value="reports">Reports</option>
                <option value="branding">Branding</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="field min-h-[140px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain the issue, expected behavior, and urgency." />
            </div>
            <button className="btn-blue w-full" onClick={() => createMutation.mutate()} disabled={!title || createMutation.isPending}>
              {createMutation.isPending ? 'Submitting...' : 'Submit support request'}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900">Support History</h2>
          <div className="mt-5 space-y-4">
            {requests.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/60 px-6 py-12 text-center text-sm text-slate-500">
                No support requests yet.
              </div>
            ) : requests.map(request => (
              <div key={request._id} className="rounded-[24px] border border-sky-100 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{request.title}</p>
                    <p className="text-sm text-slate-500">{request.module} • {request.requesterEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-purple-600">{request.priority}</span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{request.status}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{request.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
