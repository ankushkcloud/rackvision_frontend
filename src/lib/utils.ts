import { DEVICE_META, DeviceType } from '@/types';

export const deviceColor  = (t: DeviceType) => DEVICE_META[t]?.color  ?? '#9ca3af';
export const deviceBg     = (t: DeviceType) => DEVICE_META[t]?.bg     ?? 'rgba(156,163,175,0.1)';
export const deviceBorder = (t: DeviceType) => DEVICE_META[t]?.border ?? '#4b5563';
export const deviceLabel  = (t: DeviceType) => DEVICE_META[t]?.label  ?? t;
export const deviceIcon   = (t: DeviceType) => DEVICE_META[t]?.icon   ?? '📦';

export const shortType: Record<DeviceType, string> = {
  server:'SRV', switch:'SW', storage:'STO', firewall:'FW',
  router:'RTR', patch_panel:'PP', ups:'UPS', kvm:'KVM',
};

export function timeAgo(d: string): string {
  const ms = Date.now() - new Date(d).getTime();
  const m  = Math.floor(ms / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function utilColor(pct: number): string {
  if (pct >= 90) return '#ef4444';
  if (pct >= 75) return '#f59e0b';
  if (pct >= 50) return '#3b82f6';
  return '#10b981';
}

// Get all U slots occupied by a device
export function deviceSlots(uStart: number, uSize: number): number[] {
  return Array.from({ length: uSize }, (_, i) => uStart + i);
}
