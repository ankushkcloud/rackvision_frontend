'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Device, Port, PortStatus, PORT_STATUS_COLORS, PORT_DEVICE_META, PortDeviceType } from '@/types';
import { portApi } from '@/lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Props { device: Device; }

export default function PortManager({ device }: Props) {
  const qc  = useQueryClient();
  const [editPort, setEditPort] = useState<Port | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ports', device._id],
    queryFn:  () => portApi.getAll(device._id).then(r => r.data),
    initialData: { ports: device.ports, portCount: device.portCount },
  });

  const updateMut = useMutation({
    mutationFn: ({ portNumber, payload }: { portNumber: number; payload: Partial<Port> }) =>
      portApi.updateOne(device._id, portNumber, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ports', device._id] }); toast.success('Port saved'); setEditPort(null); },
    onError:   () => toast.error('Save failed'),
  });

  const ports: Port[] = data?.ports || [];
  const portMap = new Map<number, Port>(ports.map(p => [p.portNumber, p]));

  // Stats
  const active   = ports.filter(p => p.status === 'active').length;
  const inactive = ports.filter(p => p.status === 'inactive').length;
  const errors   = ports.filter(p => p.status === 'error').length;
  const cols     = device.portCount <= 12 ? device.portCount : device.portCount <= 24 ? 12 : 16;

  const openPort = useCallback((portNum: number) => {
    const p = portMap.get(portNum) ?? { portNumber: portNum, label:`Port${portNum}`, ipAddress:'', deviceType:'' as PortDeviceType, connectedDevice:'', vlanId:null, status:'inactive' as PortStatus, notes:'', speed:'' };
    setEditPort(p);
  }, [portMap]);

  if (isLoading) return <div className="flex items-center gap-2 py-6"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/><span className="text-xs text-gray-500">Loading ports…</span></div>;

  return (
    <div>
      {/* Stats bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <Pill color="#10b981" label={`${active} active`} />
        <Pill color="#6b7280" label={`${inactive} inactive`} />
        {errors > 0 && <Pill color="#ef4444" label={`${errors} error`} pulse />}
        <span className="text-[10px] text-gray-700 self-center ml-auto">{device.portCount} total ports</span>
      </div>

      {/* Port grid */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns:`repeat(${cols}, 1fr)` }}>
        {Array.from({ length: device.portCount }, (_, i) => i + 1).map(num => {
          const p   = portMap.get(num);
          const st  = p?.status || 'inactive';
          const sc  = PORT_STATUS_COLORS[st];
          const pdm = PORT_DEVICE_META[p?.deviceType || ''];
          return (
            <button key={num} type="button"
              className={clsx('port-cell', st)}
              style={{ background: sc.bg, borderColor: sc.border }}
              onClick={() => openPort(num)}
              title={p?.connectedDevice ? `Port ${num}: ${p.connectedDevice} (${p.ipAddress || 'no IP'})` : `Port ${num}: Free`}>

              {/* Port number */}
              <span className="text-[8px] font-mono text-gray-600 leading-none">{num}</span>

              {/* Status dot */}
              <div className="w-2 h-2 rounded-full" style={{ background: sc.dot, boxShadow: st==='active' ? `0 0 4px ${sc.dot}` : 'none' }}/>

              {/* Device type icon (if assigned) */}
              {p?.deviceType && <span className="text-[8px] leading-none">{pdm?.icon}</span>}

              {/* VLAN */}
              {p?.vlanId && <span className="text-[7px] font-mono text-purple-400 leading-none">v{p.vlanId}</span>}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex gap-3 flex-wrap">
        {Object.entries(PORT_STATUS_COLORS).map(([st, sc]) => (
          <div key={st} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: sc.dot }}/>
            <span className="text-[9px] text-gray-600">{sc.label}</span>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editPort && (
        <PortEditModal
          port={editPort}
          onClose={() => setEditPort(null)}
          onSave={payload => updateMut.mutate({ portNumber: editPort.portNumber, payload })}
          saving={updateMut.isPending}
        />
      )}
    </div>
  );
}

function Pill({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={clsx('w-2 h-2 rounded-full', pulse && 'animate-pulse')} style={{ background: color }}/>
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}

/* ─── Port Edit Modal ─────────────────────────────────────────────────────── */
function PortEditModal({ port, onClose, onSave, saving }: {
  port: Port; onClose: () => void;
  onSave: (p: Partial<Port>) => void; saving: boolean;
}) {
  const [f, setF] = useState<Partial<Port>>({ ...port });
  const sc = PORT_STATUS_COLORS[f.status || 'inactive'];

  return (
    <div className="modal-bg" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="bg-[#0f1117] border border-gray-800 rounded-2xl w-full max-w-sm animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: sc.bg, border:`1px solid ${sc.border}` }}>
              {port.portNumber}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{f.label || `Port ${port.portNumber}`}</p>
              <p className="text-[10px] text-gray-600">Port {port.portNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Status */}
          <div>
            <label className="label">Status</label>
            <div className="flex gap-2">
              {(['active','inactive','error'] as PortStatus[]).map(st => {
                const c = PORT_STATUS_COLORS[st];
                return (
                  <button key={st} type="button" onClick={() => setF({...f,status:st})}
                    className="flex-1 py-2 rounded-lg border text-xs font-medium transition-all capitalize"
                    style={f.status===st ? { background:c.bg, borderColor:c.border, color:c.dot } : { borderColor:'#374151', color:'#6b7280' }}>
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background:c.dot }}/>
                      {c.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Device type */}
          <div>
            <label className="label">Connected Device Type</label>
            <div className="grid grid-cols-4 gap-1">
              {(Object.entries(PORT_DEVICE_META) as [PortDeviceType, { label:string; icon:string; color:string }][])
                .filter(([k]) => k !== '')
                .map(([type, m]) => (
                <button key={type} type="button" onClick={() => setF({...f,deviceType:type})}
                  className="flex flex-col items-center gap-0.5 py-2 rounded border text-[9px] transition-all"
                  style={f.deviceType===type ? { background:`${m.color}22`, borderColor:m.color, color:m.color } : { borderColor:'#374151', color:'#6b7280' }}>
                  <span className="text-sm">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">IP Address</label>
              <input className="field text-xs" placeholder="192.168.x.x" value={f.ipAddress||''} onChange={e=>setF({...f,ipAddress:e.target.value})} />
            </div>
            <div>
              <label className="label">VLAN ID</label>
              <input type="number" min={1} max={4094} className="field text-xs" placeholder="1–4094"
                value={f.vlanId??''} onChange={e=>setF({...f,vlanId:e.target.value?Number(e.target.value):null})} />
            </div>
          </div>

          <div>
            <label className="label">Connected Device Name</label>
            <input className="field text-xs" placeholder="e.g. CAM-LOBBY-01" value={f.connectedDevice||''} onChange={e=>setF({...f,connectedDevice:e.target.value})} />
          </div>

          <div>
            <label className="label">Port Label</label>
            <input className="field text-xs" placeholder="Custom label" value={f.label||''} onChange={e=>setF({...f,label:e.target.value})} />
          </div>

          <div>
            <label className="label">Speed</label>
            <select className="field text-xs" value={f.speed||''} onChange={e=>setF({...f,speed:e.target.value as Port['speed']})}>
              {['','10M','100M','1G','10G','25G','40G','100G'].map(s=><option key={s} value={s}>{s||'Not set'}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Notes</label>
            <input className="field text-xs" placeholder="Optional note…" value={f.notes||''} onChange={e=>setF({...f,notes:e.target.value})} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-xs py-2">Cancel</button>
            <button type="button" onClick={() => onSave(f)} disabled={saving} className="btn-blue flex-1 text-xs py-2">
              {saving ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</span> : 'Save Port'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
