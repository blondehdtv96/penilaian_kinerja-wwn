'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { operatorAPI, recordsAPI } from '@/lib/api';

function FormPage({ title, fields, apiGet, apiCreate }: { title: string; fields: { name: string; label: string; type?: string }[]; apiGet: Function; apiCreate: Function }) {
  const { checkAuth } = useAuthStore();
  const [operators, setOperators] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAuth();
    operatorAPI.getAll().then(r => setOperators(r.data.data)).catch(console.error);
  }, [checkAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCreate({ ...form, operatorId: Number(form.operatorId) });
      setSuccess('Record created successfully');
    } catch (err: any) { setSuccess('Error: ' + (err.response?.data?.message || 'Failed')); }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg">{success}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Operator</label>
            <select value={form.operatorId || ''} onChange={e => setForm({ ...form, operatorId: e.target.value })} className="w-full border rounded-lg p-2.5" required>
              <option value="">Select operator</option>
              {operators.map(o => <option key={o.id} value={o.id}>{o.user.fullName} ({o.employeeId})</option>)}
            </select>
          </div>
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              {f.type === 'textarea'
                ? <textarea value={form[f.name] || ''} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className="w-full border rounded-lg p-2.5 h-20" required />
                : f.type === 'number'
                ? <input type="number" value={form[f.name] || ''} onChange={e => setForm({ ...form, [f.name]: Number(e.target.value) })} className="w-full border rounded-lg p-2.5" required />
                : <input value={form[f.name] || ''} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className="w-full border rounded-lg p-2.5" required />
              }
            </div>
          ))}
          <button type="submit" className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700">Submit</button>
        </form>
      </div>
    </Sidebar>
  );
}

export default function CounselingPage() {
  return <FormPage
    title="Input Counseling"
    apiGet={recordsAPI.getCounselings}
    apiCreate={recordsAPI.createCounseling}
    fields={[{ name: 'topic', label: 'Topic' }, { name: 'notes', label: 'Notes', type: 'textarea' }]}
  />;
}
