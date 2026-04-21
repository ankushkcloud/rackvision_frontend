'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { backupApi, settingsApi, usersApi } from '@/lib/api';
import { BackupSnapshot, BrandingSettings, User } from '@/types';
import { useAuth } from '@/lib/authStore';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: brandingData } = useQuery({
    queryKey: ['settings', 'branding'],
    queryFn: () => settingsApi.branding().then(r => r.data),
  });
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data),
    enabled: ['admin', 'super_admin'].includes(user?.role || ''),
  });
  const { data: backupsData } = useQuery({
    queryKey: ['backups'],
    queryFn: () => backupApi.list().then(r => r.data),
  });

  const initialBranding = brandingData?.settings as BrandingSettings | undefined;
  const [form, setForm] = useState({
    companyName: '',
    companyLogoUrl: '',
    accentColor: '#2563eb',
    dashboardTitle: '',
    reportFooter: '',
  });

  const mergedForm = useMemo(() => ({
    companyName: form.companyName || initialBranding?.companyName || '',
    companyLogoUrl: form.companyLogoUrl || initialBranding?.companyLogoUrl || '',
    accentColor: form.accentColor || initialBranding?.accentColor || '#2563eb',
    dashboardTitle: form.dashboardTitle || initialBranding?.dashboardTitle || '',
    reportFooter: form.reportFooter || initialBranding?.reportFooter || '',
  }), [form, initialBranding]);

  const brandingMutation = useMutation({
    mutationFn: () => settingsApi.updateBranding(mergedForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'branding'] });
      toast.success('Branding updated');
    },
  });

  const backupMutation = useMutation({
    mutationFn: () => backupApi.create({ name: `Manual backup ${new Date().toLocaleString()}` }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backups'] });
      toast.success('Backup created');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => backupApi.restore(id),
    onSuccess: () => toast.success('Backup restored'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: User['role'] }) => usersApi.update(id, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated');
    },
  });

  const users: User[] = usersData?.users || [];
  const backups: BackupSnapshot[] = backupsData?.backups || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,1.1fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h1 className="text-3xl font-bold text-slate-900">Branding & White Label</h1>
            <p className="mt-2 text-sm text-slate-500">Customize the dashboard and reports for client-ready delivery.</p>
            <div className="mt-6 space-y-4">
              <FormField label="Company Name" value={mergedForm.companyName} onChange={value => setForm(current => ({ ...current, companyName: value }))} />
              <FormField label="Company Logo URL" value={mergedForm.companyLogoUrl} onChange={value => setForm(current => ({ ...current, companyLogoUrl: value }))} />
              <FormField label="Accent Color" value={mergedForm.accentColor} onChange={value => setForm(current => ({ ...current, accentColor: value }))} />
              <FormField label="Dashboard Title" value={mergedForm.dashboardTitle} onChange={value => setForm(current => ({ ...current, dashboardTitle: value }))} />
              <FormField label="Report Footer" value={mergedForm.reportFooter} onChange={value => setForm(current => ({ ...current, reportFooter: value }))} />
              <button className="btn-blue w-full" onClick={() => brandingMutation.mutate()} disabled={brandingMutation.isPending}>
                {brandingMutation.isPending ? 'Saving...' : 'Save branding settings'}
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Backup & Restore</h2>
                <p className="text-sm text-slate-500">Create point-in-time snapshots of your operational data.</p>
              </div>
              <button className="btn-blue" onClick={() => backupMutation.mutate()} disabled={backupMutation.isPending}>
                Create Backup
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {backups.map(backup => (
                <div key={backup._id} className="rounded-[24px] border border-sky-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{backup.name}</p>
                      <p className="text-sm text-slate-500">{backup.summary.racks} racks • {backup.summary.devices} devices • {backup.summary.tickets} tickets</p>
                    </div>
                    <button className="btn-ghost px-3 py-2 text-xs" onClick={() => restoreMutation.mutate(backup._id)}>
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900">User Role Management</h2>
          <p className="mt-2 text-sm text-slate-500">Assign access levels for super admins, admins, engineers, viewers, and client users.</p>
          <div className="mt-5 space-y-4">
            {users.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/60 px-6 py-12 text-center text-sm text-slate-500">
                No users available or you do not have admin access.
              </div>
            ) : users.map(member => (
              <div key={member.id} className="rounded-[24px] border border-sky-100 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </div>
                  <select
                    className="field max-w-[220px]"
                    value={member.role}
                    onChange={e => roleMutation.mutate({ id: member.id, role: e.target.value as User['role'] })}
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="engineer">Engineer</option>
                    <option value="viewer">Viewer</option>
                    <option value="client">Client</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="field" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
