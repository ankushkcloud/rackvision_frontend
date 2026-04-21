'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rackApi } from '@/lib/api';
import { RACK_SIZES } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export default function EditRackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc     = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['rack', id],
    queryFn:  () => rackApi.get(id).then(r => r.data),
  });

  const [f, setF] = useState({ name:'', location:'', description:'', tags:'' });

  useEffect(() => {
    if (data?.rack) {
      const r = data.rack;
      setF({ name: r.name||'', location: r.location||'', description: r.description||'', tags: (r.tags||[]).join(', ') });
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: () => rackApi.update(id, { ...f, tags: f.tags.split(',').map((t:string)=>t.trim()).filter(Boolean) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rack', id] });
      qc.invalidateQueries({ queryKey: ['racks'] });
      toast.success('Rack updated!');
      router.push(`/dashboard/rack/${id}`);
    },
    onError: (e: AxiosError<{error:string}>) => toast.error(e.response?.data?.error || 'Update failed'),
  });

  if (isLoading) return <div className="p-8 flex items-center gap-3"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/><span className="text-gray-500">Loading…</span></div>;

  return (
    <div className="p-7 max-w-xl">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
        <span>/</span>
        <Link href={`/dashboard/rack/${id}`} className="hover:text-gray-300">{data?.rack?.name}</Link>
        <span>/</span>
        <span className="text-gray-300">Edit</span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Edit Rack</h1>

      <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
        <div>
          <label className="label">Rack Name *</label>
          <input className="field" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required />
        </div>
        <div>
          <label className="label">Location</label>
          <input className="field" placeholder="Data center location…" value={f.location} onChange={e=>setF({...f,location:e.target.value})} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="field resize-none" rows={3} value={f.description} onChange={e=>setF({...f,description:e.target.value})} />
        </div>
        <div>
          <label className="label">Tags (comma-separated)</label>
          <input className="field" placeholder="production, dc1, web-tier" value={f.tags} onChange={e=>setF({...f,tags:e.target.value})} />
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start gap-2.5">
            <span className="text-amber-400 text-sm mt-0.5">ℹ</span>
            <div>
              <p className="text-xs text-gray-400 font-medium">Rack Size: <span className="font-mono text-gray-200">{data?.rack?.totalU}U</span></p>
              <p className="text-[11px] text-gray-600 mt-0.5">Rack size cannot be changed after creation to prevent data loss. Create a new rack to change size.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href={`/dashboard/rack/${id}`} className="btn-ghost flex-1 text-center">Cancel</Link>
          <button type="submit" disabled={mut.isPending} className="btn-blue flex-1">
            {mut.isPending ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</span> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
