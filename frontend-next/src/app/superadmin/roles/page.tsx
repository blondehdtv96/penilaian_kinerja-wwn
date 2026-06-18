'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, Plus, Edit, Trash2, Users, 
  Search, RefreshCw, CheckSquare, Square
} from 'lucide-react';

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string;
  createdAt: string;
  _count: {
    users: number;
  };
}

// Define all available permissions
const PERMISSION_MODULES = {
  voo: {
    label: 'VoO / Ide Kaizen',
    permissions: [
      { key: 'voo.view', label: 'View VoO Submissions' },
      { key: 'voo.create', label: 'Create VoO Submissions' },
      { key: 'voo.approve_foreman', label: 'Approve as Foreman' },
      { key: 'voo.approve_manager', label: 'Approve as Manager' },
      { key: 'voo.reject', label: 'Reject Submissions' },
      { key: 'voo.delete', label: 'Delete Submissions' },
    ]
  },
  misconduct: {
    label: 'Misconduct',
    permissions: [
      { key: 'misconduct.view', label: 'View Misconducts' },
      { key: 'misconduct.create', label: 'Create Misconducts' },
      { key: 'misconduct.edit', label: 'Edit Misconducts' },
      { key: 'misconduct.delete', label: 'Delete Misconducts' },
    ]
  },
  operators: {
    label: 'Operators',
    permissions: [
      { key: 'operators.view', label: 'View Operators' },
      { key: 'operators.view_performance', label: 'View Performance' },
      { key: 'operators.edit', label: 'Edit Operators' },
    ]
  },
  counseling: {
    label: 'Counseling',
    permissions: [
      { key: 'counseling.view', label: 'View Counseling Records' },
      { key: 'counseling.create', label: 'Create Counseling' },
      { key: 'counseling.edit', label: 'Edit Counseling' },
    ]
  },
  warnings: {
    label: 'Warnings',
    permissions: [
      { key: 'warnings.view', label: 'View Warnings' },
      { key: 'warnings.issue_yellow', label: 'Issue Yellow Card' },
      { key: 'warnings.issue_sp', label: 'Issue Warning Letter' },
    ]
  },
  reports: {
    label: 'Reports',
    permissions: [
      { key: 'reports.view', label: 'View Reports' },
      { key: 'reports.export', label: 'Export Reports' },
    ]
  },
  dashboard: {
    label: 'Dashboard',
    permissions: [
      { key: 'dashboard.view', label: 'View Dashboard' },
      { key: 'dashboard.view_all', label: 'View All Sections' },
    ]
  }
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const systemRoles = ['Super Admin', 'Section Manager', 'Foreman', 'Operator'];

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/superadmin/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingRole 
        ? `http://localhost:3001/api/superadmin/roles/${editingRole.id}`
        : 'http://localhost:3001/api/superadmin/roles';
      
      const method = editingRole ? 'put' : 'post';
      
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(editingRole ? 'Role updated!' : 'Role created!');
      setShowModal(false);
      loadRoles();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving role');
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    const permissions = JSON.parse(role.permissions || '[]');
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this role? This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/superadmin/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Role deleted!');
      loadRoles();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting role');
    }
  };

  const resetForm = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const toggleModule = (module: string) => {
    const modulePerms = PERMISSION_MODULES[module as keyof typeof PERMISSION_MODULES].permissions.map(p => p.key);
    const allSelected = modulePerms.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      // Remove all module permissions
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !modulePerms.includes(p))
      }));
    } else {
      // Add all module permissions
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...modulePerms])]
      }));
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         role.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: roles.length,
    system: roles.filter(r => systemRoles.includes(r.name)).length,
    custom: roles.filter(r => !systemRoles.includes(r.name)).length,
    totalUsers: roles.reduce((sum, r) => sum + r._count.users, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-purple-600" />
              Role Management
            </h1>
            <p className="text-gray-600 mt-1">Manage roles and permissions</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
          >
            <Plus className="w-5 h-5" />
            Add Role
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Shield className="w-10 h-10 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">System Roles</p>
                <p className="text-2xl font-bold text-blue-600">{stats.system}</p>
              </div>
              <Shield className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Custom Roles</p>
                <p className="text-2xl font-bold text-green-600">{stats.custom}</p>
              </div>
              <Shield className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={loadRoles}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Roles Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoles.map((role) => {
                const isSystem = systemRoles.includes(role.name);
                const permissions = JSON.parse(role.permissions || '[]');
                
                return (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-600" />
                          {role.name}
                        </div>
                        <div className="text-sm text-gray-500">{role.description || 'No description'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isSystem ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isSystem ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{role._count.users}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {permissions.length > 0 ? (
                          <span>{permissions.length} permission{permissions.length !== 1 ? 's' : ''}</span>
                        ) : (
                          <span className="text-gray-400">No permissions</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(role)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!isSystem && role._count.users === 0 && (
                          <button
                            onClick={() => handleDelete(role.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  {editingRole ? 'Edit Role' : 'Create Role'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                    <input
                      type="text"
                      required
                      disabled={editingRole && systemRoles.includes(editingRole.name)}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    />
                    {editingRole && systemRoles.includes(editingRole.name) && (
                      <p className="text-xs text-gray-500 mt-1">System roles cannot be renamed</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                    <div className="border border-gray-200 rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                      {Object.entries(PERMISSION_MODULES).map(([moduleKey, module]) => {
                        const modulePerms = module.permissions.map(p => p.key);
                        const allSelected = modulePerms.every(p => formData.permissions.includes(p));
                        const someSelected = modulePerms.some(p => formData.permissions.includes(p));
                        
                        return (
                          <div key={moduleKey} className="border-b border-gray-100 pb-3 last:border-0">
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                type="button"
                                onClick={() => toggleModule(moduleKey)}
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-600"
                              >
                                {allSelected ? (
                                  <CheckSquare className="w-5 h-5 text-purple-600" />
                                ) : someSelected ? (
                                  <div className="w-5 h-5 border-2 border-purple-600 rounded flex items-center justify-center">
                                    <div className="w-2 h-2 bg-purple-600 rounded-sm" />
                                  </div>
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                                {module.label}
                              </button>
                            </div>
                            <div className="ml-7 space-y-1">
                              {module.permissions.map(perm => (
                                <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(perm.key)}
                                    onChange={() => togglePermission(perm.key)}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                  />
                                  <span className="text-sm text-gray-600">{perm.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.permissions.length} permission{formData.permissions.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      {editingRole ? 'Update' : 'Create'} Role
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
