// ============================================================
// FILE: frontend/src/types/index.ts
// ACTION: PASTE THIS AT THE BOTTOM of your existing types file
// ============================================================

export type DiscoveryDeviceType =
  | 'server' | 'switch' | 'router' | 'firewall'
  | 'storage' | 'ups' | 'kvm' | 'patch_panel';

export interface DiscoveredDevice {
  _id:           string;
  ip:            string;
  hostname:      string;
  mac:           string;
  vendor:        string;
  deviceType:    DiscoveryDeviceType;
  status:        'online' | 'offline';
  latencyMs:     number | null;
  openPorts:     number[];
  suggestedName: string;
  imported:      boolean;
  importedAt:    string | null;
  importedDeviceId: string | null;
}

export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface DiscoverySession {
  _id:          string;
  owner:        string;
  rack:         { _id: string; name: string; totalU: number } | null;
  networkRange: string;
  scanType:     'ping_sweep' | 'port_scan';
  scanOptions:  { timeout: number; portScan: boolean; ports: string };
  status:       ScanStatus;
  progress:     number;
  startedAt:    string | null;
  completedAt:  string | null;
  durationMs:   number | null;
  errorMessage: string;
  devices:      DiscoveredDevice[];
  totalFound:   number;
  onlineCount:  number;
  offlineCount: number;
  importedCount:number;
  nmapCommand:  string;
  usedFallback: boolean;
  createdAt:    string;
}

export interface DiscoveryPoll {
  status:   ScanStatus;
  progress: number;
  message:  string;
}

// Metadata for display
export const DISC_TYPE_META: Record<DiscoveryDeviceType, {
  label: string; icon: string; color: string; rackType: string;
}> = {
  server:      { label: 'Server',      icon: '🖥️', color: '#60a5fa', rackType: 'server'      },
  switch:      { label: 'Switch',      icon: '🔀', color: '#34d399', rackType: 'switch'      },
  router:      { label: 'Router',      icon: '🌐', color: '#c084fc', rackType: 'router'      },
  firewall:    { label: 'Firewall',    icon: '🛡️', color: '#f87171', rackType: 'firewall'    },
  storage:     { label: 'Storage',     icon: '💾', color: '#22d3ee', rackType: 'storage'     },
  ups:         { label: 'UPS',         icon: '⚡', color: '#fb923c', rackType: 'ups'         },
  kvm:         { label: 'KVM',         icon: '🖱️', color: '#e879f9', rackType: 'kvm'         },
  patch_panel: { label: 'Patch Panel', icon: '🔌', color: '#fbbf24', rackType: 'patch_panel' },
};
