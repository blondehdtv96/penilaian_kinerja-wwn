'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MapPin, Plus, Edit, Trash2, Download, 
  Search, RefreshCw, QrCode, Activity
} from 'lucide-react';

interface QrLocation {
  id: number;
  name: string;
  code: string;
  area: string;
  description: string;
  qrImage: string;
  createdAt: string;
  _count: {
    scanLogs: number;
  };
}

export default function QrLocationsPage() {
  const [locations, setLocations] = useState<QrLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<QrLocation | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQr, setSelectedQr] = useState<QrLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    area: '',
    description: '',
    regenerateQr: false
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/superadmin/qr-locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingLocation 
        ? `http://localhost:3001/api/superadmin/qr-locations/${editingLocation.id}`
        : 'http://localhost:3001/api/superadmin/qr-locations';
      
      const method = editingLocation ? 'put' : 'post';
      
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(editingLocation ? 'Location updated!' : 'Location created!');
      setShowModal(false);
      loadLocations();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving location');
    }
  };

  const handleEdit = (location: QrLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      code: location.code,
      area: location.area,
      description: location.description || '',
      regenerateQr: false
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this QR location? This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/superadmin/qr-locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Location deleted!');
      loadLocations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting location');
    }
  };

  const handleViewQr = (location: QrLocation) => {
    setSelectedQr(location);
    setShowQrModal(true);
  };

  const handleDownloadQr = (location: QrLocation) => {
    const link = document.createElement('a');
    link.href = location.qrImage;
    link.download = `QR-${location.code}-${location.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllQr = () => {
    locations.forEach((location, index) => {
      setTimeout(() => {
        handleDownloadQr(location);
      }, index * 500); // Delay each download by 500ms
    });
  };

  const resetForm = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      code: '',
      area: '',
      description: '',
      regenerateQr: false
    });
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         location.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         location.area.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: locations.length,
    totalScans: locations.reduce((sum, loc) => sum + loc._count.scanLogs, 0),
    areas: new Set(locations.map(loc => loc.area)).size,
    avgScans: locations.length > 0 
      ? Math.round(locations.reduce((sum, loc) => sum + loc._count.scanLogs, 0) / locations.length)
      : 0
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-8 h-8 text-purple-600" />
              QR Location Management
            </h1>
            <p className="text-gray-600 mt-1">Manage QR code locations for attendance tracking</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadAllQr}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Download className="w-5 h-5" />
              Download All
            </button>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
            >
              <Plus className="w-5 h-5" />
              Add Location
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Locations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MapPin className="w-10 h-10 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Scans</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalScans}</p>
              </div>
              <Activity className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Areas</p>
                <p className="text-2xl font-bold text-green-600">{stats.areas}</p>
              </div>
              <MapPin className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Scans</p>
                <p className="text-2xl font-bold text-orange-600">{stats.avgScans}</p>
              </div>
              <Activity className="w-10 h-10 text-orange-500" />
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
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={loadLocations}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <div key={location.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      {location.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Code: {location.code}</p>
                    <p className="text-sm text-gray-500">Area: {location.area}</p>
                  </div>
                </div>

                {location.description && (
                  <p className="text-sm text-gray-600 mb-4">{location.description}</p>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    {location._count.scanLogs} scan{location._count.scanLogs !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* QR Code Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 flex justify-center">
                  <img 
                    src={location.qrImage} 
                    alt={`QR Code for ${location.name}`}
                    className="w-32 h-32 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handleViewQr(location)}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewQr(location)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownloadQr(location)}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleEdit(location)}
                    className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLocations.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Get started by creating your first QR location'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Create Location
              </button>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  {editingLocation ? 'Edit Location' : 'Create Location'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Main Gate"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location Code</label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., GATE-01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                    <input
                      type="text"
                      required
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Production Area A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Additional details about this location..."
                    />
                  </div>

                  {editingLocation && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="regenerateQr"
                        checked={formData.regenerateQr}
                        onChange={(e) => setFormData({...formData, regenerateQr: e.target.checked})}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="regenerateQr" className="ml-2 block text-sm text-gray-900">
                        Regenerate QR Code (check if code or name changed)
                      </label>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-2">
                      <QrCode className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">QR Code Generation</p>
                        <p className="text-xs text-blue-700 mt-1">
                          {editingLocation 
                            ? 'QR code will be regenerated if you check the option above.'
                            : 'A QR code will be automatically generated for this location.'}
                        </p>
                      </div>
                    </div>
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
                      {editingLocation ? 'Update' : 'Create'} Location
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* QR View Modal */}
        {showQrModal && selectedQr && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">{selectedQr.name}</h2>
                <div className="text-sm text-gray-600 mb-4">
                  <p>Code: {selectedQr.code}</p>
                  <p>Area: {selectedQr.area}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-8 flex justify-center mb-4">
                  <img 
                    src={selectedQr.qrImage} 
                    alt={`QR Code for ${selectedQr.name}`}
                    className="w-64 h-64"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadQr(selectedQr)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                  <button
                    onClick={() => setShowQrModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
