'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { vooAPI } from '@/lib/api';

export default function FinalApprovePage() {
  const { checkAuth } = useAuthStore();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [points, setPoints] = useState<Record<number, number>>({});

  const load = () => { vooAPI.getAll({ status: 'approved_foreman' }).then(r => setSubmissions(r.data.data)).catch(console.error); };
  useEffect(() => { checkAuth(); load(); }, [checkAuth]);

  const handleAction = async (id: number, action: string) => {
    try {
      await vooAPI.approveManager(id, { action, points: points[id] || 10 });
      load();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Final Approval</h1>
      <div className="space-y-3">
        {submissions.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-medium">{s.title}</h3>
            <p className="text-sm text-slate-500">{s.type} - {s.operator?.user?.fullName} ({s.operator?.employeeId})</p>
            <p className="text-sm text-slate-400 mt-1">{s.description}</p>
            <div className="flex items-center gap-3 mt-3">
              <label className="text-sm">Points:</label>
              <input type="number" value={points[s.id] || 10} onChange={e => setPoints({ ...points, [s.id]: Number(e.target.value) })} className="w-20 border rounded p-1 text-sm" />
              <button onClick={() => handleAction(s.id, 'approve_final')} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm">Approve</button>
              <button onClick={() => handleAction(s.id, 'reject')} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm">Reject</button>
            </div>
          </div>
        ))}
        {submissions.length === 0 && <p className="text-slate-400 text-center py-8">No submissions awaiting final approval</p>}
      </div>
    </Sidebar>
  );
}
