'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { recordsAPI } from '@/lib/api';

export default function CounselingPage() {
  const { checkAuth } = useAuthStore();
  const [misconducts, setMisconducts] = useState<any[]>([]);
  const [form, setForm] = useState({ misconductId: '', topic: '', notes: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const refresh = () => {
    // Konseling hanya boleh dibuat dari pelanggaran yang sudah tercatat dan
    // belum memiliki sesi konseling (R3.1, R3.2).
    recordsAPI.getMisconducts({ counselingStatus: 'pending' })
      .then(r => setMisconducts(r.data.data))
      .catch(console.error);
  };

  useEffect(() => { checkAuth(); refresh(); }, [checkAuth]);

  const selectedMisconduct = misconducts.find(m => String(m.id) === form.misconductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(''); setError('');
    try {
      await recordsAPI.createCounseling({
        misconductId: Number(form.misconductId),
        topic: form.topic,
        notes: form.notes,
      });
      setSuccess('Sesi konseling tercatat dan terhubung ke pelanggaran.');
      setForm({ misconductId: '', topic: '', notes: '' });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Input Konseling</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg">{success}</div>}
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Pelanggaran</label>
            <select
              value={form.misconductId}
              onChange={e => setForm({ ...form, misconductId: e.target.value })}
              className="w-full border rounded-lg p-2.5"
              required
            >
              <option value="">Pilih pelanggaran (yang belum ada konseling)</option>
              {misconducts.map(m => (
                <option key={m.id} value={m.id}>
                  {m.operator?.user?.fullName} — {m.type} ({new Date(m.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
            {misconducts.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Tidak ada pelanggaran yang menunggu konseling. Input pelanggaran terlebih dahulu di menu Input Pelanggaran.
              </p>
            )}
            {selectedMisconduct && (
              <p className="text-xs text-slate-500 mt-1">
                Operator: <span className="font-semibold">{selectedMisconduct.operator?.user?.fullName}</span> (otomatis terisi dari pelanggaran)
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Topik</label>
            <input
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
              className="w-full border rounded-lg p-2.5"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Catatan</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-lg p-2.5 h-20"
              required
            />
          </div>
          <button type="submit" className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700">
            Submit
          </button>
        </form>
      </div>
    </Sidebar>
  );
}
