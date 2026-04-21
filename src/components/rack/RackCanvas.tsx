'use client';
import { useState, useCallback } from 'react';
import { Device, Rack, DEVICE_META } from '@/types';
import { deviceBg, deviceBorder, deviceColor, shortType } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { deviceApi } from '@/lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type DeviceCountMap = Partial<Record<Device['deviceType'], number>>;

const U_H = 30; // px per U

interface Props {
  rack: Rack;
  devices: Device[];        // filtered (for display)
  allDevices: Device[];     // all (for overlap)
  selectedDevice: Device | null;
  onDeviceClick: (d: Device) => void;
  onAddDevice: () => void;
  onDeviceMoved: () => void;
}

export default function RackCanvas({ rack, devices, allDevices, selectedDevice, onDeviceClick, onAddDevice, onDeviceMoved }: Props) {
  const [dragDevice, setDragDevice] = useState<Device | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  // Build occupied map from allDevices
  const occupiedMap = new Map<number, Device>();
  allDevices.forEach(d => {
    for (let u = d.uStart; u < d.uStart + d.uSize; u++) occupiedMap.set(u, d);
  });

  // Track which device IDs have already been rendered (prevent duplicate renders)
  const rendered = new Set<string>();

  const moveMut = useMutation({
    mutationFn: ({ id, uStart }: { id: string; uStart: number }) =>
      deviceApi.update(id, { uStart }),
    onSuccess: () => { onDeviceMoved(); toast.success('Device moved'); },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Move failed'),
  });

  const canDrop = useCallback((targetU: number) => {
    if (!dragDevice) return false;
    const end = targetU + dragDevice.uSize - 1;
    if (targetU < 1 || end > rack.totalU) return false;
    for (let u = targetU; u <= end; u++) {
      const occ = occupiedMap.get(u);
      if (occ && occ._id !== dragDevice._id) return false;
    }
    return true;
  }, [dragDevice, occupiedMap, rack.totalU]);

  const handleDrop = (targetU: number) => {
    if (!dragDevice || !canDrop(targetU)) {
      toast.error('Cannot place device here');
    } else if (targetU !== dragDevice.uStart) {
      moveMut.mutate({ id: dragDevice._id, uStart: targetU });
    }
    setDragDevice(null);
    setDragOverSlot(null);
  };

  const slots = Array.from({ length: rack.totalU }, (_, i) => i + 1);

  return (
    <div className="flex gap-6 items-start flex-wrap lg:flex-nowrap">
      {/* ── Rack chassis ── */}
      <div className="flex-shrink-0">
        <div className="rack-chassis select-none" style={{ width: 420 }}>
          {/* Rails */}
          <div className="rack-rail rack-rail-left" />
          <div className="rack-rail rack-rail-right" />

          {/* Top cap */}
          <div className="h-7 bg-gradient-to-b from-gray-700 to-gray-800 border-b border-gray-600 rounded-t-sm mx-9 flex items-center justify-between px-3">
            <div className="flex gap-1.5">{[...Array(3)].map((_,i)=><div key={i} className="w-5 h-2 bg-gray-600 rounded-sm"/>)}</div>
            <div className="flex gap-1">{[...Array(4)].map((_,i)=><div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-500"/>)}</div>
          </div>

          {/* U Slots */}
          <div className="py-1 px-9 relative">
            {slots.map(u => {
              const device   = occupiedMap.get(u);
              const isStart  = device?.uStart === u;
              const shouldRender = device && isStart && !rendered.has(device._id);
              if (shouldRender) rendered.add(device._id);

              const devH     = device ? device.uSize * U_H : U_H;
              const isGhost  = dragDevice?._id === device?._id;
              const isDragOver = dragOverSlot !== null && u >= dragOverSlot && dragDevice && u < dragOverSlot + dragDevice.uSize;
              const isFiltered = device && !devices.find(d => d._id === device._id);
              const isSelected = selectedDevice?._id === device?._id;

              return (
                <div key={u} className={clsx('u-slot', isDragOver && canDrop(dragOverSlot!) && 'drag-over')}
                  style={{ height: U_H, position: 'relative' }}
                  onDragOver={e => { e.preventDefault(); setDragOverSlot(u); }}
                  onDragLeave={() => setDragOverSlot(null)}
                  onDrop={() => handleDrop(dragOverSlot ?? u)}
                >
                  {/* Slot number */}
                  <span className="u-slot-num">{u}</span>

                  {/* Empty slot hint */}
                  {!device && !dragDevice && (
                    <div className="absolute left-0 right-0 inset-y-0 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity"
                      onClick={onAddDevice}>
                      <div className="w-full h-full border border-dashed border-blue-900/50 flex items-center justify-center hover:bg-blue-500/5">
                        <span className="text-[9px] text-blue-800 hover:text-blue-600 font-mono transition-colors">+ add device</span>
                      </div>
                    </div>
                  )}

                  {/* Device block */}
                  {shouldRender && device && (
                    <div
                      className={clsx('device-block', isSelected && 'selected', isGhost && 'drag-ghost', isFiltered && 'opacity-20')}
                      draggable
                      style={{
                        top: 0, height: devH,
                        background: `linear-gradient(135deg, ${deviceBg(device.deviceType)} 0%, ${deviceBg(device.deviceType)} 100%)`,
                        border: `1px solid ${deviceBorder(device.deviceType)}`,
                      }}
                      onClick={() => onDeviceClick(device)}
                      onDragStart={() => setDragDevice(device)}
                      onDragEnd={() => { setDragDevice(null); setDragOverSlot(null); }}
                      title={`${device.name} — U${device.uStart}–${device.uStart+device.uSize-1}`}
                    >
                      <div className="h-full flex items-center px-2.5 gap-2 overflow-hidden">
                        {/* LEDs */}
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <div className="led" style={{ width:5, height:5, background:'#10b981', color:'#10b981' }}/>
                          <div className="led" style={{ width:5, height:5, background:'#f59e0b', color:'#f59e0b' }}/>
                        </div>

                        {/* Type badge */}
                        <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded flex-shrink-0"
                          style={{ color: deviceColor(device.deviceType), background:`${deviceBorder(device.deviceType)}25`, border:`1px solid ${deviceBorder(device.deviceType)}44` }}>
                          {shortType[device.deviceType]}
                        </span>

                        {/* Name + IP */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-[11px] font-semibold truncate leading-tight">{device.name}</p>
                          {device.ipAddress && <p className="text-gray-400 text-[9px] font-mono truncate">{device.ipAddress}</p>}
                        </div>

                        {/* Right info */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-[9px] font-mono text-gray-500">{device.uSize}U</p>
                          {device.portCount > 0 && <p className="text-[9px] font-mono text-gray-600">{device.portCount}p</p>}
                        </div>

                        {/* Icon */}
                        <span className="text-sm flex-shrink-0">{DEVICE_META[device.deviceType]?.icon}</span>

                        {/* Drag handle */}
                        <div className="w-3 flex-shrink-0 flex flex-col gap-0.5 opacity-30 hover:opacity-70 cursor-grab active:cursor-grabbing">
                          {[...Array(3)].map((_,i) => <div key={i} className="h-px bg-gray-400 w-full"/>)}
                        </div>
                      </div>

                      {/* Port strip for switches */}
                      {device.deviceType === 'switch' && device.portCount >= 8 && devH >= 40 && (
                        <div className="absolute bottom-0.5 left-12 right-10 flex gap-px overflow-hidden h-1.5">
                          {Array.from({ length: Math.min(device.portCount, 24) }).map((_, i) => {
                            const p = device.ports?.[i];
                            const c = p?.status === 'active' ? '#10b981' : p?.status === 'error' ? '#ef4444' : '#374151';
                            return <div key={i} className="flex-1 rounded-sm" style={{ background: c }}/>;
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom cap */}
          <div className="h-7 bg-gradient-to-t from-gray-700 to-gray-800 border-t border-gray-600 rounded-b-sm mx-9 flex items-center justify-center">
            <div className="flex gap-1">{[...Array(4)].map((_,i)=><div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-500"/>)}</div>
          </div>
        </div>

        {/* Rack legend */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-gray-700 font-mono">
            {rack.totalU}U · {allDevices.reduce((s,d)=>s+d.uSize,0)}U used · {rack.totalU - allDevices.reduce((s,d)=>s+d.uSize,0)}U free
          </p>
          {dragDevice && (
            <p className="text-[10px] text-blue-400 mt-1 animate-pulse">Dragging: {dragDevice.name} — drop to move</p>
          )}
        </div>
      </div>

      {/* ── Device list sidebar ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Devices ({devices.length})</h3>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(
              allDevices.reduce((acc, d) => {
                acc[d.deviceType] = (acc[d.deviceType] || 0) + 1;
                return acc;
              }, {} as DeviceCountMap)
            ).map(([type, count]) => (
              <span key={type} className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ color: deviceColor(type as Device['deviceType']), background:`${deviceBorder(type as Device['deviceType'])}22`, border:`1px solid ${deviceBorder(type as Device['deviceType'])}44` }}>
                {DEVICE_META[type as Device['deviceType']]?.icon} {count}
              </span>
            ))}
          </div>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
            <p className="text-gray-600 text-sm">No devices match filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...devices].sort((a,b) => a.uStart - b.uStart).map(device => {
              const isSelected = selectedDevice?._id === device._id;
              return (
                <div key={device._id}
                  className={clsx('flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border',
                    isSelected ? 'bg-gray-800 border-gray-600' : 'bg-[#161b27] border-gray-800/60 hover:border-gray-700')}
                  onClick={() => onDeviceClick(device)}>
                  <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: deviceBorder(device.deviceType) }}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">{device.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ color: deviceColor(device.deviceType), background:`${deviceBorder(device.deviceType)}22`, border:`1px solid ${deviceBorder(device.deviceType)}44` }}>
                        {DEVICE_META[device.deviceType]?.label}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-0.5">
                      {device.ipAddress && <span className="text-[10px] font-mono text-gray-600">{device.ipAddress}</span>}
                      {device.serialNumber && <span className="text-[10px] font-mono text-gray-700">S/N: {device.serialNumber}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono text-gray-500">U{device.uStart}–{device.uStart+device.uSize-1}</p>
                    <p className="text-[10px] text-gray-700">{device.uSize}U</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
