// Helper format & label berbahasa Indonesia, dipakai lintas halaman.

export const initials = (name?: string) =>
  (name ?? '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

export const fmtNum = (n?: number) => (n ?? 0).toLocaleString('id-ID');

export const fmtDate = (iso?: string) => {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
};

export const fmtDateShort = (iso?: string) => {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso));
};

export const vooTypeLabel = (_t?: string) => 'VoO / Ide Kaizen';

// "2026-06" → "Jun"
export const monthShort = (ym?: string) => {
  const idx = parseInt((ym ?? '').split('-')[1] ?? '1', 10) - 1;
  return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][idx] ?? (ym ?? '');
};

export const vooStatusMeta = (s?: string): { label: string; cls: string } => {
  switch (s) {
    case 'pending': return { label: 'Menunggu Foreman', cls: 'pending' };
    case 'approved_foreman': return { label: 'Diteruskan ke Manager', cls: 'foreman' };
    case 'approved_final': return { label: 'Disetujui Final', cls: 'final' };
    case 'rejected': return { label: 'Ditolak', cls: 'rejected' };
    default: return { label: s ?? '-', cls: 'pending' };
  }
};

export const severityMeta = (s?: string): { label: string; cls: string } => {
  switch (s) {
    case 'low': return { label: 'Rendah', cls: 'low' };
    case 'medium': return { label: 'Sedang', cls: 'medium' };
    case 'high': return { label: 'Tinggi', cls: 'high' };
    case 'critical': return { label: 'Kritis', cls: 'critical' };
    default: return { label: s ?? '-', cls: 'low' };
  }
};

// Parse field photos (JSON string) jadi array URL/base64 dengan aman.
export const parsePhotos = (raw?: string): string[] => {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};
