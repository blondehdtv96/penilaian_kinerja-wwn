'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { dashboardAPI } from '@/lib/api';

export default function ExportPage() {
  const { checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const handleExcel = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
    } catch (err: any) { alert('Export failed'); }
    setLoading(false);
  };

  const handlePDF = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.exportPDF();
      const data = res.data.data;
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<html><head><title>Performance Report</title></head><body>`);
        w.document.write(`<h1>Performance Report</h1><p>Generated: ${data.generatedAt}</p>`);
        w.document.write(`<h2>KPI Summary</h2><ul>`);
        Object.entries(data.kpi).forEach(([k, v]) => { w.document.write(`<li>${k}: ${v}</li>`); });
        w.document.write(`</ul><h2>Operators</h2><table border="1"><tr><th>Name</th><th>Employee ID</th><th>Score</th><th>Merit</th><th>Misconduct</th></tr>`);
        data.operators.forEach((o: any) => { w.document.write(`<tr><td>${o.name}</td><td>${o.employeeId}</td><td>${o.performanceScore}</td><td>${o.totalMerit}</td><td>${o.totalMisconduct}</td></tr>`); });
        w.document.write(`</table></body></html>`);
      }
    } catch (err: any) { alert('Export failed'); }
    setLoading(false);
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Export Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <button onClick={handleExcel} disabled={loading} className="bg-green-600 text-white p-6 rounded-xl shadow-sm hover:bg-green-700 disabled:opacity-50 text-left">
          <span className="text-3xl">📊</span>
          <h3 className="font-semibold mt-3">Export Excel</h3>
          <p className="text-sm text-green-200">Download full performance data as .xlsx</p>
        </button>
        <button onClick={handlePDF} disabled={loading} className="bg-red-600 text-white p-6 rounded-xl shadow-sm hover:bg-red-700 disabled:opacity-50 text-left">
          <span className="text-3xl">📄</span>
          <h3 className="font-semibold mt-3">Export PDF</h3>
          <p className="text-sm text-red-200">Generate printable performance report</p>
        </button>
      </div>
    </Sidebar>
  );
}
