'use client';
// ============================================================
// FILE: frontend/src/components/discovery/NetworkScanModal.tsx
// ACTION: NEW FILE — create folder + file
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { discoveryApi, rackApi } from '@/lib/api';
import { Rack, DiscoveryPoll } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  defaultRackId?: string;
  onComplete: (sessionId: string) => void;
  onClose: () => void;
}

const QUICK_RANGES = [
  '192.168.1.0/24', '192.168.0.0/24', '10.0.0.0/24',
  '10.10.0.0/24', '172.16.0.0/24',
];

export default function NetworkScanModal({ defaultRackId, onComplete, onClose }: Props) {
  const [range,    setRange]    = useState('192.168.1.0/24');
  const [rackId,   setRackId]   = useState(defaultRackId || '');
  const [scanType, setScanType] = useState<'ping_sweep' | 'port_scan'>('ping_sweep');
  const [timeout,  _setTimeout] = useState(5);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [poll,      setPoll]      = useState<DiscoveryPoll | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check nmap availability
  const { data: nmapInfo } = useQuery({
    queryKey: ['disc-status'],
    queryFn:  () => discoveryApi.checkStatus().then(r => r.data),
    staleTime: 300_000,
  });

  // Rack list for dropdown
  const { data: racksData } = useQuery({
    queryKey: ['racks'],
    queryFn:  () => rackApi.list().then(r => r.data),
  });
  const racks: Rack[] = racksData?.racks || [];

  // Start scan
  const scanMut = useMutation({
  mutationFn: () =>
    discoveryApi.startScan({
      networkRange: range,
      rackId: rackId || undefined,
      scanType,
      timeout,
      portScan: scanType === 'port_scan',
    }),

  onSuccess: (res) => {
    const r = res.data;
    console.log("Discovery Response:", r);

    setSessionId(r.sessionId);

    setPoll({
      status: 'running',
      progress: 0,
      message: 'Initializing scan...',
    });

    toast.success(`Scan started: ${range}`);
  },

  onError: (e: any) => {
    console.error("Discovery Start Error:", e);

    toast.error(
      e?.response?.data?.error || "Failed to start scan"
    );
  },
});

  // Poll progress
  useEffect(() => {
    if (!sessionId || !poll || poll.status !== 'running') return;

    timerRef.current = setInterval(async () => {
      try {
        const r = await discoveryApi.poll(sessionId);
        setPoll(r.data);
        if (r.data.status === 'completed') {
          clearInterval(timerRef.current!);
          toast.success(r.data.message || 'Scan complete!');
          onComplete(sessionId);
        } else if (r.data.status === 'failed') {
          clearInterval(timerRef.current!);
          toast.error(`Scan failed: ${r.data.message}`);
        }
      } catch { /* silent */ }
    }, 1500);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionId, poll?.status]);

  const scanning = scanMut.isPending || (!!poll && poll.status === 'running');
  const pct      = poll?.progress ?? 0;
  const msg      = poll?.message  ?? '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && !scanning && onClose()}
    >
      <div className="bg-[#0f1117] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl"
        style={{ animation: 'scaleIn .18s ease-out' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
              🔍
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Network Auto Discovery</h2>
              <p className="text-[10px] text-gray-500">Scan your LAN and auto-import devices</p>
            </div>
          </div>
          {!scanning && (
            <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* nmap status pill */}
          {nmapInfo && (
            <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 border text-xs ${
              nmapInfo.nmapAvailable
                ? 'bg-green-950/30 border-green-800/40 text-green-300'
                : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
            }`}>
              <span className="text-base shrink-0 mt-0.5">{nmapInfo.nmapAvailable ? '✅' : '⚠️'}</span>
              <div>
                <p className="font-semibold">{nmapInfo.nmapAvailable ? 'nmap ready' : 'nmap not installed'}</p>
                <p className="text-[10px] opacity-75 mt-0.5">{nmapInfo.message}</p>
              </div>
            </div>
          )}

          {/* Network range */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Network Range (CIDR) *
            </label>
            <input
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="192.168.1.0/24"
              value={range}
              onChange={e => setRange(e.target.value)}
              disabled={scanning}
            />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {QUICK_RANGES.map(r => (
                <button key={r} type="button" onClick={() => setRange(r)} disabled={scanning}
                  className={`text-[10px] font-mono px-2 py-1 rounded border transition-all disabled:opacity-40 ${
                    range === r
                      ? 'bg-blue-900/30 border-blue-700/50 text-blue-400'
                      : 'border-gray-800 text-gray-600 hover:text-gray-300 hover:border-gray-700'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Scan type */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Scan Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v:'ping_sweep', icon:'🏃', title:'Ping Sweep', desc:'Fast. IP, MAC, hostname.', time:'~30s for /24', clr:'blue' },
                { v:'port_scan',  icon:'🔎', title:'Port Scan',  desc:'Slower. Better device detection.', time:'~2–5 min for /24', clr:'purple' },
              ].map(opt => (
                <button key={opt.v} type="button" disabled={scanning}
                  onClick={() => setScanType(opt.v as 'ping_sweep' | 'port_scan')}
                  className={`p-3.5 rounded-xl border text-left transition-all disabled:opacity-40 ${
                    scanType === opt.v
                      ? opt.clr === 'blue'
                        ? 'bg-blue-950/40 border-blue-700/50 text-blue-300'
                        : 'bg-purple-950/40 border-purple-700/50 text-purple-300'
                      : 'border-gray-800 text-gray-500 hover:border-gray-700'
                  }`}>
                  <p className="text-xs font-bold">{opt.icon} {opt.title}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{opt.desc}</p>
                  <p className={`text-[10px] mt-1 font-semibold ${opt.clr === 'blue' ? 'text-green-500' : 'text-amber-500'}`}>{opt.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Target rack */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Target Rack (optional — for import later)
            </label>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={rackId} onChange={e => setRackId(e.target.value)} disabled={scanning}>
              <option value="">No rack pre-selected</option>
              {racks.map(r => <option key={r._id} value={r._id}>{r.name} ({r.totalU}U)</option>)}
            </select>
          </div>

          {/* Progress */}
          {sessionId && poll && (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1.5">
                  {poll.status === 'running' && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block"/>
                  )}
                  {msg || 'Scanning…'}
                </span>
                <span className="font-mono text-blue-400">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background:
                      poll.status === 'failed'    ? '#ef4444' :
                      poll.status === 'completed' ? '#10b981' : '#3b82f6',
                  }}/>
              </div>
              {poll.status === 'completed' && (
                <p className="text-xs text-green-400">✅ Scan complete! Loading results…</p>
              )}
              {poll.status === 'failed' && (
                <p className="text-xs text-red-400">❌ {msg}</p>
              )}
            </div>
          )}

          {/* Info note */}
          <p className="text-[10px] text-gray-700 bg-gray-900/40 border border-gray-800/50 rounded-lg px-3 py-2.5 leading-relaxed">
            ℹ Scan runs on your server. MAC addresses require nmap with root.
            Large ranges (/8, /16) are blocked. Install nmap:{' '}
            <span className="font-mono text-gray-600">sudo apt-get install nmap</span>
          </p>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            {!scanning && (
              <button onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium px-4 py-2.5 rounded-lg text-sm border border-gray-700 transition-all">
                Cancel
              </button>
            )}
            <button
              disabled={scanning || !range || scanMut.isPending}
              onClick={() => scanMut.mutate()}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {scanning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Scanning {range}…
                </>
              ) : '🔍 Start Scan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
