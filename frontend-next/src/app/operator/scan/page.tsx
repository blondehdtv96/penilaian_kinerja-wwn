'use client';
import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { operatorAPI, qrLocationAPI } from '@/lib/api';

export default function ScanPage() {
  const { checkAuth } = useAuthStore();
  const [locations, setLocations] = useState<any[]>([]);
  const [scanResult, setScanResult] = useState<any>(null);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
    qrLocationAPI.getAll().then(r => setLocations(r.data.data)).catch(console.error);
  }, [checkAuth]);

  const handleScan = async (qrData: string) => {
    setError('');
    setScanResult(null);
    try {
      const res = await operatorAPI.scanQR(qrData);
      setScanResult(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Scan failed');
    }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Scan QR Area Kerja</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">QR Area Locations</h2>
          <div className="space-y-2">
            {locations.map(loc => (
              <button
                key={loc.id}
                onClick={() => handleScan(JSON.stringify({ locationCode: loc.code, name: loc.name }))}
                className="w-full text-left p-3 rounded-lg border hover:bg-slate-50 flex items-center gap-3"
              >
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-medium">{loc.name}</p>
                  <p className="text-xs text-slate-400">{loc.area} - {loc.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-4">Manual Input</h2>
            <textarea
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm h-24"
              placeholder="Paste QR data here..."
            />
            <button onClick={() => handleScan(manualInput)} className="mt-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">
              Submit
            </button>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

          {scanResult && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold mb-2">Scan Result</h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-medium">Type: {scanResult.type}</p>
                {scanResult.type === 'area' && (
                  <div className="mt-2">
                    <p>Location: {scanResult.location.name}</p>
                    <p>Area: {scanResult.location.area}</p>
                    <p className="text-sm text-green-600 mt-1">Attendance logged successfully!</p>
                  </div>
                )}
                {scanResult.type === 'operator' && (
                  <div className="mt-2">
                    <p>Operator: {scanResult.operator.user.fullName}</p>
                    <p>Employee ID: {scanResult.operator.employeeId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
