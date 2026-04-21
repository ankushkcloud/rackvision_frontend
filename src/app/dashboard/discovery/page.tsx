'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { discoveryApi, rackApi } from '@/lib/api';
import { DiscoveryFinding, DiscoveryJob, Rack } from '@/types';

export default function DiscoveryPage() {
  const qc = useQueryClient();
  const [targets, setTargets] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [community, setCommunity] = useState('public');
  const [useDefaultGateway, setUseDefaultGateway] = useState(true);

  const { data: racksData } = useQuery({
    queryKey: ['racks', 'all'],
    queryFn: () => rackApi.list().then(r => r.data),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['discovery'],
    queryFn: () => discoveryApi.list().then(r => r.data),
  });

  const runMutation = useMutation({
    mutationFn: () => discoveryApi.run({
      rack: selectedRack || undefined,
      targets: targets.split(',').map(item => item.trim()).filter(Boolean),
      methods: ['ping', 'snmp', 'nmap'],
      name: 'Switch Discovery Sweep',
      community: community.trim() || undefined,
      useDefaultGateway,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discovery'] });
      toast.success('Discovery completed');
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || 'Discovery failed'),
  });

  const importMutation = useMutation({
    mutationFn: ({ jobId, findingIndex }: { jobId: string; findingIndex: number }) =>
      discoveryApi.importFinding(jobId, { findingIndex, rack: selectedRack || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discovery'] });
      qc.invalidateQueries({ queryKey: ['racks'] });
      toast.success('Switch imported into rack');
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || 'Import failed'),
  });

  const racks: Rack[] = racksData?.racks || [];
  const jobs: DiscoveryJob[] = data?.jobs || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.02fr,1.38fr]">
        <div className="card p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Switch Auto Discovery</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Fetch connected switch details from your local network.</h1>
          <p className="mt-3 text-sm text-slate-500">
            Best results tab aayenge jab switch reachable ho aur SNMP enabled ho. Ping se basic reachability milegi; SNMP se port count, interface labels, status aur vendor/model kaafi better aata hai.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="label">Rack Scope For Import</label>
              <select className="field" value={selectedRack} onChange={e => setSelectedRack(e.target.value)}>
                <option value="">Select rack for import</option>
                {racks.map(rack => <option key={rack._id} value={rack._id}>{rack.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Target IPs</label>
              <textarea
                className="field min-h-[120px]"
                value={targets}
                onChange={e => setTargets(e.target.value)}
                placeholder="192.168.1.1 or 192.168.1.10, 192.168.1.11"
              />
            </div>

            <div>
              <label className="label">SNMP Community</label>
              <input
                className="field"
                value={community}
                onChange={e => setCommunity(e.target.value)}
                placeholder="public"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-600">
              <input type="checkbox" checked={useDefaultGateway} onChange={e => setUseDefaultGateway(e.target.checked)} />
              Also try local default gateway automatically
            </label>

            <button className="btn-blue w-full" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
              {runMutation.isPending ? 'Running discovery...' : 'Run switch discovery'}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Discovery Results</h2>
              <p className="text-sm text-slate-500">Latest scans, switch details, and import actions</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {isLoading ? (
              <div className="h-40 rounded-[24px] bg-sky-50 animate-pulse" />
            ) : jobs.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/60 px-6 py-12 text-center text-sm text-slate-500">
                No discovery jobs yet.
              </div>
            ) : jobs.map(job => (
              <div key={job._id} className="rounded-[24px] border border-sky-100 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{job.name}</p>
                    <p className="text-sm text-slate-500">
                      {job.methods.join(', ')} {job.rack?.name ? `• ${job.rack.name}` : '• import rack not fixed'}
                    </p>
                  </div>
                  <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                    {job.status}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Metric label="New" value={job.summary.discovered} />
                  <Metric label="Changed" value={job.summary.changed} />
                  <Metric label="Attention" value={job.summary.offline} />
                </div>

                <div className="mt-5 space-y-3">
                  {job.findings.map((finding, index) => (
                    <FindingCard
                      key={`${job._id}-${finding.ipAddress}-${index}`}
                      jobId={job._id}
                      finding={finding}
                      findingIndex={index}
                      selectedRack={selectedRack}
                      importPending={importMutation.isPending}
                      onImport={(findingIndex) => importMutation.mutate({ jobId: job._id, findingIndex })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-sky-50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-sky-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function FindingCard({
  jobId,
  finding,
  findingIndex,
  selectedRack,
  importPending,
  onImport,
}: {
  jobId: string;
  finding: DiscoveryFinding;
  findingIndex: number;
  selectedRack: string;
  importPending: boolean;
  onImport: (findingIndex: number) => void;
}) {
  const badgeClass = finding.status === 'healthy'
    ? 'bg-emerald-50 text-emerald-600'
    : finding.status === 'attention'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-sky-50 text-sky-600';

  return (
    <div className="rounded-[24px] border border-sky-100 bg-sky-50/55 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">{finding.deviceName}</p>
          <p className="text-sm text-slate-500">
            {finding.ipAddress}
            {finding.macAddress ? ` • MAC ${finding.macAddress}` : ''}
            {finding.manufacturer ? ` • ${finding.manufacturer}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeClass}`}>
            {finding.status}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
            {finding.snmpAvailable ? 'snmp' : 'basic'}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Info label="Type" value={finding.deviceType || 'unknown'} />
        <Info label="Ports" value={String(finding.portCount || 0)} />
        <Info label="Model" value={finding.model || '-'} />
        <Info label="Change" value={finding.change.replace(/_/g, ' ')} />
      </div>

      {finding.notes && (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">{finding.notes}</p>
      )}

      {!!finding.ports?.length && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">Port Snapshot</p>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            {finding.ports.slice(0, 8).map(port => (
              <div key={port.portNumber} className="rounded-2xl bg-white px-3 py-3 text-sm">
                <p className="font-semibold text-slate-800">Port {port.portNumber} • {port.label || 'Unnamed'}</p>
                <p className="text-slate-500">{port.status} {port.speed ? `• ${port.speed}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {finding.type === 'untracked_device' && (
        <div className="mt-4 flex justify-end">
          <button
            className="btn-blue px-4 py-2 text-xs"
            disabled={!selectedRack || importPending}
            onClick={() => onImport(findingIndex)}
          >
            {!selectedRack ? 'Select rack to import' : importPending ? 'Importing...' : 'Import as switch'}
          </button>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-sky-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 break-words">{value}</p>
    </div>
  );
}
