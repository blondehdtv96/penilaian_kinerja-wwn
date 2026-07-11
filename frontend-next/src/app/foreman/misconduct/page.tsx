'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { operatorAPI, recordsAPI, violationTypeAPI } from '@/lib/api';

export default function MisconductPage() {
  const { checkAuth } = useAuthStore();
  const [operators, setOperators] = useState<any[]>([]);
  const [violationTypes, setViolationTypes] = useState<any[]>([]);
  const [form, setForm] = useState({ operatorId: '', violationTypeId: '', description: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [records, setRecords] = useState<any[]>([]);

  const refresh = () => {
    operatorAPI.getAll().then(r => setOperators(r.data.data)).catch(console.error);
    recordsAPI.getMisconducts().then(r => setRecords(r.data.data)).catch(console.error);
  };

  useEffect(() => {
    checkAuth();
    refresh();
    violationTypeAPI.getAll().then(r => setViolationTypes(r.data.data)).catch(console.error);
  }, [checkAuth]);

  const selectedOperator = operators.find(o => String(o.id) === form.operatorId);
  const selectedType = violationTypes.find(v => String(v.id) === form.violationTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(''); setError('');
    try {
      await recordsAPI.createMisconduct({
        operatorId: Number(form.operatorId),
        violationTypeId: Number(form.violationTypeId),
        description: form.description,
      });
      setSuccess('Pelanggaran tercatat. Poin akumulasi operator telah diperbarui.');
      setForm({ operatorId: '', violationTypeId: '', description: '' });
      refresh();
    } catch (err: any) { setError(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Input Pelanggaran</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg">{success}</div>}
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">Operator</label>
              <select value={form.operatorId} onChange={e => setForm({ ...form, operatorId: e.target.value })} className="w-full border rounded-lg p-2.5" required>
                <option value="">Pilih operator</option>
                {operators.map(o => <option key={o.id} value={o.id}>{o.user.fullName} ({o.employeeId})</option>)}
              </select>
              {selectedOperator && (
                <p className="text-xs text-slate-500 mt-1">
                  Poin akumulasi saat ini: <span className="font-semibold">{selectedOperator.accumulatedPoints ?? 0}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jenis Pelanggaran</label>
              <select value={form.violationTypeId} onChange={e => setForm({ ...form, violationTypeId: e.target.value })} className="w-full border rounded-lg p-2.5" required>
                <option value="">Pilih jenis pelanggaran</option>
                {violationTypes.map(v => <option key={v.id} value={v.id}>{v.name} — {v.points} poin ({v.severity})</option>)}
              </select>
              {selectedType && (
                <p className="text-xs text-slate-500 mt-1">
                  Kategori: {selectedType.category} · Poin akan ditambahkan: <span className="font-semibold">{selectedType.points}</span>
                </p>
              )}
              {violationTypes.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Belum ada jenis pelanggaran di katalog. Minta Section Manager menambahkannya.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg p-2.5 h-20" required />
            </div>
            <button type="submit" className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700">Submit</button>
          </form>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Pelanggaran Terbaru</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {records.slice(0, 10).map(r => (
              <div key={r.id} className="p-2 border rounded-lg text-sm">
                <p className="font-medium">{r.type} <span className="text-slate-400">({r.points} poin)</span></p>
                <p className="text-slate-500">{r.operator?.user?.fullName} - {r.severity}</p>
                <p className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                  {r.counseling ? ' · Konseling sudah dibuat' : ' · Belum ada konseling'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
