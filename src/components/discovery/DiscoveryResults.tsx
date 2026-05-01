'use client';
// ============================================================
// FILE: frontend/src/components/discovery/DiscoveryResults.tsx
// ACTION: NEW FILE
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryApi, rackApi } from '@/lib/api';
import { DiscoveredDevice, DiscoverySession, DISC_TYPE_META, Rack } from '@/types';
import toast from 'react-hot-toast';

interface ImportForm { rackId: string; uStart: number; uSize: number; name: string; devType: string; }

interface Props { sessionId: string; onClose: () => void; }

export default function DiscoveryResults({ sessionId, onClose }: Props) {
  const qc = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<'all'|'online'|'offline'|'imported'>('online');
  const [filterType,   setFilterType]   = useState('');
  const [search,       setSearch]       = useState('');
  const [openIdx,      setOpenIdx]      = useState<number | null>(null);
  const [forms,        setForms]        = useState<Record<number, ImportForm>>({});
  const [selected,     setSelected]     = useState<Set<number>>(new Set());
  const [bulkRack,     setBulkRack]     = useState('');
  const [bulkU,        setBulkU]        = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['disc-session', sessionId],
    queryFn:  () => discoveryApi.getSession(sessionId).then(r => r.data),
    staleTime: 10_000,
  });

  const { data: racksData } = useQuery({
    queryKey: ['racks'],
    queryFn:  () => rackApi.list().then(r => r.data),
  });
  const racks: Rack[] = racksData?.racks || [];

  const importMut = useMutation({
    mutationFn: ({ idx, form }: { idx: number; form: ImportForm }) =>
      discoveryApi.importOne(sessionId, {
        deviceIndex: idx, rackId: form.rackId,
        uStart: form.uStart, uSize: form.uSize,
        overrides: { name: form.name, deviceType: form.devType },
      }),
    onSuccess: r => {
      toast.success(`✅ ${r.data.device.name} imported!`);
      setOpenIdx(null);
      qc.invalidateQueries({ queryKey: ['disc-session', sessionId] });
      qc.invalidateQueries({ queryKey: ['rack-devices'] });
      qc.invalidateQueries({ queryKey: ['racks'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Import failed'),
  });

  const bulkMut = useMutation({
    mutationFn: () => discoveryApi.importBulk(sessionId,
      Array.from(selected).map((idx, i) => ({ deviceIndex: idx, rackId: bulkRack, uStart: bulkU + i, uSize: 1 }))
    ),
    onSuccess: r => {
      const { imported, failed } = r.data;
      toast.success(`${imported.length} imported${failed.length ? `, ${failed.length} failed` : ''}`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['disc-session', sessionId] });
      qc.invalidateQueries({ queryKey: ['racks'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Bulk import failed'),
  });

  const session: DiscoverySession | undefined = data?.session;
  const all: DiscoveredDevice[]               = session?.devices || [];

  // Apply filters
  const visible = all.filter(d => {
    if (filterStatus === 'online'   && d.status !== 'online')   return false;
    if (filterStatus === 'offline'  && d.status !== 'offline')  return false;
    if (filterStatus === 'imported' && !d.imported)             return false;
    if (filterType && d.deviceType !== filterType)              return false;
    if (search) {
      const q = search.toLowerCase();
      return d.ip.includes(q) || d.hostname.toLowerCase().includes(q)
        || d.vendor.toLowerCase().includes(q) || d.mac.toLowerCase().includes(q);
    }
    return true;
  });

  const openImport = (realIdx: number, d: DiscoveredDevice) => {
    const meta = DISC_TYPE_META[d.deviceType];
    setForms(p => ({ ...p, [realIdx]: {
      rackId:  racks[0]?._id || '',
      uStart:  1, uSize: 1,
      name:    d.suggestedName || `DEV-${d.ip.split('.').pop()}`,
      devType: meta?.rackType || 'server',
    }}));
    setOpenIdx(realIdx);
  };

  const updateForm = (idx: number, patch: Partial<ImportForm>) =>
    setForms(p => ({ ...p, [idx]: { ...p[idx], ...patch } }));

  const toggleSel = (idx: number) => {
    const s = new Set(selected);
    s.has(idx) ? s.delete(idx) : s.add(idx);
    setSelected(s);
  };

  if (isLoading) return (
    <div className="flex items-center gap-3 p-10">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
      <span className="text-gray-500">Loading results…</span>
    </div>
  );
  if (!session) return <div className="p-10 text-gray-500">Session not found</div>;

  const onlineCount   = all.filter(d => d.status === 'online').length;
  const importedCount = all.filter(d => d.imported).length;

  const INPUT = "bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const BTN_BLUE = "bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 flex items-center gap-1.5";
  const BTN_GHOST = "bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-700 transition-all";

  return (
    <div className="flex flex-col h-full bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>📡</div>
          <div>
            <h2 className="font-bold text-white text-sm">Discovered Devices</h2>
            <p className="text-[10px] text-gray-500">
              <span className="font-mono text-gray-400">{session.networkRange}</span>
              {' · '}<span className="text-green-400">{onlineCount} online</span>
              {' · '}{session.totalFound} total
              {importedCount > 0 && <><span className="text-gray-600"> · </span><span className="text-blue-400">{importedCount} imported</span></>}
              {session.durationMs && <span className="text-gray-700"> · {(session.durationMs/1000).toFixed(1)}s</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="text-xs text-gray-600 hover:text-gray-300">↻</button>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 px-6 py-3 border-b border-gray-800/60 shrink-0 flex-wrap items-center">
        {/* Status tabs */}
        <div className="flex gap-1">
          {(['all','online','offline','imported'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize border transition-all ${
                filterStatus === s
                  ? 'bg-blue-900/30 border-blue-700/50 text-blue-400'
                  : 'border-gray-800 text-gray-600 hover:text-gray-300'
              }`}>
              {s}{s === 'online' && <span className="ml-1 text-green-500">{onlineCount}</span>}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select className={`${INPUT} w-36`} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {Object.entries(DISC_TYPE_META).map(([t, m]) => (
            <option key={t} value={t}>{m.icon} {m.label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input className={`${INPUT} w-full pl-8`} placeholder="IP, hostname, vendor, MAC…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <span className="text-[10px] text-gray-700">{visible.length} shown</span>
      </div>

      {/* Bulk import bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-6 py-2.5 border-b border-blue-800/30 shrink-0 flex-wrap"
          style={{ background: 'rgba(30,64,175,0.08)' }}>
          <span className="text-xs font-semibold text-blue-400">{selected.size} selected</span>
          <select className={`${INPUT} w-44`} value={bulkRack} onChange={e => setBulkRack(e.target.value)}>
            <option value="">Select rack…</option>
            {racks.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            Start U: <input type="number" min={1} max={48} className={`${INPUT} w-14`}
              value={bulkU} onChange={e => setBulkU(Number(e.target.value))} />
          </div>
          <button disabled={!bulkRack || bulkMut.isPending} onClick={() => bulkMut.mutate()}
            className={BTN_BLUE}>
            {bulkMut.isPending ? '…' : `⬆ Import ${selected.size}`}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-600 hover:text-gray-300 ml-auto">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-3xl mb-2">📡</p>
            <p>No devices match filters</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[#0f1117]">
              <tr className="border-b border-gray-800">
                <th className="px-4 py-2.5 w-8">
                  <input type="checkbox" className="accent-blue-500"
                    onChange={e => {
                      if (e.target.checked) {
                        const eligible = visible.filter(d => !d.imported && d.status === 'online').map(d => all.indexOf(d));
                        setSelected(new Set(eligible));
                      } else setSelected(new Set());
                    }}/>
                </th>
                {['IP Address','Hostname','MAC / Vendor','Type','Status','Latency','Ports','Action'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-gray-600 font-semibold uppercase tracking-wider text-[9px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(device => {
                const realIdx  = all.indexOf(device);
                const meta     = DISC_TYPE_META[device.deviceType];
                const form     = forms[realIdx];
                const isOpen   = openIdx === realIdx;
                const isSel    = selected.has(realIdx);

                return (
                  <>
                    <tr key={device.ip}
                      className={`border-b border-gray-800/40 transition-colors ${
                        device.imported ? 'opacity-50' :
                        isSel ? 'bg-blue-950/10' : 'hover:bg-gray-900/30'
                      }`}>
                      <td className="px-4 py-2.5">
                        {!device.imported && device.status === 'online' && (
                          <input type="checkbox" className="accent-blue-500"
                            checked={isSel} onChange={() => toggleSel(realIdx)} />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono font-bold text-white">{device.ip}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-400 max-w-[120px] truncate">
                        {device.hostname || <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-mono text-[10px] text-gray-400">{device.mac || <span className="text-gray-700">No MAC</span>}</p>
                        <p className="text-[10px] text-gray-600">{device.vendor}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: meta?.color }}>
                          {meta?.icon} {meta?.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`flex items-center gap-1 text-[10px] font-semibold ${
                          device.status === 'online' ? 'text-green-400' : 'text-gray-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            device.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
                          }`}/>
                          {device.status}
                        </span>
                        {device.imported && <span className="text-[9px] text-blue-400 block mt-0.5">✓ Imported</span>}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-gray-500">
                        {device.latencyMs !== null ? `${device.latencyMs}ms` : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        {device.openPorts.length > 0 ? (
                          <div className="flex gap-0.5 flex-wrap max-w-[80px]">
                            {device.openPorts.slice(0, 4).map(p => (
                              <span key={p} className="text-[8px] font-mono bg-gray-800 text-gray-500 rounded px-1 py-0.5">{p}</span>
                            ))}
                            {device.openPorts.length > 4 && <span className="text-[8px] text-gray-700">+{device.openPorts.length - 4}</span>}
                          </div>
                        ) : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {device.imported ? (
                          <span className="text-[10px] text-green-500">✅ Done</span>
                        ) : device.status === 'offline' ? (
                          <span className="text-[10px] text-gray-700">Offline</span>
                        ) : (
                          <button onClick={() => openImport(realIdx, device)}
                            className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                            style={{ background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)', color:'#60a5fa' }}>
                            ⬆ Import
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Inline import form */}
                    {isOpen && form && (
                      <tr key={`form-${device.ip}`}>
                        <td colSpan={9} style={{ background: 'rgba(30,58,138,0.1)', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>
                          <div className="px-6 py-4 flex flex-wrap gap-3 items-end">
                            <p className="text-xs font-semibold text-blue-400 self-center">
                              ⬆ Import <span className="font-mono text-white">{device.ip}</span>
                            </p>

                            <div className="flex-1 min-w-[130px]">
                              <label className="text-[9px] text-gray-600 uppercase tracking-wider block mb-1">Name</label>
                              <input className={INPUT} value={form.name}
                                onChange={e => updateForm(realIdx, { name: e.target.value })} />
                            </div>

                            <div className="min-w-[150px]">
                              <label className="text-[9px] text-gray-600 uppercase tracking-wider block mb-1">Rack</label>
                              <select className={INPUT} value={form.rackId}
                                onChange={e => updateForm(realIdx, { rackId: e.target.value })}>
                                <option value="">Select rack…</option>
                                {racks.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                              </select>
                            </div>

                            <div className="w-18">
                              <label className="text-[9px] text-gray-600 uppercase tracking-wider block mb-1">U Start</label>
                              <input type="number" min={1} max={48} className={`${INPUT} w-16`}
                                value={form.uStart} onChange={e => updateForm(realIdx, { uStart: Number(e.target.value) })} />
                            </div>

                            <div className="w-14">
                              <label className="text-[9px] text-gray-600 uppercase tracking-wider block mb-1">Size U</label>
                              <input type="number" min={1} max={10} className={`${INPUT} w-14`}
                                value={form.uSize} onChange={e => updateForm(realIdx, { uSize: Number(e.target.value) })} />
                            </div>

                            <div className="min-w-[120px]">
                              <label className="text-[9px] text-gray-600 uppercase tracking-wider block mb-1">Type</label>
                              <select className={INPUT} value={form.devType}
                                onChange={e => updateForm(realIdx, { devType: e.target.value })}>
                                {['server','switch','router','firewall','storage','ups','patch_panel','kvm'].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex gap-2 self-end">
                              <button onClick={() => setOpenIdx(null)} className={BTN_GHOST}>Cancel</button>
                              <button
                                disabled={!form.rackId || importMut.isPending}
                                onClick={() => importMut.mutate({ idx: realIdx, form })}
                                className={BTN_BLUE}>
                                {importMut.isPending
                                  ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</>
                                  : '✅ Confirm'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-gray-800 shrink-0 text-[10px] text-gray-600">
        <span className="font-mono">{session.usedFallback ? '📡 Ping sweep' : '🔍 nmap scan'}</span>
        <span>{session.totalFound} found</span>
        <span className="text-green-500">{onlineCount} online</span>
        {importedCount > 0 && <span className="text-blue-400">{importedCount} imported</span>}
        {session.durationMs && <span className="ml-auto">{(session.durationMs/1000).toFixed(1)}s scan time</span>}
      </div>
    </div>
  );
}
