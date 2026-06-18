'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { auditAPI } from '@/lib/api';

export default function AuditPage() {
  const { checkAuth } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => { checkAuth(); auditAPI.logs().then(r => setLogs(r.data.data)).catch(console.error); }, [checkAuth]);

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Audit Logs (Append Only)</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">Module</th>
              <th className="text-left p-3">IP</th>
              <th className="text-left p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="p-3 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-3">{l.user?.fullName || 'Unknown'}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{l.action}</span></td>
                <td className="p-3">{l.module}</td>
                <td className="p-3 text-xs">{l.ipAddress}</td>
                <td className="p-3 text-xs max-w-xs truncate">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-center text-slate-400 py-8">No audit logs yet</p>}
      </div>
    </Sidebar>
  );
}
