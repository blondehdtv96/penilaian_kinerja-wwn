'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { operatorAPI, recordsAPI } from '@/lib/api';

export default function MisconductPage() {
  const { checkAuth } = useAuthStore();
  const [operators, setOperators] = useState<any[]>([]);
  const [form, setForm] = useState({ operatorId: '', type: 'Late Arrival', severity: 'low', description: '', points: 5 });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    operatorAPI.getAll().then(r => setOperators(r.data.data)).catch(console.error);
    recordsAPI.getMisconducts().then(r => setRecords(r.data.data)).catch(console.error);
  }, [checkAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(''); setError('');
    try {
      await recordsAPI.createMisconduct({ ...form, operatorId: Number(form.operatorId) });
      setSuccess('Misconduct recorded');
      recordsAPI.getMisconducts().then(r => setRecords(r.data.data));
    } catch (err: any) { setError(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Input Misconduct</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg">{success}</div>}
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">Operator</label>
              <select value={form.operatorId} onChange={e => setForm({ ...form, operatorId: e.target.value })} className="w-full border rounded-lg p-2.5" required>
                <option value="">Select operator</option>
                {operators.map(o => <option key={o.id} value={o.id}>{o.user.fullName} ({o.employeeId})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg p-2.5">
                <option>Late Arrival</option><option>Safety Violation</option><option>Absent Without Notice</option><option>Quality Issue</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} className="w-full border rounded-lg p-2.5">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg p-2.5 h-20" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Points Deduction</label>
              <input type="number" value={form.points} onChange={e => setForm({ ...form, points: Number(e.target.value) })} className="w-full border rounded-lg p-2.5" />
            </div>
            <button type="submit" className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700">Submit</button>
          </form>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Recent Misconducts</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {records.slice(0, 10).map(r => (
              <div key={r.id} className="p-2 border rounded-lg text-sm">
                <p className="font-medium">{r.type}</p>
                <p className="text-slate-500">{r.operator?.user?.fullName} - {r.severity}</p>
                <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
