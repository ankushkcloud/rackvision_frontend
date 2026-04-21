'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { rackApi, deviceApi } from '@/lib/api';
import { useRealtimeFeed } from '@/lib/useRealtimeFeed';
import { Device, Rack } from '@/types';
import RackCanvas from '@/components/rack/RackCanvas';
import DeviceModal from '@/components/device/DeviceModal';
import DevicePanel from '@/components/device/DevicePanel';
import AiPanel from '@/components/ui/AiPanel';
import ExportButton from '@/components/export/ExportButton';

export default function RackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const rackRef = useRef<HTMLDivElement>(null);
  const events = useRealtimeFeed(true);

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const { data: rData, isLoading: rLoad } = useQuery({
    queryKey: ['rack', id],
    queryFn: () => rackApi.get(id).then(r => r.data),
  });

  const { data: dData, isLoading: dLoad } = useQuery({
    queryKey: ['rack-devices', id],
    queryFn: () => rackApi.getDevices(id).then(r => r.data),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const hasRackMonitoringEvent = events.some(event =>
      event.type === 'monitoring.updated' && event.payload?.rackId === id
    );
    if (!hasRackMonitoringEvent) return;

    qc.invalidateQueries({ queryKey: ['rack-devices', id] });
  }, [events, id, qc]);

  const rack: Rack | undefined = rData?.rack;
  const allDevices: Device[] = dData?.devices || [];

  useEffect(() => {
    if (!selectedDevice) return;
    const freshDevice = allDevices.find(device => device._id === selectedDevice._id);
    if (freshDevice) setSelectedDevice(freshDevice);
  }, [allDevices, selectedDevice]);

  const delDevice = useMutation({
    mutationFn: (deviceId: string) => deviceApi.delete(deviceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rack-devices', id] });
      qc.invalidateQueries({ queryKey: ['racks'] });
      setSelectedDevice(null);
      toast.success('Device deleted');
    },
    onError: (error: AxiosError<{ error: string }>) => toast.error(error.response?.data?.error || 'Delete failed'),
  });

  const devices = allDevices.filter(device => {
    const q = search.toLowerCase();
    const matchSearch = !q || device.name.toLowerCase().includes(q) || device.ipAddress.includes(q) || device.serialNumber.toLowerCase().includes(q);
    const matchType = !filterType || device.deviceType === filterType;
    return matchSearch && matchType;
  });

  const occupiedSlots = allDevices.map(device => ({ start: device.uStart, end: device.uStart + device.uSize - 1, id: device._id }));
  const usedU = allDevices.reduce((sum, device) => sum + device.uSize, 0);
  const freeU = (rack?.totalU || 0) - usedU;
  const pct = rack ? Math.round((usedU / rack.totalU) * 100) : 0;

  const copyShare = () => {
    if (!rack) return;
    navigator.clipboard.writeText(`${window.location.origin}/share/${rack.shareToken}`);
    toast.success('Share link copied');
  };

  if (rLoad) {
    return (
      <div className="flex items-center gap-3 p-8">
        <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <span className="text-gray-500">Loading rack...</span>
      </div>
    );
  }

  if (!rack) {
    return (
      <div className="p-8 text-gray-400">
        Rack not found. <Link href="/dashboard" className="text-blue-400 underline">Back</Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 flex-col overflow-y-auto" ref={rackRef}>
        <div className="sticky top-0 z-20 border-b border-gray-800 bg-[#0f1117]/95 px-6 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-0.5 flex items-center gap-2 text-xs text-gray-600">
                <Link href="/dashboard" className="hover:text-gray-400">Dashboard</Link>
                <span>/</span>
                <span className="max-w-[200px] truncate text-gray-400">{rack.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">{rack.name}</h1>
                <span className="rounded border border-blue-800/40 bg-blue-900/30 px-1.5 py-0.5 font-mono text-[10px] text-blue-400">{rack.totalU}U</span>
                {rack.location && <span className="hidden text-xs text-gray-600 sm:block">{rack.location}</span>}
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                onClick={() => setShowAi(!showAi)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${showAi ? 'border-purple-700/50 bg-purple-600/20 text-purple-400' : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'}`}
              >
                AI Insights
              </button>
              <ExportButton rack={rack} devices={allDevices} rackRef={rackRef} />
              <button onClick={copyShare} className="btn-ghost px-3 py-1.5 text-xs">Share</button>
              <button onClick={() => setShowAdd(true)} className="btn-blue px-3 py-1.5 text-xs">Add Device</button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#3b82f6' }}
              />
            </div>
            <div className="flex flex-shrink-0 items-center gap-3 font-mono text-[11px] text-gray-600">
              <span><span className="text-gray-300">{usedU}U</span> used</span>
              <span><span className="text-green-400">{freeU}U</span> free</span>
              <span className="text-gray-500">{pct}%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-b border-gray-800/60 px-6 py-3">
          <div className="relative max-w-xs flex-1">
            <input className="field pl-3 text-xs py-2" placeholder="Search devices, IPs, serials..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="field w-36 py-2 text-xs" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {['server', 'switch', 'storage', 'firewall', 'router', 'patch_panel', 'ups', 'kvm'].map(type => (
              <option key={type} value={type}>{type.replace('_', ' ')}</option>
            ))}
          </select>
          <span className="ml-1 self-center text-xs text-gray-600">{devices.length} shown</span>
        </div>

        {showAi && <div className="border-b border-gray-800 px-6 py-4"><AiPanel rackId={id} /></div>}

        <div className="flex flex-1 gap-6 p-6">
          {dLoad ? (
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : (
            <RackCanvas
              rack={rack}
              devices={devices}
              allDevices={allDevices}
              selectedDevice={selectedDevice}
              onDeviceClick={setSelectedDevice}
              onAddDevice={() => setShowAdd(true)}
              onDeviceMoved={() => qc.invalidateQueries({ queryKey: ['rack-devices', id] })}
            />
          )}
        </div>
      </div>

      {selectedDevice && (
        <DevicePanel
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onEdit={() => {
            setEditDevice(selectedDevice);
            setSelectedDevice(null);
          }}
          onDelete={() => delDevice.mutate(selectedDevice._id)}
        />
      )}

      {showAdd && (
        <DeviceModal
          rack={rack}
          occupiedSlots={occupiedSlots}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            qc.invalidateQueries({ queryKey: ['rack-devices', id] });
            qc.invalidateQueries({ queryKey: ['racks'] });
          }}
        />
      )}

      {editDevice && (
        <DeviceModal
          rack={rack}
          device={editDevice}
          occupiedSlots={occupiedSlots.filter(slot => slot.id !== editDevice._id)}
          onClose={() => setEditDevice(null)}
          onSuccess={() => {
            setEditDevice(null);
            qc.invalidateQueries({ queryKey: ['rack-devices', id] });
          }}
        />
      )}
    </div>
  );
}
