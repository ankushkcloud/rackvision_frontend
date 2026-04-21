'use client';
// ─── FILE: frontend/src/app/dashboard/audit/page.tsx ─────────────────────────
// Create folder: frontend/src/app/dashboard/audit/
// Create file:   frontend/src/app/dashboard/audit/page.tsx
import AuditLogTable from '@/components/audit/AuditLogTable';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api';

export default function AuditPage() {
  const { data } = useQuery({
    queryKey: ['audit', 'summary'],
    queryFn:  () => auditApi.list({ limit: 1 }).then(r => r.data),
  });

  return (
    <div className="p-7 max-w-4xl">
      <div className="mb-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600/20 border border-amber-700/40 rounded-xl flex items-center justify-center">
            <span className="text-lg">📜</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Audit Log</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Complete history of all actions — {data?.total || 0} total entries
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-900/10 border border-blue-800/30 rounded-xl px-4 py-3 mb-6">
        <span className="text-blue-400 text-sm mt-0.5">ℹ</span>
        <p className="text-xs text-blue-300/70 leading-relaxed">
          Every device add, edit, delete, port update, export, and alert action is tracked automatically.
          Audit logs are stored securely and cannot be modified.
        </p>
      </div>

      <div className="card p-5">
        <AuditLogTable />
      </div>
    </div>
  );
}
