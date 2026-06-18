'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { dashboardAPI } from '@/lib/api';

export default function DashboardPage() {
  const { checkAuth } = useAuthStore();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    dashboardAPI.kpi().then(r => setData(r.data.data)).catch(console.error);
  }, [checkAuth]);

  if (!data) return <Sidebar><div className="animate-pulse p-8">Loading KPI data...</div></Sidebar>;

  const { summary, trends } = data;

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Dashboard KPI</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard label="Total Operators" value={summary.totalOperators} color="bg-blue-500" icon="👷" />
        <KPICard label="VoO Submissions" value={summary.totalVoo} color="bg-green-500" icon="💡" />
        <KPICard label="Pending Approval" value={summary.pendingVoo} color="bg-yellow-500" icon="⏳" />
        <KPICard label="Approved VoO" value={summary.approvedVoo} color="bg-emerald-500" icon="✅" />
        <KPICard label="Misconducts" value={summary.totalMisconduct} color="bg-red-500" icon="⚠️" />
        <KPICard label="Counselings" value={summary.totalCounseling} color="bg-purple-500" icon="💬" />
        <KPICard label="Kartu Kuning" value={summary.totalKartuKuning} color="bg-amber-500" icon="🟡" />
        <KPICard label="Surat Peringatan" value={summary.totalSuratPeringatan} color="bg-rose-500" icon="📜" />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Average Performance Score</h2>
        <div className="text-4xl font-bold text-primary-600">{summary.avgPerformance}</div>
        <div className="w-full bg-slate-200 rounded-full h-3 mt-2">
          <div className="bg-primary-500 h-3 rounded-full" style={{ width: `${summary.avgPerformance}%` }}></div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Monthly Trends (Last 12 Months)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Month</th>
                {trends.months.map((m: string) => <th key={m} className="p-2">{m.slice(5)}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium text-green-600">VoO</td>
                {trends.vooTrend.map((v: number, i: number) => <td key={i} className="p-2 text-center">{v}</td>)}
              </tr>
              <tr>
                <td className="p-2 font-medium text-red-600">Misconduct</td>
                {trends.misconductTrend.map((v: number, i: number) => <td key={i} className="p-2 text-center">{v}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Sidebar>
  );
}

function KPICard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-xl`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
