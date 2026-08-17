'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const roleRedirects: Record<string, string> = {
        'Super Admin': '/superadmin/users',
        'Operator': '/operator/scan',
        'Foreman': '/foreman/approve',
        'Section Manager': '/dashboard',
        'Staff Produksi': '/staff-produksi/operators',
      };
      router.push(roleRedirects[user.role] || '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <span className="text-3xl">💡</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">VoO / Ide Kaizen</h1>
            <p className="text-slate-500 text-sm mt-1">Performance Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-xs text-slate-400 text-center space-y-1">
            <p>Demo Credentials:</p>
            <p className="text-red-500 font-medium">Super Admin: superadmin / superadmin123</p>
            <p>Section Manager: section_manager / manager123</p>
            <p>Foreman: foreman01 / foreman123</p>
            <p>Operator: operator01 / operator123</p>
            <p>Staff Produksi: staff_produksi / staff123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
