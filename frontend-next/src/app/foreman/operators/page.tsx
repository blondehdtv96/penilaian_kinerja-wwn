'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { operatorAPI } from '@/lib/api';

export default function MonitorOperatorsPage() {
  const { checkAuth } = useAuthStore();
  const [operators, setOperators] = useState<any[]>([]);

  useEffect(() => { checkAuth(); operatorAPI.getAll().then(r => setOperators(r.data.data)).catch(console.error); }, [checkAuth]);

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Monitor Operators</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Employee ID</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Section</th>
              <th className="text-left p-3">Line</th>
              <th className="text-center p-3">Score</th>
              <th className="text-center p-3">Merit</th>
              <th className="text-center p-3">Misconduct</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((o: any) => (
              <tr key={o.id} className="border-t">
                <td className="p-3">{o.employeeId}</td>
                <td className="p-3 font-medium">{o.user.fullName}</td>
                <td className="p-3">{o.section}</td>
                <td className="p-3">{o.line}</td>
                <td className="p-3 text-center">
                  <span className={`font-medium ${o.performanceScore >= 70 ? 'text-green-600' : o.performanceScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {o.performanceScore}
                  </span>
                </td>
                <td className="p-3 text-center text-green-600">{o.totalMerit}</td>
                <td className="p-3 text-center text-red-600">{o.totalMisconduct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sidebar>
  );
}
