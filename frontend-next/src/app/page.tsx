'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AppPage() {
  const { user, checkAuth, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user) {
      const roleRedirects: Record<string, string> = {
        'Super Admin': '/superadmin/users',
        'Operator': '/operator/scan',
        'Foreman': '/foreman/approve',
        'Section Manager': '/dashboard',
      };
      router.push(roleRedirects[user.role] || '/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-slate-500">Loading...</p>
      </div>
    </div>
  );
}
