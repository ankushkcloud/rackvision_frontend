'use client';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { rackApi } from '@/lib/api';
import { Device, Rack, DEVICE_META, PORT_STATUS_COLORS, PORT_DEVICE_META } from '@/types';
import { deviceBg, deviceBorder, deviceColor, shortType } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';

const U_H = 28;

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [expandedSwitch, setExpandedSwitch] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['share', token],
    queryFn:  () => rackApi.getByToken(token).then(r => r.data),
    retry: false,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
        <p className="text-gray-500 text-sm font-mono">Loading rack…</p>
      </div>
    </div>
  );

  if (error || !data?.rack) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-white mb-2">Rack Not Found</h1>
        <p className="text-gray-500 text-sm mb-6">This share link may be invalid or expired.</p>
        <Link href="/auth/login" className="btn-blue inline-block">Open RackVision</Link>
      </div>
    </div>
  );

  const rack: Rack      = data.rack;
  const devices: Device[] = data.devices || [];
  const usedU = devices.reduce((s, d) => s + d.uSize, 0);
  const freeU = rack.totalU - usedU;
  const pct   = Math.round((usedU / rack.totalU) * 100);

  // Build slot map
  const occupiedMap = new Map<number, Device>();
  devices.forEach(d => { for (let u = d.uStart; u < d.uStart + d.uSize; u++) occupiedMap.set(u, d); });
  const rendered = new Set<string>();
  const slots = Array.from({ length: rack.totalU }, (_, i) => i + 1);

  const switches = devices.filter(d => ['switch','patch_panel'].includes(d.deviceType) && d.portCount > 0);

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Banner */}
      <div className="bg-[#0c1020] border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
            </svg>
          </div>
          <div>
            <span className="font-bold text-white text-sm">RackVision</span>
            <span className="text-gray-700 mx-2">·</span>
            <span className="text-gray-500 text-sm">Shared View</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded px-2 py-1">👁 Read-only</span>
          <Link href="/auth/login" className="btn-blue text-xs py-1.5 px-3">Sign in to manage</Link>
        </div>
      </div>

      <div className="p-7 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-white mb-1">{rack.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {rack.location && <span>📍 {rack.location}</span>}
            <span className="font-mono text-blue-400">{rack.totalU}U</span>
            <span className="text-green-400">{freeU}U free</span>
            <span>{devices.length} devices</span>
          </div>
          {rack.tags?.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {rack.tags.map(t => <span key={t} className="text-[10px] font-mono text-gray-600 bg-gray-800 rounded px-2 py-0.5">{t}</span>)}
            </div>
          )}
          {rack.description && <p className="text-sm text-gray-600 mt-2">{rack.description}</p>}

          {/* Util bar */}
          <div className="mt-4 max-w-md">
            <div className="flex justify-between text-[11px] text-gray-600 mb-1">
              <span>Utilization</span>
              <span className="font-mono">{usedU}U / {rack.totalU}U ({pct}%)</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: pct>=90?'#ef4444':pct>=75?'#f59e0b':'#3b82f6' }}/>
            </div>
          </div>
        </div>

        <div className="flex gap-8 items-start flex-wrap xl:flex-nowrap">
          {/* Rack visualization */}
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-3 text-center">Rack Diagram</p>
            <div className="rack-chassis select-none" style={{ width: 400 }}>
              <div className="rack-rail rack-rail-left"/>
              <div className="rack-rail rack-rail-right"/>
              <div className="h-6 bg-gradient-to-b from-gray-700 to-gray-800 border-b border-gray-600 rounded-t-sm mx-9"/>
              <div className="py-1 px-9 relative">
                {slots.map(u => {
                  const device = occupiedMap.get(u);
                  const isStart = device?.uStart === u;
                  const shouldRender = device && isStart && !rendered.has(device._id);
                  if (shouldRender) rendered.add(device._id);
                  const devH = device ? device.uSize * U_H : U_H;

                  return (
                    <div key={u} className="u-slot" style={{ height: U_H, position:'relative' }}>
                      <span className="u-slot-num">{u}</span>
                      {shouldRender && device && (
                        <div className="device-block overflow-hidden" style={{
                          top:0, height:devH,
                          background:`linear-gradient(135deg,${deviceBg(device.deviceType)},${deviceBg(device.deviceType)})`,
                          border:`1px solid ${deviceBorder(device.deviceType)}`,
                        }}>
                          <div className="h-full flex items-center px-2.5 gap-2">
                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                              <div className="led" style={{width:4,height:4,background:'#10b981',color:'#10b981'}}/>
                              <div className="led" style={{width:4,height:4,background:'#f59e0b',color:'#f59e0b'}}/>
                            </div>
                            <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded flex-shrink-0"
                              style={{color:deviceColor(device.deviceType),background:`${deviceBorder(device.deviceType)}25`,border:`1px solid ${deviceBorder(device.deviceType)}44`}}>
                              {shortType[device.deviceType]}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-[10px] font-semibold truncate">{device.name}</p>
                              {device.ipAddress && <p className="text-gray-400 text-[8px] font-mono truncate">{device.ipAddress}</p>}
                            </div>
                            <span className="text-[8px] font-mono text-gray-600 flex-shrink-0">{device.uSize}U</span>
                            <span className="text-xs flex-shrink-0">{DEVICE_META[device.deviceType]?.icon}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="h-6 bg-gradient-to-t from-gray-700 to-gray-800 border-t border-gray-600 rounded-b-sm mx-9"/>
            </div>
          </div>

          {/* Right column: device table + switch ports */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Device table */}
            <div>
              <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Device Inventory ({devices.length})</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      {['#','Device','Type','IP Address','Serial Number','U Range','Size'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-gray-600 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...devices].sort((a,b)=>a.uStart-b.uStart).map((d, i) => (
                      <tr key={d._id} className="border-b border-gray-800/40 hover:bg-gray-900/30 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-gray-600">{i+1}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full" style={{background:deviceBorder(d.deviceType)}}/>
                            <div>
                              <p className="font-semibold text-white">{d.name}</p>
                              {(d.manufacturer||d.model) && <p className="text-gray-700">{[d.manufacturer,d.model].filter(Boolean).join(' ')}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{color:deviceColor(d.deviceType),background:`${deviceBorder(d.deviceType)}20`,border:`1px solid ${deviceBorder(d.deviceType)}33`}}>
                            {DEVICE_META[d.deviceType]?.icon} {DEVICE_META[d.deviceType]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-gray-300">{d.ipAddress||<span className="text-gray-700">—</span>}</td>
                        <td className="px-4 py-2.5 font-mono text-gray-500">{d.serialNumber||<span className="text-gray-700">—</span>}</td>
                        <td className="px-4 py-2.5 font-mono text-gray-400">U{d.uStart}–U{d.uStart+d.uSize-1}</td>
                        <td className="px-4 py-2.5 font-mono text-gray-600">{d.uSize}U</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Switch port tables */}
            {switches.map(sw => (
              <div key={sw._id}>
                <button
                  onClick={() => setExpandedSwitch(expandedSwitch === sw._id ? null : sw._id)}
                  className="w-full flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3 hover:text-gray-300 transition-colors">
                  <span>🔀 {sw.name} — {sw.portCount} Ports</span>
                  <span>{expandedSwitch === sw._id ? '▲' : '▼'}</span>
                </button>
                {expandedSwitch === sw._id && (
                  <div className="overflow-x-auto rounded-xl border border-gray-800">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-800 bg-gray-900/60">
                          {['Port','Label','Status','Type','IP','Connected Device','VLAN','Speed'].map(h=>(
                            <th key={h} className="text-left px-3 py-2 text-gray-600 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sw.ports.map((p, pi) => {
                          const sc  = PORT_STATUS_COLORS[p.status];
                          const pdm = PORT_DEVICE_META[p.deviceType];
                          return (
                            <tr key={pi} className="border-b border-gray-800/40 hover:bg-gray-900/30 transition-colors">
                              <td className="px-3 py-2 font-mono text-gray-500">{p.portNumber}</td>
                              <td className="px-3 py-2 text-gray-400">{p.label||`Port${p.portNumber}`}</td>
                              <td className="px-3 py-2">
                                <span className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{background:sc.dot}}/>
                                  <span style={{color:sc.dot}}>{sc.label}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-500">{pdm ? `${pdm.icon} ${pdm.label}` : '—'}</td>
                              <td className="px-3 py-2 font-mono text-gray-400">{p.ipAddress||'—'}</td>
                              <td className="px-3 py-2 text-gray-400">{p.connectedDevice||'—'}</td>
                              <td className="px-3 py-2 font-mono text-purple-400">{p.vlanId||'—'}</td>
                              <td className="px-3 py-2 font-mono text-gray-600">{p.speed||'—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
