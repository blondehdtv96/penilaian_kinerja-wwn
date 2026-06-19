// Tipe domain V2 (acuan: backend/prisma/schema.prisma & controller).

export type RoleName = 'Super Admin' | 'Section Manager' | 'Foreman' | 'Operator';

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
