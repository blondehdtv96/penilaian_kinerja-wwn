'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const menus = {
  'Super Admin': [
    { href: '/dashboard', label: 'Dashboard KPI', icon: '📈' },
    { href: '/superadmin/users', label: 'Manage Users', icon: '👥' },
    { href: '/superadmin/roles', label: 'Manage Roles', icon: '🔑' },
    { href: '/operator/scan', label: 'Scan QR Area', icon: '📷' },
    { href: '/operator/voo', label: 'Submit VoO', icon: '💡' },
    { href: '/operator/submissions', label: 'My Submissions', icon: '📋' },
    { href: '/operator/performance', label: 'My Performance', icon: '📊' },
    { href: '/foreman/approve', label: 'Approve VoO', icon: '✅' },
    { href: '/foreman/misconduct', label: 'Input Misconduct', icon: '⚠️' },
    { href: '/foreman/counseling', label: 'Input Counseling', icon: '💬' },
    { href: '/foreman/kartu-kuning', label: 'Kartu Kuning', icon: '🟡' },
    { href: '/foreman/surat-peringatan', label: 'Surat Peringatan', icon: '📜' },
    { href: '/foreman/operators', label: 'Monitor Operators', icon: '👥' },
    { href: '/manager/final-approve', label: 'Final Approval', icon: '🏆' },
    { href: '/manager/ranking', label: 'Operator Ranking', icon: '🏅' },
    { href: '/manager/trends', label: 'Trend Analysis', icon: '📉' },
    { href: '/manager/export', label: 'Export Reports', icon: '📄' },
    { href: '/manager/blockchain', label: 'Blockchain', icon: '🔗' },
    { href: '/manager/audit', label: 'Audit Logs', icon: '🔍' },
  ],
  Operator: [
    { href: '/operator/scan', label: 'Scan QR Area', icon: '📷' },
    { href: '/operator/voo', label: 'Submit VoO', icon: '💡' },
    { href: '/operator/submissions', label: 'My Submissions', icon: '📋' },
    { href: '/operator/performance', label: 'My Performance', icon: '📊' },
  ],
  Foreman: [
    { href: '/foreman/approve', label: 'Approve VoO', icon: '✅' },
    { href: '/foreman/misconduct', label: 'Input Misconduct', icon: '⚠️' },
    { href: '/foreman/counseling', label: 'Input Counseling', icon: '💬' },
    { href: '/foreman/kartu-kuning', label: 'Kartu Kuning', icon: '🟡' },
    { href: '/foreman/surat-peringatan', label: 'Surat Peringatan', icon: '📜' },
    { href: '/foreman/operators', label: 'Monitor Operators', icon: '👥' },
  ],
  'Section Manager': [
    { href: '/dashboard', label: 'Dashboard KPI', icon: '📈' },
    { href: '/manager/final-approve', label: 'Final Approval', icon: '🏆' },
    { href: '/manager/ranking', label: 'Operator Ranking', icon: '🏅' },
    { href: '/manager/trends', label: 'Trend Analysis', icon: '📉' },
    { href: '/manager/export', label: 'Export Reports', icon: '📄' },
    { href: '/manager/blockchain', label: 'Blockchain', icon: '🔗' },
    { href: '/manager/audit', label: 'Audit Logs', icon: '🔍' },
  ],
};

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  if (!user) return <>{children}</>;

  const roleMenus = menus[user.role as keyof typeof menus] || [];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold">VoO / Ide Kaizen</h1>
          <p className="text-xs text-slate-400 mt-1">Performance Management v2.0</p>
        </div>

        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {roleMenus.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === item.href
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
