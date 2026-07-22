'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';
import { vooAPI } from '@/lib/api';

const CLASSIFICATION_OPTIONS = [
  { value: 'safety',      label: 'Safety',       icon: '🦺', color: '#ef4444' },
  { value: 'environment', label: 'Environment',  icon: '🌿', color: '#22c55e' },
  { value: 'quality',     label: 'Quality',      icon: '✅', color: '#3b82f6' },
  { value: 'cost',        label: 'Cost',         icon: '💰', color: '#f59e0b' },
  { value: 'delivery',    label: 'Delivery',     icon: '🚚', color: '#8b5cf6' },
] as const;

type ClassificationValue = typeof CLASSIFICATION_OPTIONS[number]['value'];

export default function SubmitVooPage() {
  const { checkAuth } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type] = useState('VoO/IdeKaizen');
  const [classification, setClassification] = useState<ClassificationValue[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const toggleClassification = (value: ClassificationValue) => {
    setClassification(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setIsSubmitting(true);
    try {
      await vooAPI.create({
        title,
        description,
        type,
        classification: JSON.stringify(classification),
        photos: '[]',
      } as any);
      setSuccess('VoO/Ide Kaizen berhasil diajukan!');
      setTitle('');
      setDescription('');
      setClassification([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengajukan, coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sidebar>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Submit VoO / Ide Kaizen
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>
          Ajukan ide perbaikan atau Voice of Operator kamu di sini.
        </p>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '28px 32px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Alert messages */}
            {success && (
              <div style={{
                background: '#f0fdf4', color: '#15803d', padding: '12px 16px',
                borderRadius: 10, border: '1px solid #bbf7d0', display: 'flex',
                alignItems: 'center', gap: 8, fontSize: 14,
              }}>
                ✅ {success}
              </div>
            )}
            {error && (
              <div style={{
                background: '#fef2f2', color: '#b91c1c', padding: '12px 16px',
                borderRadius: 10, border: '1px solid #fecaca', display: 'flex',
                alignItems: 'center', gap: 8, fontSize: 14,
              }}>
                ❌ {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                Judul <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Pengurangan waste pada proses material..."
                required
                style={{
                  width: '100%', border: '1.5px solid #d1d5db', borderRadius: 10,
                  padding: '10px 14px', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = '#6366f1')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                Deskripsi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Jelaskan masalah, penyebab, dan ide solusi kamu secara detail..."
                required
                rows={4}
                style={{
                  width: '100%', border: '1.5px solid #d1d5db', borderRadius: 10,
                  padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'vertical',
                  transition: 'border-color 0.2s', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onFocus={e => (e.target.style.borderColor = '#6366f1')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            {/* Classification Checkboxes */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                Klasifikasi
              </label>
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
                Pilih satu atau lebih kategori yang relevan dengan pengajuan ini.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {CLASSIFICATION_OPTIONS.map(opt => {
                  const checked = classification.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      htmlFor={`cls-${opt.value}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                        border: `2px solid ${checked ? opt.color : '#e5e7eb'}`,
                        background: checked ? `${opt.color}18` : '#f9fafb',
                        color: checked ? opt.color : '#6b7280',
                        fontWeight: checked ? 600 : 400,
                        fontSize: 13,
                        transition: 'all 0.18s ease',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`cls-${opt.value}`}
                        value={opt.value}
                        checked={checked}
                        onChange={() => toggleClassification(opt.value)}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontSize: 16 }}>{opt.icon}</span>
                      {opt.label}
                      {checked && (
                        <span style={{
                          width: 16, height: 16, borderRadius: '50%', background: opt.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 10, fontWeight: 700,
                        }}>✓</span>
                      )}
                    </label>
                  );
                })}
              </div>
              {classification.length > 0 && (
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                  Dipilih: <strong style={{ color: '#374151' }}>{classification.map(v =>
                    CLASSIFICATION_OPTIONS.find(o => o.value === v)?.label
                  ).join(', ')}</strong>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div style={{ paddingTop: 4 }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: isSubmitting ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff', padding: '11px 28px', borderRadius: 10, fontWeight: 600,
                  fontSize: 14, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                }}
              >
                {isSubmitting ? '⏳ Mengirim...' : '🚀 Submit Pengajuan'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Sidebar>
  );
}
