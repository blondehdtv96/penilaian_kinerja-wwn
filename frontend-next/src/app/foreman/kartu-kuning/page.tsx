'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { operatorAPI, recordsAPI } from '@/lib/api';

export default function KartuKuningPage() {
  const { checkAuth } = useAuthStore();
  const [operators, setOperators] = useState<any[]>([]);
  const [form, setForm] = useState({ operatorId: '', reason: '' });
  const [success, setSuccess] = useState('');

  useEffect(() => { checkAuth(); operatorAPI.getAll().then(r => setOperators(r.data.data)).catch(console.error); }, [checkAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recordsAPI.createKartuKuning({ ...form, operatorId: Number(form.operatorId) });
      setSuccess('Kartu Kuning issued successfully');
    } catch (err: any) { setSuccess('Error: ' + (err.response?.data?.message || 'Failed')); }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Kartu Kuning</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg">{success}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Operator</label>
            <select value={form.operatorId} onChange={e => setForm({ ...form, operatorId: e.target.value })} className="w-full border rounded-lg p-2.5" required>
              <option value="">Select operator</option>
              {operators.map((o: any) => <option key={o.id} value={o.id}>{o.user.fullName} ({o.employeeId})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full border rounded-lg p-2.5 h-24" required />
          </div>
          <button type="submit" className="bg-amber-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-600">Issue Kartu Kuning</button>
        </form>
      </div>
    </Sidebar>
  );
}
