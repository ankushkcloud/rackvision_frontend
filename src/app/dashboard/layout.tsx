'use client';

import { useState } from 'react';
import AuthGuard from '@/components/ui/AuthGuard';
import Sidebar from '@/components/ui/Sidebar';
import { useAuth } from '@/lib/authStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef6ff_48%,#f8fbff_100%)]">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="lg:ml-72 min-h-screen">
          <header className="sticky top-0 z-20 border-b border-sky-100/80 bg-white/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOpen(true)}
                  className="rounded-2xl border border-sky-100 bg-white p-2 text-slate-600 shadow-sm lg:hidden"
                >
                  ☰
                </button>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user?.companyName || 'RackVision'}</p>
                  <p className="text-xs text-slate-500">Unified rack operations and monitoring</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs text-slate-500">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Live monitoring ready
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
