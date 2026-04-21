'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { warrantyApi } from '@/lib/api';
import { Warranty } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  deviceId: string;
  deviceName: string;
}

export default function WarrantyCard({ deviceId, deviceName }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Warranty>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['warranty', deviceId],
    queryFn: () => warrantyApi.get(deviceId).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (payload: object) => warrantyApi.upsert(deviceId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warranty', deviceId] });
      toast.success('Warranty details saved');
      setEditing(false);
    },
    onError: () => toast.error('Warranty update failed'),
  });

  const warranty: Warranty | null = data?.warranty || null;

  const openEdit = () => {
    setForm({
      vendorName: warranty?.vendorName || '',
      vendorEmail: warranty?.vendorEmail || '',
      vendorPhone: warranty?.vendorPhone || '',
      invoiceNumber: warranty?.invoiceNumber || '',
      warrantyType: warranty?.warrantyType || '',
      warrantyEndDate: warranty?.warrantyEndDate || '',
      amcVendor: warranty?.amcVendor || '',
      amcEndDate: warranty?.amcEndDate || '',
      notes: warranty?.notes || '',
    });
    setEditing(true);
  };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">Warranty & AMC</p>
          <p className="text-[10px] text-gray-600">Coverage details for {deviceName}</p>
        </div>
        <button onClick={openEdit} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Edit</button>
      </div>

      {isLoading ? (
        <p className="text-xs text-gray-500">Loading warranty details...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <InfoTile label="Warranty Ends" value={formatDate(warranty?.warrantyEndDate)} />
            <InfoTile label="AMC Ends" value={formatDate(warranty?.amcEndDate)} />
            <InfoTile label="Vendor" value={warranty?.vendorName || 'Not set'} />
            <InfoTile label="Invoice" value={warranty?.invoiceNumber || 'Not set'} />
          </div>

          {warranty?.notes && (
            <p className="text-[10px] text-gray-400 bg-gray-900/60 border border-gray-800 rounded-lg p-3">{warranty.notes}</p>
          )}

          {!warranty && (
            <p className="text-[10px] text-gray-600 text-center py-2">No warranty data yet. Click Edit to add it.</p>
          )}
        </>
      )}

      {editing && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setEditing(false)}>
          <div className="bg-[#0f1117] border border-gray-800 rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h3 className="font-bold text-white text-sm">Warranty Details</h3>
              <button onClick={() => setEditing(false)} className="text-gray-600 hover:text-gray-300">x</button>
            </div>
            <div className="p-5 space-y-3">
              <Field label="Vendor Name" value={form.vendorName || ''} onChange={value => setForm({ ...form, vendorName: value })} />
              <Field label="Vendor Email" value={form.vendorEmail || ''} onChange={value => setForm({ ...form, vendorEmail: value })} />
              <Field label="Vendor Phone" value={form.vendorPhone || ''} onChange={value => setForm({ ...form, vendorPhone: value })} />
              <Field label="Invoice Number" value={form.invoiceNumber || ''} onChange={value => setForm({ ...form, invoiceNumber: value })} />
              <Field label="Warranty Type" value={form.warrantyType || ''} onChange={value => setForm({ ...form, warrantyType: value })} />
              <DateField label="Warranty End Date" value={form.warrantyEndDate || ''} onChange={value => setForm({ ...form, warrantyEndDate: value })} />
              <Field label="AMC Vendor" value={form.amcVendor || ''} onChange={value => setForm({ ...form, amcVendor: value })} />
              <DateField label="AMC End Date" value={form.amcEndDate || ''} onChange={value => setForm({ ...form, amcEndDate: value })} />
              <div>
                <label className="label">Notes</label>
                <textarea className="field text-xs resize-none" rows={3} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditing(false)} className="btn-ghost flex-1 text-xs py-2">Cancel</button>
                <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="btn-blue flex-1 text-xs py-2">
                  {mutation.isPending ? 'Saving...' : 'Save Warranty'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : 'Not set';
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-3">
      <p className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-semibold text-gray-200 mt-1">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="field text-xs" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="date"
        className="field text-xs"
        value={value ? new Date(value).toISOString().split('T')[0] : ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
