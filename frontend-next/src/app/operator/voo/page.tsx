'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { vooAPI } from '@/lib/api';

export default function SubmitVooPage() {
  const { checkAuth } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type] = useState('VoO/IdeKaizen');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await vooAPI.create({ title, description, type, photos: '[]' } as any);
      setSuccess('VoO/Ide Kaizen submitted successfully!');
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit');
    }
  };

  return (
    <Sidebar>
      <h1 className="text-2xl font-bold mb-6">Submit VoO / Ide Kaizen</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg">{success}</div>}
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg p-2.5" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg p-2.5 h-32" required />
          </div>

          <button type="submit" className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700">
            Submit
          </button>
        </form>
      </div>
    </Sidebar>
  );
}
