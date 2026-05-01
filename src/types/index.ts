// ─── Enums & Literals ─────────────────────────────────────────────────────────

export type DeviceType = 'server' | 'switch' | 'storage' | 'firewall' | 'router' | 'patch_panel' | 'ups' | 'kvm';
export type PortDeviceType = 'camera' | 'access_point' | 'data' | 'server' | 'printer' | 'voip' | 'other' | '';
export type PortStatus = 'active' | 'inactive' | 'error';
export type PortSpeed = '10M' | '100M' | '1G' | '10G' | '25G' | '40G' | '100G' | '';

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface Port {
  portNumber: number;
  label: string;
  ipAddress: string;
  deviceType: PortDeviceType;
  connectedDevice: string;
  vlanId: number | null;
  status: PortStatus;
  notes: string;
  speed: PortSpeed;
}

export interface Device {
  _id: string;
  rack: string;
  name: string;
  deviceType: DeviceType;
  ipAddress: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  uStart: number;
  uSize: number;
  uEnd: number;          // virtual — uStart + uSize - 1
  portCount: number;
  ports: Port[];
  notes: string;
  order: number;
  discoverySource?: 'manual' | 'ping' | 'snmp' | 'nmap' | 'import';
  lastSeenAt?: string | null;
  lastStatus?: 'online' | 'offline' | 'degraded' | 'unknown';
  createdAt: string;
  updatedAt: string;
}

export interface Rack {
  _id: string;
  name: string;
  location: string;
  totalU: number;
  description: string;
  shareToken: string;
  owner: string;
  tags: string[];
  deviceCount?: number;
  usedU?: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'engineer' | 'viewer' | 'client';
  companyName?: string;
}

// ─── AI Types ─────────────────────────────────────────────────────────────────

export interface AiAlert {
  type: 'critical' | 'warning' | 'info';
  icon: string;
  title: string;
  msg: string;
}

export interface AiSummary {
  totalU: number;
  usedU: number;
  freeU: number;
  utilizationPct: number;
  deviceCount: number;
  switchCount: number;
  totalPorts: number;
  activePorts: number;
  score: number;
}

export interface AiAnalysis {
  alerts: AiAlert[];
  tips: AiAlert[];
  summary: AiSummary;
}

export type AlertType =
  | 'device_down' | 'port_inactive' | 'temperature_high'
  | 'rack_full' | 'ups_battery_low' | 'warranty_expiring'
  | 'amc_expiring' | 'custom';

