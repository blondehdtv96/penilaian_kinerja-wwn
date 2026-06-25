// Tipe domain V2 (acuan: backend/prisma/schema.prisma & controller).

export type RoleName = 'Super Admin' | 'Section Manager' | 'Foreman' | 'Operator' | 'Staff Produksi';

export interface OperatorProfile {
  id: number;
  userId: number;
  employeeId: string;
  section: string;
  line: string;
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
  nip?: string | null;
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
  line: string;
  group: string;
  position: string;
  performanceScore: number;
  totalMerit: number;
  totalMisconduct: number;
  user: UserRef;
}

export type VooStatus = 'pending' | 'approved_foreman' | 'approved_final' | 'rejected';

export interface VooSubmission {
  id: number;
  title: string;
  description: string;
  type: string;
  photos: string;
  status: VooStatus;
  points: number;
  rejectionReason?: string | null;
  createdAt: string;
  operator?: { id: number; user: UserRef };
  submittedBy?: UserRef;
  approvals?: unknown[];
}

export interface MisconductItem {
  id: number;
  type: string;
  severity: string;
  description: string;
  points: number;
  createdAt: string;
  operator?: { id: number; user: UserRef };
  createdBy?: UserRef;
}

export interface CounselingItem {
  id: number;
  topic: string;
  notes: string;
  date: string;
  createdAt: string;
  operator?: { id: number; user: UserRef };
  foreman?: UserRef;
}

export interface KartuKuningItem {
  id: number;
  reason: string;
  issuedAt: string;
  operator?: { id: number; user: UserRef };
  issuedBy?: UserRef;
}

export interface SuratPeringatanItem {
  id: number;
  level: number;
  reason: string;
  issuedAt: string;
  operator?: { id: number; user: UserRef };
  issuedBy?: UserRef;
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
  nip?: string | null;
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
