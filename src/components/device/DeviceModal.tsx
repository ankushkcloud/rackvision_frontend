'use client';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { deviceApi } from '@/lib/api';
import { Device, Rack, DEVICE_META, DeviceType } from '@/types';
import { deviceColor, deviceBorder } from '@/lib/utils';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface Props {
  rack: Rack;
  device?: Device;
  occupiedSlots: { start: number; end: number; id: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

const DEVICE_TYPES = Object.keys(DEVICE_META) as DeviceType[];

export default function DeviceModal({ rack, device, occupiedSlots, onClose, onSuccess }: Props) {
  const isEdit = !!device;
  const [f, setF] = useState({
    name:         device?.name         || '',
    deviceType:   device?.deviceType   || 'server' as DeviceType,
    ipAddress:    device?.ipAddress    || '',
    serialNumber: device?.serialNumber || '',
    manufacturer: device?.manufacturer || '',
    model:        device?.model        || '',
    uStart:       device?.uStart       || 1,
    uSize:        device?.uSize        || 1,
    portCount:    device?.portCount    || 24,
    notes:        device?.notes        || '',
  });
  const [slotErr, setSlotErr] = useState('');

  // Validate slots on change
  useEffect(() => {
    const start = Number(f.uStart), size = Number(f.uSize);
    const end   = start + size - 1;
    if (start < 1 || end > rack.totalU) { setSlotErr(`Must be within U1–U${rack.totalU}`); return; }
    if (start > end)                    { setSlotErr('Start must be ≤ end'); return; }
    const conflict = occupiedSlots.find(s => start <= s.end && end >= s.start);
    if (conflict) { setSlotErr(`Conflicts with device at U${conflict.start}–${conflict.end}`); return; }
    setSlotErr('');
  }, [f.uStart, f.uSize, occupiedSlots, rack.totalU]);

  const mut = useMutation({
    mutationFn: () => {
      const payload = { ...f, rackId: rack._id, uStart: Number(f.uStart), uSize: Number(f.uSize), portCount: Number(f.portCount) };
      return isEdit ? deviceApi.update(device!._id, payload) : deviceApi.create(payload);
    },
    onSuccess: () => { toast.success(isEdit ? 'Device updated!' : 'Device added!'); onSuccess(); },
    onError:   (e: AxiosError<{error:string}>) => toast.error(e.response?.data?.error || 'Failed'),
  });

  // Auto-find free slot
  const autoSlot = (size = Number(f.uSize)) => {
    for (let u = 1; u <= rack.totalU - size + 1; u++) {
      const end = u + size - 1;
      if (!occupiedSlots.find(s => u <= s.end && end >= s.start)) {
        setF(p => ({ ...p, uStart: u, uSize: size }));
        return;
      }
    }
    toast.error('No free slot found for this size');
  };

  const isPortDevice = ['switch','patch_panel'].includes(f.deviceType);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (slotErr) { toast.error(slotErr); return; }
    if (!f.name.trim()) { toast.error('Name required'); return; }
    mut.mutate();
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0f1117] border border-gray-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f1117] flex items-center justify-between px-6 py-4 border-b border-gray-800 rounded-t-2xl">
          <h2 className="font-bold text-white">{isEdit ? 'Edit Device' : 'Add Device'}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Device type selector */}
          <div>
            <label className="label">Device Type *</label>
            <div className="grid grid-cols-4 gap-1.5">
              {DEVICE_TYPES.map(type => {
                const m = DEVICE_META[type];
                const active = f.deviceType === type;
                return (
                  <button key={type} type="button" onClick={() => setF({...f, deviceType: type})}
                    className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border text-xs transition-all"
                    style={active ? { color: m.color, background: m.bg, borderColor: m.border } : { borderColor: '#374151', color: '#6b7280' }}>
                    <span className="text-base">{m.icon}</span>
                    <span className="font-medium text-center leading-none">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name + serial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Device Name *</label>
              <input className="field" placeholder="WEB-SRV-01" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required />
            </div>
            <div>
              <label className="label">Serial Number</label>
              <input className="field" placeholder="SRV-001234" value={f.serialNumber} onChange={e=>setF({...f,serialNumber:e.target.value})} />
            </div>
          </div>

          {/* IP */}
          <div>
            <label className="label">IP Address</label>
            <input className="field" placeholder="192.168.1.100" value={f.ipAddress} onChange={e=>setF({...f,ipAddress:e.target.value})} />
          </div>

          {/* Manufacturer + model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Manufacturer</label>
              <input className="field" placeholder="Dell, Cisco…" value={f.manufacturer} onChange={e=>setF({...f,manufacturer:e.target.value})} />
            </div>
            <div>
              <label className="label">Model</label>
              <input className="field" placeholder="PowerEdge R740" value={f.model} onChange={e=>setF({...f,model:e.target.value})} />
            </div>
          </div>

          {/* U Position */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">U Position *</label>
              <div className="flex gap-1">
                {[1,2,3,4].map(s => (
                  <button key={s} type="button" onClick={() => autoSlot(s)}
                    className="text-[10px] font-mono text-blue-400 hover:text-blue-300 bg-blue-900/20 border border-blue-800/40 rounded px-1.5 py-0.5 transition-all hover:bg-blue-900/40">
                    Auto {s}U
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-700 mb-1 block">Start (U)</label>
                <input type="number" min={1} max={rack.totalU} className="field"
                  value={f.uStart} onChange={e=>setF({...f,uStart:Number(e.target.value),uSize:Math.max(1,Number(f.uSize))})} />
              </div>
              <div>
                <label className="text-[10px] text-gray-700 mb-1 block">Size (U)</label>
                <input type="number" min={1} max={rack.totalU} className="field"
                  value={f.uSize} onChange={e=>setF({...f,uSize:Number(e.target.value)})} />
              </div>
            </div>

            {/* Visual slot map */}
            <div className="mt-2">
              <div className="flex gap-0.5 overflow-x-auto pb-1">
                {Array.from({ length: rack.totalU }, (_, i) => i + 1).map(u => {
                  const end  = Number(f.uStart) + Number(f.uSize) - 1;
                  const isSel = u >= Number(f.uStart) && u <= end;
                  const isOcc = occupiedSlots.find(s => u >= s.start && u <= s.end);
                  return (
                    <div key={u} title={`U${u}${isOcc ? ' (occupied)':''}`}
                      className="h-4 rounded-sm cursor-pointer flex-shrink-0 transition-colors"
                      style={{
                        width: Math.max(5, Math.floor(340 / rack.totalU)),
                        background: isOcc ? '#7f1d1d' : isSel ? deviceBorder(f.deviceType) : '#1f2937',
                      }}
                      onClick={() => { if (!isOcc) setF(p=>({...p,uStart:u,uSize:1})); }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-gray-700 font-mono mt-0.5">
                <span>U1</span><span>U{rack.totalU}</span>
              </div>
            </div>

            {slotErr && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">⚠ {slotErr}</p>}
            {!slotErr && f.uStart && <p className="text-[10px] text-gray-600 mt-1 font-mono">Position: U{f.uStart}–U{Number(f.uStart)+Number(f.uSize)-1}</p>}
          </div>

          {/* Port count for switches */}
          {isPortDevice && (
            <div>
              <label className="label">Number of Ports</label>
              <div className="flex gap-2 flex-wrap">
                {[8,12,16,24,48,96].map(n => (
                  <button key={n} type="button" onClick={() => setF({...f,portCount:n})}
                    className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${f.portCount===n ? 'bg-green-700 border-green-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                    {n}p
                  </button>
                ))}
                <input type="number" min={1} max={96} className="field w-24 text-xs py-1.5"
                  placeholder="Custom" value={f.portCount} onChange={e=>setF({...f,portCount:Number(e.target.value)})} />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea className="field resize-none" rows={2} placeholder="Optional notes…"
              value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={mut.isPending || !!slotErr} className="btn-blue flex-1">
              {mut.isPending ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{isEdit?'Updating…':'Adding…'}</span> : (isEdit ? 'Update Device' : 'Add Device')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
