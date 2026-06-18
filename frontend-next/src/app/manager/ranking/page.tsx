'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { operatorAPI } from '@/lib/api';

export default function RankingPage() {
  const { checkAuth } = useAuthStore();
  const [operators, setOperators] = useState<any[]>([]);
  const [section, setSection] = useState('');

  useEffect(() => {
    checkAuth();
    operatorAPI.ranking(section || undefined).then(r => setOperators(r.data.data)).catch(console.error);
  }, [checkAuth, section]);

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Operator Ranking</h1>
      <div className="mb-4">
        <select value={section} onChange={e => setSection(e.target.value)} className="border rounded-lg p-2">
          <option value="">All Sections</option>
          <option>Bantrac</option><option>TBR</option><option>PCR</option><option>LTR</option><option>Curing</option>
        </select>
      </div>
      <div className="space-y-2">
        {operators.map((o: any, i: number) => (
          <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${i < 3 ? 'bg-amber-500' : 'bg-slate-400'}`}>
              #{i + 1}
            </div>
            <div className="flex-1">
              <p className="font-medium">{o.user.fullName}</p>
              <p className="text-sm text-slate-500">{o.employeeId} - {o.section} / {o.line}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary-600">{o.performanceScore}</p>
              <p className="text-xs text-slate-400">Score</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-green-600">{o.totalMerit} merit</p>
              <p className="text-xs text-red-500">{o.totalMisconduct} misconduct</p>
            </div>
          </div>
        ))}
      </div>
    </Sidebar>
  );
}
