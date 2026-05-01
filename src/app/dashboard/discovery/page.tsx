'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryApi } from '@/lib/api';
import { DiscoverySession } from '@/types';
import NetworkScanModal from '@/components/discovery/NetworkScanModal';
import DiscoveryResults from '@/components/discovery/DiscoveryResults';
import toast from 'react-hot-toast';

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);

  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;

  return new Date(d).toLocaleDateString();
}

const CARD = 'bg-[#161b27] border border-gray-800 rounded-xl';

export default function DiscoveryPage() {
  const qc = useQueryClient();

  const [showScan, setShowScan] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  // Recent sessions
  const { data, isLoading } = useQuery({
    queryKey: ['disc-sessions'],
    queryFn: () =>
      discoveryApi.listSessions({ limit: 15 }).then((r) => r.data),
    staleTime: 15000,
  });

  // Nmap status
  const { data: nmapInfo } = useQuery({
    queryKey: ['disc-status'],
    queryFn: () =>
      discoveryApi.checkStatus().then((r) => r.data),
    staleTime: 300000,
  });

  // Delete session
  const delMut = useMutation({
    mutationFn: (id: string) => discoveryApi.deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disc-sessions'] });
      toast.success('Session deleted');
    },
  });

  const sessions: DiscoverySession[] = data?.sessions || [];

  const totalFound = sessions.reduce(
    (sum, item) => sum + (item.totalFound || 0),
    0
  );

  const totalOnline = sessions.reduce(
    (sum, item) => sum + (item.onlineCount || 0),
    0
  );

  const totalImported = sessions.reduce(
    (sum, item) => sum + (item.importedCount || 0),
    0
  );

  return (
    <div className="p-7 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.25)',
            }}
          >
            📡
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Auto Discovery
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Scan your network and auto-import devices into RackVision
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowScan(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all"
        >
          🔍 Scan Network
        </button>
      </div>

      {/* Nmap Warning */}
      {nmapInfo && !nmapInfo.nmapAvailable && (
        <div
          className="flex items-start gap-3 rounded-xl px-5 py-4 mb-6"
          style={{
            background: 'rgba(120,80,0,0.12)',
            border: '1px solid rgba(245,158,11,0.25)',
          }}
        >
          <span className="text-amber-400 text-xl">⚠️</span>

          <div>
            <p className="text-sm font-semibold text-amber-300">
              nmap Not Installed on Server
            </p>

            <p className="text-xs text-amber-400/70 mt-1">
              Ping fallback will be used. For full detection install nmap.
            </p>

            <code className="text-xs font-mono text-gray-300 bg-gray-900 border border-gray-800 rounded px-3 py-1 inline-block mt-2">
              sudo apt-get install nmap
            </code>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          {
            label: 'Total Scans',
            value: sessions.length,
            icon: '🔍',
            color: '#3b82f6',
          },
          {
            label: 'Devices Found',
            value: totalFound,
            icon: '📡',
            color: '#10b981',
          },
          {
            label: 'Online Detected',
            value: totalOnline,
            icon: '🟢',
            color: '#34d399',
          },
          {
            label: 'Total Imported',
            value: totalImported,
            icon: '⬆',
            color: '#a78bfa',
          },
        ].map((item) => (
          <div key={item.label} className={`${CARD} p-4`}>
            <p className="text-2xl mb-2">{item.icon}</p>

            <p
              className="text-2xl font-bold font-mono"
              style={{ color: item.color }}
            >
              {item.value}
            </p>

            <p className="text-[10px] text-gray-500 mt-1">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Scans */}
      <h2 className="text-sm font-bold text-white mb-4">
        📋 Recent Scans
      </h2>

      {isLoading ? (
        <div className="py-8 text-gray-400">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-4xl mb-3">📡</p>

          <h3 className="text-base font-semibold text-gray-400 mb-2">
            No scans yet
          </h3>

          <button
            onClick={() => setShowScan(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm"
          >
            🔍 Start First Scan
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const statusStyle = ({
              completed: {
                bg: 'rgba(16,185,129,0.1)',
                border: 'rgba(16,185,129,0.25)',
                icon: '✅',
                tc: 'text-green-400',
              },
              running: {
                bg: 'rgba(59,130,246,0.1)',
                border: 'rgba(59,130,246,0.25)',
                icon: '⏳',
                tc: 'text-blue-400',
              },
              failed: {
                bg: 'rgba(239,68,68,0.1)',
                border: 'rgba(239,68,68,0.25)',
                icon: '❌',
                tc: 'text-red-400',
              },
            } as Partial<Record<DiscoverySession['status'], {
              bg: string;
              border: string;
              icon: string;
              tc: string;
            }>>)[session.status] || {
              bg: 'rgba(107,114,128,0.1)',
              border: 'rgba(107,114,128,0.25)',
              icon: '⏸',
              tc: 'text-gray-500',
            };

            return (
              <div
                key={session._id}
                className={`${CARD} p-4 flex items-center gap-4`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{
                    background: statusStyle.bg,
                    border: `1px solid ${statusStyle.border}`,
                  }}
                >
                  {statusStyle.icon}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-white text-sm">
                      {session.networkRange}
                    </span>

                    <span className={statusStyle.tc}>
                      {session.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {session.onlineCount} online • {session.totalFound} total
                  </div>
                </div>

                {session.status === 'completed' &&
                  session.totalFound > 0 && (
                    <button
                      onClick={() => setActiveSession(session._id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      View Results
                    </button>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scan Modal */}
      {showScan && (
        <NetworkScanModal
          onClose={() => setShowScan(false)}
          onComplete={(sid) => {
            setShowScan(false);
            setActiveSession(sid);
            qc.invalidateQueries({
              queryKey: ['disc-sessions'],
            });
          }}
        />
      )}

      {/* Results Modal */}
      {activeSession && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: '#0f1117' }}
        >
          <DiscoveryResults
            sessionId={activeSession}
            onClose={() => {
              setActiveSession(null);
              qc.invalidateQueries({
                queryKey: ['disc-sessions'],
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
