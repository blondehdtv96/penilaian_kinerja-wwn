'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { dashboardAPI } from '@/lib/api';

export default function TrendsPage() {
  const { checkAuth } = useAuthStore();
  const [data, setData] = useState<any>(null);

  useEffect(() => { checkAuth(); dashboardAPI.kpi().then(r => setData(r.data.data)).catch(console.error); }, [checkAuth]);

  if (!data) return <Sidebar><div className="animate-pulse p-8">Loading trends...</div></Sidebar>;

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Trend Analysis</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-semibold mb-4">VoO Submission Trend (12 Months)</h2>
        <div className="flex items-end gap-2 h-40">
          {data.trends.vooTrend.map((v: number, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-green-500 rounded-t" style={{ height: `${Math.max(v * 20, 4)}px` }}></div>
              <span className="text-xs text-slate-400 mt-1">{data.trends.months[i].slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Misconduct Trend (12 Months)</h2>
        <div className="flex items-end gap-2 h-40">
          {data.trends.misconductTrend.map((v: number, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-red-500 rounded-t" style={{ height: `${Math.max(v * 20, 4)}px` }}></div>
              <span className="text-xs text-slate-400 mt-1">{data.trends.months[i].slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </Sidebar>
  );
}
