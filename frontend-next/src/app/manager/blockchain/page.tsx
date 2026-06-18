'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { blockchainAPI } from '@/lib/api';

export default function BlockchainPage() {
  const { checkAuth } = useAuthStore();
  const [status, setStatus] = useState<any>(null);
  const [hashes, setHashes] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    blockchainAPI.status().then(r => setStatus(r.data.data)).catch(console.error);
    blockchainAPI.hashes().then(r => setHashes(r.data.data)).catch(console.error);
  }, [checkAuth]);

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Blockchain Hash Anchoring</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-semibold mb-2">Ethereum / Ganache Status</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${status?.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{status?.available ? 'Connected' : 'Not Connected'}</span>
        </div>
        <p className="text-sm text-slate-400 mt-1">Ganache URL: {status?.ganacheUrl || 'N/A'}</p>
        <p className="text-sm text-slate-400">Contract: {status?.contractAddress || 'Not deployed'}</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Stored Hashes ({hashes.length})</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {hashes.map((h: any) => (
            <div key={h.id} className="p-3 border rounded-lg text-sm font-mono">
              <p><span className="text-slate-500">Entity:</span> {h.entityType} #{h.entityId}</p>
              <p><span className="text-slate-500">Hash:</span> {h.data.slice(0, 20)}...{h.data.slice(-10)}</p>
              <p><span className="text-slate-500">TX:</span> {h.txHash || 'Local only'}</p>
              <p><span className="text-slate-500">Block:</span> {h.blockNumber || 'N/A'}</p>
              <p className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </Sidebar>
  );
}
