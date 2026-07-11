'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { operatorAPI, recordsAPI, escalationConfigAPI } from '@/lib/api';

export default function SuratPeringatanPage() {
  const { checkAuth } = useAuthStore();
  const [operators, setOperators] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any>(null);
  const [issuedLevels, setIssuedLevels] = useState<number[]>([]);
  const [form, setForm] = useState({ operatorId: '', level: 1, reason: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
    operatorAPI.getAll().then(r => setOperators(r.data.data)).catch(console.error);
    escalationConfigAPI.getActive().then(r => setThresholds(r.data.data)).catch(console.error);
  }, [checkAuth]);

  // Saat operator dipilih, ambil SP yang sudah pernah diterbitkan agar level
  // berikutnya bisa disarankan dan mencegah pelanggaran urutan/duplikasi (R6.2, R6.7).
  useEffect(() => {
    if (!form.operatorId) { setIssuedLevels([]); return; }
    recordsAPI.getSuratPeringatan({ operatorId: form.operatorId })
      .then(r => {
        const levels = r.data.data.map((sp: any) => sp.level);
        setIssuedLevels(levels);
        const nextLevel = [1, 2, 3].find(l => !levels.includes(l)) || 3;
        setForm(f => ({ ...f, level: nextLevel }));
      })
      .catch(console.error);
  }, [form.operatorId]);

  const selectedOperator = operators.find(o => String(o.id) === form.operatorId);
  const levelThresholdKey = form.level === 1 ? 'sp1' : form.level === 2 ? 'sp2' : 'sp3';
  const isBelowThreshold =
    selectedOperator && thresholds && selectedOperator.accumulatedPoints < thresholds[levelThresholdKey];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(''); setError('');
    try {
      const res = await recordsAPI.createSuratPeringatan({ ...form, operatorId: Number(form.operatorId), level: Number(form.level) });
      setSuccess(
        res.data?.data?.isManualOverride
          ? 'Surat Peringatan diterbitkan sebagai manual override (poin operator masih di bawah ambang batas).'
          : 'Surat Peringatan berhasil diterbitkan.'
      );
      setForm({ operatorId: '', level: 1, reason: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Surat Peringatan</h1>
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
            {selectedOperator && issuedLevels.length > 0 && (
              <p className="text-xs text-slate-500 mt-1">SP yang sudah diterbitkan: {issuedLevels.sort().join(', ')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Level</label>
            <select value={form.level} onChange={e => setForm({ ...form, level: Number(e.target.value) })} className="w-full border rounded-lg p-2.5">
              <option value={1} disabled={issuedLevels.includes(1)}>SP 1 - First Warning</option>
              <option value={2} disabled={issuedLevels.includes(2) || !issuedLevels.includes(1)}>SP 2 - Second Warning</option>
              <option value={3} disabled={issuedLevels.includes(3) || !issuedLevels.includes(2)}>SP 3 - Final Warning</option>
            </select>
            {selectedOperator && thresholds && (
              <p className={`text-xs mt-1 ${isBelowThreshold ? 'text-amber-600' : 'text-slate-500'}`}>
                Poin akumulasi: <span className="font-semibold">{selectedOperator.accumulatedPoints ?? 0}</span>
                {' '}(ambang batas SP{form.level}: {thresholds[levelThresholdKey]})
                {isBelowThreshold && ' — penerbitan ini akan dicatat sebagai manual override.'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full border rounded-lg p-2.5 h-24" required />
          </div>
          <button type="submit" className="bg-rose-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-rose-700">Issue Surat Peringatan</button>
        </form>
      </div>
    </Sidebar>
  );
}
