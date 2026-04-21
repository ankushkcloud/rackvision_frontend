'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Device, DEVICE_META } from '@/types';
import { deviceBorder, deviceColor } from '@/lib/utils';
import PortManager from '@/components/switch/PortManager';
import DeviceHealthCard from '@/components/health/DeviceHealthCard';
import WarrantyCard from '@/components/warranty/WarrantyCard';
import DeviceQRCode from '@/components/qr/DeviceQRCode';
import AuditLogTable from '@/components/audit/AuditLogTable';

interface Props {
  device: Device;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

type Tab = 'info' | 'ports' | 'health' | 'warranty' | 'qr' | 'audit';

const STATUS_META = {
  online: { label: 'Online', color: '#34d399', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.35)' },
  offline: { label: 'Offline', color: '#f87171', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.35)' },
  degraded: { label: 'Degraded', color: '#fbbf24', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.35)' },
  unknown: { label: 'Unknown', color: '#94a3b8', bg: 'rgba(100,116,139,0.14)', border: 'rgba(100,116,139,0.35)' },
} as const;

export default function DevicePanel({ device, onClose, onEdit, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('info');
  const meta = DEVICE_META[device.deviceType];
  const border = deviceBorder(device.deviceType);
  const color = deviceColor(device.deviceType);
  const hasPorts = ['switch', 'patch_panel'].includes(device.deviceType) && device.portCount > 0;
  const statusKey = device.lastStatus || 'unknown';
  const statusMeta = STATUS_META[statusKey];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'info', label: 'Info' },
    ...(hasPorts ? [{ id: 'ports' as Tab, label: 'Ports' }] : []),
    { id: 'health', label: 'Health' },
    { id: 'warranty', label: 'AMC' },
    { id: 'qr', label: 'QR' },
    { id: 'audit', label: 'Audit' },
  ];

  const infoRows = [
    { k: 'IP Address', v: device.ipAddress || '-', mono: true },
    { k: 'Serial Number', v: device.serialNumber || '-', mono: true },
    { k: 'Manufacturer', v: device.manufacturer || '-', mono: false },
    { k: 'Model', v: device.model || '-', mono: false },
    { k: 'U Position', v: `U${device.uStart} -> U${device.uStart + device.uSize - 1}`, mono: true },
    { k: 'U Size', v: `${device.uSize}U`, mono: true },
    ...(hasPorts ? [{ k: 'Ports', v: `${device.portCount} ports`, mono: true }] : []),
    { k: 'Status', v: statusMeta.label, mono: false },
    {
      k: 'Last Seen',
      v: device.lastSeenAt
        ? new Date(device.lastSeenAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Not available',
      mono: false,
    },
    { k: 'Added', v: new Date(device.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), mono: false },
  ];

  return (
    <div className="flex h-full w-96 flex-shrink-0 flex-col overflow-hidden border-l border-gray-800 bg-[#0c1020] animate-slide-right">
      <div className="flex-shrink-0 border-b border-gray-800 p-4" style={{ borderTop: `3px solid ${border}` }}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: `${border}18`, border: `1px solid ${border}44` }}>
            {meta?.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold leading-tight text-white">{device.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded px-1.5 py-0.5 font-mono text-[9px]" style={{ color, background: `${border}20`, border: `1px solid ${border}44` }}>
                {meta?.label}
              </span>
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: statusMeta.color, background: statusMeta.bg, border: `1px solid ${statusMeta.border}` }}>
                {statusMeta.label}
              </span>
              <span className="font-mono text-[9px] text-gray-600">U{device.uStart}-{device.uStart + device.uSize - 1}</span>
              {hasPorts && <span className="font-mono text-[9px] text-gray-700">{device.portCount}p</span>}
            </div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 p-1 text-gray-600 transition-colors hover:text-gray-300">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 overflow-x-auto border-b border-gray-800">
        <div className="flex min-w-max">
          {tabs.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={clsx(
                'whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[11px] font-semibold transition-colors',
                tab === item.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-600 hover:text-gray-300'
              )}
            >
              {item.label}
              {item.id === 'ports' && <span className="ml-1 text-[9px] text-gray-700">({device.portCount})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'info' && (
          <div className="space-y-4 p-4">
            <div className="space-y-2.5">
              {infoRows.map(({ k, v, mono }) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <span className="flex-shrink-0 text-[9px] uppercase tracking-wider text-gray-600">{k}</span>
                  <span className={clsx('max-w-[180px] truncate text-right text-[11px] text-gray-300', mono && 'font-mono')}>{v}</span>
                </div>
              ))}
            </div>

            {device.notes && (
              <div>
                <p className="mb-1.5 text-[9px] uppercase tracking-wider text-gray-600">Notes</p>
                <p className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 text-[11px] leading-relaxed text-gray-400">{device.notes}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-[9px] uppercase tracking-wider text-gray-600">Status</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="led h-2 w-2" style={{ background: statusMeta.color, color: statusMeta.color }} />
                  <span className="text-[10px]" style={{ color: statusMeta.color }}>{statusMeta.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="led h-2 w-2" style={{ background: '#f59e0b', color: '#f59e0b' }} />
                  <span className="text-[10px] text-amber-400">Tracked</span>
                </div>
                {device.lastSeenAt && (
                  <span className="text-[10px] text-gray-500">
                    Last seen {new Date(device.lastSeenAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => setTab('health')} className="rounded-lg border border-gray-800 bg-gray-900/60 p-2.5 text-xs text-gray-400 transition-all hover:border-gray-700 hover:text-gray-200">
                Health
              </button>
              <button onClick={() => setTab('warranty')} className="rounded-lg border border-gray-800 bg-gray-900/60 p-2.5 text-xs text-gray-400 transition-all hover:border-gray-700 hover:text-gray-200">
                Warranty
              </button>
              <button onClick={() => setTab('qr')} className="rounded-lg border border-gray-800 bg-gray-900/60 p-2.5 text-xs text-gray-400 transition-all hover:border-gray-700 hover:text-gray-200">
                QR Code
              </button>
              <button onClick={() => setTab('audit')} className="rounded-lg border border-gray-800 bg-gray-900/60 p-2.5 text-xs text-gray-400 transition-all hover:border-gray-700 hover:text-gray-200">
                Audit
              </button>
            </div>
          </div>
        )}

        {tab === 'ports' && hasPorts && (
          <div className="p-4">
            <PortManager device={device} />
          </div>
        )}

        {tab === 'health' && (
          <div className="p-4">
            <DeviceHealthCard deviceId={device._id} deviceName={device.name} />
          </div>
        )}

        {tab === 'warranty' && (
          <div className="p-4">
            <WarrantyCard deviceId={device._id} deviceName={device.name} />
          </div>
        )}

        {tab === 'qr' && (
          <div className="p-4">
            <DeviceQRCode deviceId={device._id} deviceName={device.name} rackId={device.rack} />
          </div>
        )}

        {tab === 'audit' && (
          <div className="p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Activity for this device</p>
            <AuditLogTable compact limit={20} />
          </div>
        )}
      </div>

      <div className="flex flex-shrink-0 gap-2 border-t border-gray-800 p-3">
        <button onClick={onEdit} className="btn-ghost flex-1 py-2 text-xs">Edit</button>
        <button onClick={() => { if (confirm(`Delete "${device.name}"?`)) onDelete(); }} className="btn-red flex-1 py-2 text-xs">Delete</button>
      </div>
    </div>
  );
}
