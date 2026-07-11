'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { operatorAPI, recordsAPI, escalationConfigAPI } from '@/lib/api';

export default function KartuKuningPage() {
  const { checkAuth } = useAuthStore();
  const [operators, setOperators] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any>(null);
  const [form, setForm] = useState({ operatorId: '', reason: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
    operatorAPI.getAll().then(r => setOperators(r.data.data)).catch(console.error);
    escalationConfigAPI.getActive().then(r => setThresholds(r.data.data)).catch(console.error);
  }, [checkAuth]);

  const selectedOperator = operators.find(o => String(o.id) === form.operatorId);
  const isBelowThreshold =
    selectedOperator && thresholds && selectedOperator.accumulatedPoints < thresholds.kartuKuning;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(''); setError('');
    try {
      const res = await recordsAPI.createKartuKuning({ ...form, operatorId: Number(form.operatorId) });
      setSuccess(
        res.data?.data?.isManualOverride
          ? 'Kartu Kuning diterbitkan sebagai manual override (poin operator masih di bawah ambang batas).'
          : 'Kartu Kuning berhasil diterbitkan.'
      );
      setForm({ operatorId: '', reason: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Kartu Kuning</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg">{success}</div>}
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Operator</label>
            <select value={form.operatorId} onChange={e => setForm({ ...form, operatorId: e.target.value })} className="w-full border rounded-lg p-2.5" required>
              <option value="">Pilih operator</option>
              {operators.map((o: any) => <option key={o.id} value={o.id}>{o.user.fullName} ({o.employeeId})</option>)}
            </select>
            {selectedOperator && thresholds && (
              <p className={`text-xs mt-1 ${isBelowThreshold ? 'text-amber-600' : 'text-slate-500'}`}>
                Poin akumulasi: <span className="font-semibold">{selectedOperator.accumulatedPoints ?? 0}</span>
                {' '}(ambang batas Kartu Kuning: {thresholds.kartuKuning})
                {isBelowThreshold && ' — penerbitan ini akan dicatat sebagai manual override.'}
              </p>
            )}
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
