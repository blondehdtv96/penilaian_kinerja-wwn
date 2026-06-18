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

export default function MySubmissionsPage() {
  const { checkAuth } = useAuthStore();
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    vooAPI.mySubmissions().then(r => setSubmissions(r.data.data)).catch(console.error);
  }, [checkAuth]);

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">My Submissions</h1>
      <div className="space-y-3">
        {submissions.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-medium">{s.title}</h3>
              <p className="text-sm text-slate-500">{s.type} - {new Date(s.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-slate-400 mt-1">{s.description.slice(0, 80)}...</p>
            </div>
            <div className="flex items-center gap-3">
              {s.points > 0 && <span className="text-sm font-medium text-primary-600">{s.points} pts</span>}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[s.status] || 'bg-slate-100'}`}>
                {s.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
        {submissions.length === 0 && <p className="text-slate-400 text-center py-8">No submissions yet</p>}
      </div>
    </Sidebar>
  );
}
