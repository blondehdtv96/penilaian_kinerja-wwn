'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, Users, Shield, MapPin, Activity, 
  TrendingUp, CheckCircle, Clock, AlertCircle, RefreshCw
} from 'lucide-react';

interface SystemStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalRoles: number;
    totalOperators: number;
    totalQrLocations: number;
  };
  voo: {
    total: number;
    pending: number;
    approved: number;
  };
  misconduct: {
    total: number;
  };
  qr: {
    totalLocations: number;
    totalScans: number;
  };
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: number;
    action: string;
    module: string;
    createdAt: string;
    user: {
      username: string;
      fullName: string;
      role: {
        name: string;
      };
    };
  }>;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/superadmin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load statistics</p>
          <button
            onClick={loadStats}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              System Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Overview of system statistics and activity</p>
          </div>
          <button
            onClick={loadStats}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.overview.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.overview.activeUsers} active • {stats.overview.inactiveUsers} inactive
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Roles</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.overview.totalRoles}</p>
                <p className="text-xs text-gray-500 mt-1">System & Custom roles</p>
              </div>
              <Shield className="w-12 h-12 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Operators</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.overview.totalOperators}</p>
                <p className="text-xs text-gray-500 mt-1">Active operators</p>
              </div>
              <Users className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">QR Locations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.qr.totalLocations}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.qr.totalScans} total scans</p>
              </div>
              <MapPin className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* VoO & Misconduct Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              VoO / Ide Kaizen
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Total Submissions</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.voo.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-700">Pending Review</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{stats.voo.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Approved</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.voo.approved}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Misconduct Records
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-gray-700">Total Records</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{stats.misconduct.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Users by Role */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Users by Role
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.usersByRole.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">{item.role}</p>
                <p className="text-2xl font-bold text-purple-600">{item.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.action === 'LOGIN' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user.fullName}
                      <span className="text-gray-500 font-normal ml-2">
                        {activity.action.toLowerCase()} in {activity.module}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">@{activity.user.username}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {activity.user.role.name}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
              </div>
            ))}
          </div>
          
          {stats.recentActivity.length === 0 && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
