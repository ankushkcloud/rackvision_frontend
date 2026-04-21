'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authStore';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api';
import clsx from 'clsx';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const NAV = [
  {
    group: 'Overview',
    items: [
      { href: '/dashboard', label: 'Command Center', minRole: 'viewer', icon: 'M4 6h16M4 12h16M4 18h10' },
      { href: '/dashboard/create', label: 'New Rack', minRole: 'engineer', icon: 'M12 4v16m8-8H4' },
      { href: '/dashboard/analytics', label: 'Analytics', minRole: 'viewer', icon: 'M5 12h3v7H5zm5-7h3v14h-3zm5 4h3v10h-3z' },
      { href: '/dashboard/sla', label: 'SLA & Compliance', minRole: 'viewer', icon: 'M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { href: '/dashboard/alerts', label: 'Alerts', minRole: 'viewer', icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h5', badge: true },
      { href: '/dashboard/discovery', label: 'Auto Discovery', minRole: 'engineer', icon: 'M21 21l-4.4-4.4M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z' },
      { href: '/dashboard/tickets', label: 'Maintenance Tickets', minRole: 'engineer', icon: 'M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12l-3-2-3 2-3-2-3 2V6a2 2 0 012-2z' },
      { href: '/dashboard/support', label: 'Support Desk', minRole: 'viewer', icon: 'M18 10c0-3.3-2.7-6-6-6S6 6.7 6 10v4H4v2h4v-6a4 4 0 118 0v6h4v-2h-2v-4z' },
      { href: '/dashboard/reports', label: 'Scheduled Reports', minRole: 'admin', icon: 'M8 7h8m-8 4h8m-8 4h5M6 3h9l3 3v15a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z' },
      { href: '/dashboard/audit', label: 'Audit Log', minRole: 'viewer', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2' },
    ],
  },
  {
    group: 'Admin',
    items: [
      { href: '/dashboard/settings', label: 'Branding & Access', minRole: 'admin', icon: 'M11.3 1.05l1.4 0 0.6 2.2c0.3.1.6.2.9.4l2.1-1 1 1-1 2.1c.2.3.3.6.4.9l2.2.6v1.4l-2.2.6c-.1.3-.2.6-.4.9l1 2.1-1 1-2.1-1c-.3.2-.6.3-.9.4l-.6 2.2h-1.4l-.6-2.2c-.3-.1-.6-.2-.9-.4l-2.1 1-1-1 1-2.1a4 4 0 01-.4-.9L1 9.35v-1.4l2.2-.6c.1-.3.2-.6.4-.9l-1-2.1 1-1 2.1 1c.3-.2.6-.3.9-.4z' },
    ],
  },
];

const ROLE_WEIGHT = {
  viewer: 1,
  client: 2,
  engineer: 3,
  admin: 4,
  super_admin: 5,
};

export default function Sidebar({ open = true, onClose }: SidebarProps) {
  const path = usePathname();
  const { user, logout } = useAuth();

  const { data: alertData } = useQuery({
    queryKey: ['alerts', 'badge'],
    queryFn: () => alertsApi.list({ status: 'active', limit: 1 }).then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const alertCount = alertData ? (alertData.counts?.high || 0) + (alertData.counts?.medium || 0) + (alertData.counts?.low || 0) : 0;
  const currentRole = user?.role || 'viewer';

  return (
    <>
      <div
        className={clsx('fixed inset-0 bg-slate-950/35 backdrop-blur-sm z-30 lg:hidden transition-opacity', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={onClose}
      />
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-[280px] border-r border-sky-200/70 bg-white/95 backdrop-blur-xl z-40 transition-transform duration-300 lg:translate-x-0 lg:w-72',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="px-5 py-5 border-b border-sky-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-300 shadow-lg shadow-sky-200 flex items-center justify-center text-white font-bold">
                  RV
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{user?.companyName || 'RackVision'}</p>
                  <p className="text-[11px] tracking-[0.28em] uppercase text-sky-600">Enterprise Ops</p>
                </div>
              </div>
              <button onClick={onClose} className="lg:hidden rounded-xl p-2 text-slate-400 hover:bg-sky-50 hover:text-slate-700">
                ✕
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            {NAV.map(section => {
              const items = section.items.filter(item => (ROLE_WEIGHT[currentRole] || 0) >= (ROLE_WEIGHT[item.minRole as keyof typeof ROLE_WEIGHT] || 0));
              if (!items.length) return null;

              return (
                <div key={section.group}>
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-500 mb-2">{section.group}</p>
                  <div className="space-y-1.5">
                    {items.map(item => {
                      const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={clsx(
                            'group flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-medium transition-all',
                            active
                              ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-sky-100'
                              : 'text-slate-600 hover:bg-sky-50 hover:text-slate-900'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={item.icon} />
                            </svg>
                            <span>{item.label}</span>
                          </div>
                          {item.badge && alertCount > 0 && (
                            <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-bold', active ? 'bg-white/20 text-white' : 'bg-red-500 text-white')}>
                              {alertCount > 9 ? '9+' : alertCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-sky-100 px-4 py-4">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-3.5 py-3">
              <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
                {currentRole.replace('_', ' ')}
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-sky-100 bg-white px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