export type AlertPriority = 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface RackAlert {
  _id: string;
  rack: { _id: string; name: string } | string;
  device?: { _id: string; name: string; deviceType: string } | null;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  message: string;
  meta: Record<string, unknown>;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceHealth {
  _id: string;
  device: string;
  rack: string;
  owner?: string;
  healthScore: number;
  powerStatus: 'on' | 'off' | 'unknown';
  powerWatts?: number;
  cpuTempC?: number;
  ambientTempC?: number;
  tempThreshold: number;
  pingStatus: 'online' | 'offline' | 'unknown';
  pingLatencyMs?: number;
  lastPingAt?: string;
  statusMessage?: string;
  lastStatusChangeAt?: string;
  lastDowntime?: string;
  downtimeStartedAt?: string | null;
  lastRecoveryAt?: string | null;
  totalDowntimeMinutes: number;
  consecutiveFailures?: number;
  consecutiveSuccesses?: number;
  uptimePct: number;
  monitorDetails?: Record<string, unknown>;
  notes: string;
  updatedAt: string;
}

export interface PingLog {
  _id: string;
  device: string;
  rack: string;
  owner: string;
  target: string;
  monitorType: 'ping' | 'snmp' | 'nmap';
  source: 'api' | 'scheduled' | 'manual' | 'import';
  status: 'online' | 'offline' | 'unknown';
  responseTimeMs?: number | null;
  success: boolean;
  checkedAt: string;
  errorMessage?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Warranty {
  _id: string;
  device: { _id: string; name: string; deviceType: string; manufacturer: string; model: string } | string;
  rack: string;
  purchaseDate?: string;
  purchaseCost?: number;
  currency: string;
  invoiceNumber: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyType: string;
  amcStartDate?: string;
  amcEndDate?: string;
  amcCost?: number;
  amcVendor: string;
  vendorName: string;
  vendorContact: string;
  vendorEmail: string;
  vendorPhone: string;
  notes: string;
  warrantyDaysLeft?: number;
  amcDaysLeft?: number;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  user: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName: string;
  rack?: string;
  rackName: string;
  changes?: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

export interface AnalyticsDashboard {
  rackUtilization: { name: string; totalU: number; usedU: number; freeU: number; devices: number; pct: number }[];
  deviceGrowth: { month: string; year: number; count: number; total: number }[];
  alertTrend: { label: string; high: number; medium: number; low: number }[];
  downtimeTrend: { label: string; count: number }[];
  deviceTypeDistribution: { type: string; count: number }[];
  totals: { racks: number; devices: number; alerts: number };
}

export interface BrandingSettings {
  _id: string;
  companyName: string;
  companyLogoUrl: string;
  accentColor: string;
  secondaryColor: string;
  dashboardTitle: string;
  reportFooter: string;
  themeMode: 'light' | 'hybrid';
}

export interface MaintenanceTicket {
  _id: string;
  title: string;
  category: 'device_failure' | 'port_issue' | 'power_issue' | 'network' | 'maintenance' | 'other';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  rack?: { _id: string; name: string } | null;
  device?: { _id: string; name: string } | null;
  assignedEngineer?: { _id: string; name: string; email: string; role: User['role'] } | null;
  dueAt?: string | null;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportRequest {
  _id: string;
  title: string;
  module: 'dashboard' | 'rack' | 'device' | 'alerts' | 'reports' | 'branding' | 'other';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'open' | 'triaged' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  requesterName: string;
  requesterEmail: string;
  assignee?: { _id: string; name: string; email: string; role: User['role'] } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackupSnapshot {
  _id: string;
  name: string;
  summary: { racks: number; devices: number; alerts: number; tickets: number };
  createdAt: string;
}

export interface ReportSchedule {
  _id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  includeModules: string[];
  enabled: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
}

export interface DiscoveryFinding {
  type: 'known_device' | 'untracked_device';
  ipAddress: string;
  deviceId?: string;
  deviceName: string;
  status: 'healthy' | 'attention' | 'new';
  change: 'heartbeat_refresh' | 'newly_observed' | 'candidate_for_import';
  macAddress?: string;
  snmpAvailable?: boolean;
  manufacturer?: string;
  model?: string;
  portCount?: number;
  ports?: Port[];
  deviceType?: DeviceType;
  sysDescr?: string;
  notes?: string;
}

export interface DiscoveryJob {
  _id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  targets: string[];
  methods: string[];
  findings: DiscoveryFinding[];
  summary: { discovered: number; changed: number; offline: number };
  createdAt: string;
  completedAt?: string | null;
  rack?: { _id: string; name: string } | null;
}

export interface ComplianceLog {
  _id: string;
  category: 'sla' | 'security' | 'maintenance' | 'support' | 'discovery' | 'audit';
  title: string;
  status: 'pass' | 'warning' | 'fail' | 'info';
  details: string;
  createdAt: string;
}

export interface SlaOverview {
  totals: { devices: number; compliantDevices: number; avgUptime: number };
  deviceSummaries: {
    deviceId: string;
    deviceName: string;
    rackId: string;
    uptimePct: number;
    slaTarget: number;
    compliant: boolean;
    downtimeMinutes: number;
  }[];
  compliance: ComplianceLog[];
}

export interface RealtimeEvent {
  type: string;
  payload?: Record<string, unknown>;
  ts: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const RACK_SIZES = [6, 12, 18, 24, 36, 42, 48] as const;

export const DEVICE_META: Record<DeviceType, {
  label: string; icon: string;
  color: string; bg: string; border: string;
}> = {
  server:      { label: 'Server',      icon: '🖥️',  color: '#60a5fa', bg: 'rgba(59,130,246,0.15)',  border: '#3b82f6' },
  switch:      { label: 'Switch',      icon: '🔀',  color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: '#10b981' },
  storage:     { label: 'Storage',     icon: '💾',  color: '#22d3ee', bg: 'rgba(6,182,212,0.15)',   border: '#06b6d4' },
  firewall:    { label: 'Firewall',    icon: '🛡️',  color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: '#ef4444' },
  router:      { label: 'Router',      icon: '🌐',  color: '#c084fc', bg: 'rgba(168,85,247,0.15)',  border: '#a855f7' },
  patch_panel: { label: 'Patch Panel', icon: '🔌',  color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: '#f59e0b' },
  ups:         { label: 'UPS',         icon: '⚡',  color: '#fb923c', bg: 'rgba(249,115,22,0.15)',  border: '#f97316' },
  kvm:         { label: 'KVM',         icon: '🖱️',  color: '#f472b6', bg: 'rgba(236,72,153,0.15)', border: '#ec4899' },
};

export const PORT_DEVICE_META: Record<PortDeviceType, { label: string; icon: string; color: string }> = {
  camera:       { label: 'Camera',       icon: '📷', color: '#f87171' },
  access_point: { label: 'Access Point', icon: '📡', color: '#34d399' },
  data:         { label: 'Data',         icon: '💻', color: '#60a5fa' },
  server:       { label: 'Server',       icon: '🖥️', color: '#a78bfa' },
  printer:      { label: 'Printer',      icon: '🖨️', color: '#fbbf24' },
  voip:         { label: 'VoIP',         icon: '📞', color: '#22d3ee' },
  other:        { label: 'Other',        icon: '🔧', color: '#9ca3af' },
  '':           { label: 'Unassigned',   icon: '—',  color: '#4b5563' },
};

export const PORT_STATUS_COLORS: Record<PortStatus, { bg: string; border: string; dot: string; label: string }> = {
  active:   { bg: 'rgba(16,185,129,0.2)',  border: '#10b981', dot: '#10b981', label: 'Active'   },
  inactive: { bg: 'rgba(75,85,99,0.3)',    border: '#374151', dot: '#6b7280', label: 'Inactive' },
  error:    { bg: 'rgba(239,68,68,0.2)',   border: '#ef4444', dot: '#ef4444', label: 'Error'    },
};

export const ALERT_META: Record<AlertType, { icon: string; color: string; bg: string; border: string }> = {
  device_down:       { icon: '🔴', color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)' },
  port_inactive:     { icon: '🟠', color: '#fb923c', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.35)' },
  temperature_high:  { icon: '🌡️', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.35)' },
  rack_full:         { icon: '📦', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)' },
  ups_battery_low:   { icon: '⚡', color: '#facc15', bg: 'rgba(250,204,21,0.1)', border: 'rgba(250,204,21,0.35)' },
  warranty_expiring: { icon: '📋', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.35)' },
  amc_expiring:      { icon: '📄', color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.35)' },
  custom:            { icon: '⚠️', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.35)' },
};

export const PRIORITY_META: Record<AlertPriority, { label: string; color: string; dot: string }> = {
  high:   { label: 'High', color: '#f87171', dot: '#ef4444' },
  medium: { label: 'Medium', color: '#fbbf24', dot: '#f59e0b' },
  low:    { label: 'Low', color: '#6ee7b7', dot: '#10b981' },
};

export * from './discoveryTypes';
