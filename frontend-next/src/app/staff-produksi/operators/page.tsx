'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { staffProduksiAPI } from '@/lib/api';

interface OperatorUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  nik: string | null;
  isActive: boolean;
  role: { id: number; name: string };
  operator: {
    employeeId: string;
    section: string;
    group: string;
    position: string;
    performanceScore: number;
    totalMerit: number;
    totalMisconduct: number;
  } | null;
}

const emptyForm = {
  username: '',
  email: '',
  fullName: '',
  nik: '',
  password: '',
  isActive: true,
  operatorData: { employeeId: '', section: '', group: '', position: 'Operator' },
};

export default function StaffProduksiOperatorsPage() {
  const { checkAuth } = useAuthStore();
  const [operators, setOperators] = useState<OperatorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<OperatorUser | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  const loadOperators = () => {
    setLoading(true);
    staffProduksiAPI
      .getOperators()
      .then((r) => setOperators(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    checkAuth();
    loadOperators();
  }, [checkAuth]);

  const resetForm = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setError('');
  };

  const handleEdit = (user: OperatorUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      nik: user.nik || '',
      password: '',
      isActive: user.isActive,
      operatorData: {
        employeeId: user.operator?.employeeId || '',
        section: user.operator?.section || '',
        group: user.operator?.group || '',
        position: user.operator?.position || 'Operator',
      },
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingUser) {
        await staffProduksiAPI.updateOperator(editingUser.id, formData);
      } else {
        await staffProduksiAPI.createOperator(formData);
      }
      setShowModal(false);
      resetForm();
      loadOperators();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data operator');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus operator ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await staffProduksiAPI.deleteOperator(id);
      loadOperators();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus operator');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await staffProduksiAPI.toggleStatus(id);
      loadOperators();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const handleResetPassword = async (id: number) => {
    const newPassword = prompt('Masukkan password baru (minimal 6 karakter):');
    if (!newPassword || newPassword.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }
    try {
      await staffProduksiAPI.resetPassword(id, newPassword);
      alert('Password berhasil direset');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mereset password');
    }
  };

  const filteredOperators = operators.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.operator?.employeeId || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: operators.length,
    active: operators.filter((u) => u.isActive).length,
    inactive: operators.filter((u) => !u.isActive).length,
  };

  return (
    <Sidebar>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kelola Operator</h1>
          <p className="text-slate-500 text-sm mt-1">Buat, ubah, dan hapus akun user dengan role Operator</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-primary-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary-700"
        >
          + Tambah Operator
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-slate-500 text-sm">Total Operator</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-slate-500 text-sm">Aktif</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-slate-500 text-sm">Nonaktif</p>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <input
          type="text"
          placeholder="Cari nama, username, atau employee ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Operator</th>
              <th className="text-left p-3">Employee ID</th>
              <th className="text-left p-3">Section / Group / Posisi</th>
              <th className="text-center p-3">Score</th>
              <th className="text-center p-3">Status</th>
              <th className="text-right p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-400">Memuat...</td></tr>
            )}
            {!loading && filteredOperators.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-400">Belum ada operator</td></tr>
            )}
            {filteredOperators.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{u.fullName}</div>
                  <div className="text-slate-500 text-xs">@{u.username} · {u.email}</div>
                </td>
                <td className="p-3">{u.operator?.employeeId}</td>
                <td className="p-3">{u.operator?.section} / {u.operator?.group} / {u.operator?.position}</td>
                <td className="p-3 text-center">{u.operator?.performanceScore ?? 0}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {u.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(u)} className="text-blue-600 hover:underline mr-3">Edit</button>
                  <button onClick={() => handleToggleStatus(u.id)} className="text-amber-600 hover:underline mr-3">
                    {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button onClick={() => handleResetPassword(u.id)} className="text-purple-600 hover:underline mr-3">Reset Password</button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit Operator' : 'Tambah Operator'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text" required disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full border rounded-lg p-2.5 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email" required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                <input
                  type="text" required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">NIP</label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password {editingUser && <span className="text-slate-400 font-normal">(kosongkan jika tidak diubah)</span>}
                  </label>
                  <input
                    type="password" required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3">Profil Operator</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID</label>
                    <input
                      type="text" required
                      value={formData.operatorData.employeeId}
                      onChange={(e) => setFormData({ ...formData, operatorData: { ...formData.operatorData, employeeId: e.target.value } })}
                      className="w-full border rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Section</label>
                    <input
                      type="text"
                      value={formData.operatorData.section}
                      onChange={(e) => setFormData({ ...formData, operatorData: { ...formData.operatorData, section: e.target.value } })}
                      className="w-full border rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Group</label>
                    <input
                      type="text" placeholder="A / B / C / D / Non-Shift"
                      value={formData.operatorData.group}
                      onChange={(e) => setFormData({ ...formData, operatorData: { ...formData.operatorData, group: e.target.value } })}
                      className="w-full border rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Posisi</label>
                    <input
                      type="text"
                      value={formData.operatorData.position}
                      onChange={(e) => setFormData({ ...formData, operatorData: { ...formData.operatorData, position: e.target.value } })}
                      className="w-full border rounded-lg p-2.5"
                    />
                  </div>
                </div>
              </div>

              {editingUser && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox" id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm">Akun aktif</label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border rounded-lg hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
                  {editingUser ? 'Simpan Perubahan' : 'Buat Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
