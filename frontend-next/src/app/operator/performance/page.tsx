'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { operatorAPI } from '@/lib/api';

export default function PerformancePage() {
  const { checkAuth } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    operatorAPI.myProfile().then(r => setProfile(r.data.data)).catch(console.error);
  }, [checkAuth]);

  if (!profile) return <Sidebar><div className="animate-pulse p-8">Loading...</div></Sidebar>;

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">My Performance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Profile</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-500">Employee ID:</span> {profile.employeeId}</p>
            <p><span className="text-slate-500">Section:</span> {profile.section}</p>
            <p><span className="text-slate-500">Line:</span> {profile.line}</p>
            <p><span className="text-slate-500">Group:</span> {profile.group}</p>
            <p><span className="text-slate-500">Position:</span> {profile.position}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Performance Score</h2>
          <div className="text-5xl font-bold text-primary-600 mb-2">{profile.performanceScore}</div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className="bg-primary-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(profile.performanceScore, 100)}%` }}></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{profile.totalMerit}</p>
              <p className="text-sm text-slate-500">Merit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{profile.totalMisconduct}</p>
              <p className="text-sm text-slate-500">Misconduct</p>
            </div>
          </div>
        </div>
      </div>

      {profile.qrCode && (
        <div className="bg-white rounded-xl p-6 shadow-sm mt-6">
          <h2 className="font-semibold mb-4">My QR Identity</h2>
          <img src={profile.qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
          <p className="text-center text-sm text-slate-500 mt-2">Show this QR to Foreman for attendance</p>
        </div>
      )}
    </Sidebar>
  );
}
