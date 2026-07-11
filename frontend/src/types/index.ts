// Tipe domain V2 (acuan: backend/prisma/schema.prisma & controller).

export type RoleName = 'Super Admin' | 'Section Manager' | 'Foreman' | 'Operator' | 'Staff Produksi';

export interface OperatorProfile {
  id: number;
  userId: number;
  employeeId: string;
  section: string;
  group: string;
  position: string;
  photo?: string | null;
  qrCode?: string;
  performanceScore: number;
  totalMerit: number;
  totalMisconduct: number;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  nik?: string | null;
  isActive: boolean;
  roleId: number;
  role: string; // V2: peran tunggal (string), bukan array
  permissions: string[];
  operator?: OperatorProfile | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardKPI {
  summary: {
    totalOperators: number;
    totalVoo: number;
    pendingVoo: number;
    approvedVoo: number;
    totalMisconduct: number;
    totalCounseling: number;
    totalKartuKuning: number;
    totalSuratPeringatan: number;
    avgPerformance: number;
  };
  trends: {
    months: string[];
    vooTrend: number[];
    misconductTrend: number[];
  };
}

// Bentuk respons standar backend: { success, data, message? }
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UserRef {
  id: number;
  fullName: string;
  username?: string;
  email?: string;
}

export interface OperatorListItem {
  id: number;
  employeeId: string;
  section: string;
  group: string;
  position: string;
  performanceScore: number;
  totalMerit: number;
  totalMisconduct: number;
  // Total poin dari pelanggaran aktif — dasar evaluasi eskalasi (R8.1).
  accumulatedPoints: number;
  user: UserRef;
}

// Katalog jenis pelanggaran (R1) — sumber poin yang di-snapshot ke Misconduct.
export interface ViolationTypeItem {
  id: number;
  name: string;
  category: string;
  severity: string;
  points: number;
  isActive: boolean;
}

// Ambang batas eskalasi aktif (default atau override Section Manager, R4.6).
export interface EscalationThresholds {
  counseling: number;
  kartuKuning: number;
  sp1: number;
  sp2: number;
  sp3: number;
}

export type VooStatus = 'pending' | 'approved_foreman' | 'approved_final' | 'rejected';

export interface VooSubmission {
  id: number;
  title: string;
  description: string;
  type: string;
  groupShift?: string;
  photos: string;
  status: VooStatus;
  points: number;
  rejectionReason?: string | null;
  createdAt: string;
  operator?: { id: number; user: UserRef };
  submittedBy?: UserRef;
  approvals?: unknown[];
}

// Referensi operator dengan field scalar penuh — bentuk aktual dari Prisma
// `include: { operator: { include: { user: {...} } } }` (mengembalikan semua
// kolom scalar Operator, bukan hanya id).
export interface OperatorRef {
  id: number;
  employeeId?: string;
  section?: string;
  group?: string;
  position?: string;
  accumulatedPoints?: number;
  user: UserRef;
}

export interface MisconductItem {
  id: number;
  type: string;
  severity: string;
  description: string;
  points: number;
  violationTypeId?: number | null;
  createdAt: string;
  operator?: OperatorRef;
  // createdBy.role terisi pada endpoint /misconduct/my agar operator tahu
  // siapa (Foreman/Section Manager) yang menerbitkan pelanggaran ini.
  createdBy?: UserRef & { role?: { name: string } };
  // Tindak lanjut konseling (null jika pelanggaran belum dikonseling).
  counseling?: { id: number; topic: string; date: string; acknowledgedAt?: string | null } | null;
}

export interface CounselingItem {
  id: number;
  topic: string;
  category: string;
  pws: string;
  employeeStatement: string;
  supervisorSuggestion: string;
  employeeCommitment: string;
  location: string;
  notes: string;
  date: string;
  createdAt: string;
  acknowledgedAt?: string | null;
  misconductId?: number | null;
  misconduct?: { id: number; type: string; severity: string; description?: string } | null;
  operator?: OperatorRef;
  foreman?: UserRef;
  acknowledgedBy?: UserRef | null;
}

export interface KartuKuningItem {
  id: number;
  reason: string;
  issuedAt: string;
  // Snapshot poin akumulasi & level eskalasi saat penerbitan (R5.1).
  accumulatedPointsAtIssuance?: number;
  escalationLevelAtIssuance?: number;
  // true bila diterbitkan meski poin masih di bawah ambang batas (R5.2).
  isManualOverride?: boolean;
  operator?: OperatorRef;
  issuedBy?: UserRef;
}

export interface SuratPeringatanItem {
  id: number;
  level: number;
  reason: string;
  issuedAt: string;
  accumulatedPointsAtIssuance?: number;
  isManualOverride?: boolean;
  // Backend mengembalikan seluruh field scalar operator (include) — berguna untuk template cetak.
  operator?: OperatorRef;
  issuedBy?: UserRef & { role?: { name: string } | string };
}

export interface OperatorDetail extends OperatorListItem {
  qrCode?: string;
  photo?: string | null;
  vooSubmissions?: VooSubmission[];
  misconducts?: MisconductItem[];
  counselings?: CounselingItem[];
  kartuKunings?: KartuKuningItem[];
  suratPeringatan?: SuratPeringatanItem[];
}

export interface BlockchainHashItem {
  id: number;
  entityType: string;
  entityId: number;
  data: string; // SHA-256 hash
  txHash?: string | null;
  blockNumber?: number | null;
  createdAt: string;
  createdBy?: UserRef;
}

export interface AuditLogItem {
  id: number;
  userId: number;
  action: string;
  module: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: UserRef;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  nik?: string | null;
  isActive: boolean;
  roleId: number;
  createdAt: string;
  role: { id: number; name: string };
  operator?: { id: number; employeeId: string } | null;
  _count?: { vooSubmissions: number; eventLogs: number };
}

export interface AdminRole {
  id: number;
  name: string;
  description?: string | null;
  permissions: string; // JSON string array
  _count?: { users: number };
}

export interface AdminQrLocation {
  id: number;
  name: string;
  code: string;
  area: string;
  description?: string | null;
  qrImage: string;
  _count?: { scanLogs: number };
}
