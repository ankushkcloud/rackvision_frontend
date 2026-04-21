'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rackApi } from '@/lib/api';
import { RACK_SIZES } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export default function CreateRackPage() {
  const router = useRouter();
  const qc     = useQueryClient();
  const [f, setF] = useState({ name:'', location:'', totalU:42, description:'', tags:'' });

  const mut = useMutation({
    mutationFn: () => rackApi.create({ ...f, tags: f.tags.split(',').map(t=>t.trim()).filter(Boolean) }),
    onSuccess:  r => { qc.invalidateQueries({ queryKey:['racks'] }); toast.success('Rack created!'); router.push(`/dashboard/rack/${r.data.rack._id}`); },
    onError:    (e:AxiosError<{error:string}>) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const preview = Array.from({ length: Math.min(f.totalU, 22) }, (_, i) => i + 1);

  return (
    <div className="p-7 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
        <span>/</span><span className="text-gray-300">New Rack</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Form */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Create New Rack</h1>
          <p className="text-gray-500 text-sm mb-7">Configure rack dimensions and metadata</p>

          <form onSubmit={e => { e.preventDefault(); if (!f.name.trim()) { toast.error('Name required'); return; } mut.mutate(); }} className="space-y-5">
            <div>
              <label className="label">Rack Name *</label>
              <input className="field" placeholder="e.g. DC1 — Rack A" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="field" placeholder="Data Center 1, Room 101" value={f.location} onChange={e=>setF({...f,location:e.target.value})} />
            </div>

            <div>
              <label className="label">Rack Size</label>
              <div className="grid grid-cols-4 gap-2">
                {RACK_SIZES.map(s => (
                  <button key={s} type="button" onClick={() => setF({...f,totalU:s})}
                    className={`py-2.5 rounded-lg text-sm font-mono font-bold border transition-all ${f.totalU === s ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    {s}U
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="field resize-none" rows={2} placeholder="Brief purpose of this rack…" value={f.description} onChange={e=>setF({...f,description:e.target.value})} />
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="field" placeholder="production, web-tier, dc1" value={f.tags} onChange={e=>setF({...f,tags:e.target.value})} />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/dashboard" className="btn-ghost flex-1 text-center">Cancel</Link>
              <button type="submit" disabled={mut.isPending} className="btn-blue flex-1">
                {mut.isPending ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating…</span> : 'Create Rack'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="hidden lg:block">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Live Preview</p>
          <p className="text-center text-sm text-gray-400 mb-3 font-medium">{f.name || 'Unnamed Rack'} <span className="text-gray-700 font-mono ml-1">{f.totalU}U</span></p>
          <div className="rack-chassis mx-auto" style={{ maxWidth: 280 }}>
            <div className="rack-rail rack-rail-left" />
            <div className="rack-rail rack-rail-right" />
            <div className="py-2 px-9">
              {preview.map(u => (
                <div key={u} className="u-slot" style={{ height: 28 }}>
                  <span className="u-slot-num">{u}</span>
                </div>
              ))}
              {f.totalU > 22 && <div className="text-center text-[10px] text-gray-700 font-mono py-2">+{f.totalU - 22} more…</div>}
            </div>
          </div>
          <p className="text-center text-xs text-gray-700 mt-3 font-mono">{f.totalU} unit slots</p>
        </div>
      </div>
    </div>
  );
}
