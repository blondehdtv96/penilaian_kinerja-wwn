'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { vooAPI } from '@/lib/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved_foreman: 'bg-blue-100 text-blue-700',
  approved_final: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ApprovePage() {
  const { checkAuth } = useAuthStore();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    vooAPI.getAll({ status: 'pending' }).then(r => setSubmissions(r.data.data)).catch(console.error);
  };

  useEffect(() => { checkAuth(); load(); }, [checkAuth]);

  const handleAction = async (id: number, action: string) => {
    setLoading(true);
    try {
      await vooAPI.approveForeman(id, { action });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Approve VoO Submissions</h1>
      <div className="space-y-3">
        {submissions.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.type} by {s.submittedBy?.fullName || s.operator?.user?.fullName}</p>
                <p className="text-sm text-slate-400 mt-1">{s.description}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(s.createdAt).toLocaleString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[s.status]}`}>
                {s.status.replace('_', ' ')}
              </span>
            </div>
            {s.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleAction(s.id, 'approve_foreman')} disabled={loading}
                  className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                  Approve
                </button>
                <button onClick={() => handleAction(s.id, 'reject')} disabled={loading}
                  className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
        {submissions.length === 0 && <p className="text-slate-400 text-center py-8">No pending submissions</p>}
      </div>
    </Sidebar>
  );
}
