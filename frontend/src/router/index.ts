import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: () => landingFor(useAuthStore().role),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { requiresAuth: false },
  },

  // ---- Section Manager / Super Admin ----
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/DashboardKPIPage.vue'),
    meta: { roles: ['Section Manager'] },
  },
  { path: '/voo/final', name: 'VooFinal', component: () => import('@/pages/manager/VooFinalPage.vue'), meta: { roles: ['Section Manager'] } },
  { path: '/ranking', name: 'Ranking', component: () => import('@/pages/manager/RankingPage.vue'), meta: { roles: ['Section Manager'] } },
  { path: '/trends', name: 'Trends', component: () => import('@/pages/manager/TrendsPage.vue'), meta: { roles: ['Section Manager'] } },
  { path: '/reports', name: 'Reports', component: () => import('@/pages/manager/ReportsPage.vue'), meta: { roles: ['Section Manager'] } },
  { path: '/blockchain', name: 'Blockchain', component: () => import('@/pages/manager/BlockchainPage.vue'), meta: { roles: ['Section Manager'] } },
  { path: '/audit', name: 'Audit', component: () => import('@/pages/manager/AuditPage.vue'), meta: { roles: ['Section Manager'] } },
  { path: '/violation-types', name: 'ViolationTypes', component: () => import('@/pages/manager/ViolationTypesPage.vue'), meta: { roles: ['Section Manager'] } },

  // ---- Foreman ----
  { path: '/voo/approve', name: 'VooApprove', component: () => import('@/pages/foreman/VooApprovePage.vue'), meta: { roles: ['Foreman'] } },
  { path: '/records/misconduct', name: 'Misconduct', component: () => import('@/pages/foreman/MisconductPage.vue'), meta: { roles: ['Foreman', 'Section Manager'] } },
  { path: '/records/counseling', name: 'Counseling', component: () => import('@/pages/foreman/CounselingPage.vue'), meta: { roles: ['Foreman', 'Section Manager'] } },
  { path: '/records/kartu-kuning', name: 'KartuKuning', component: () => import('@/pages/foreman/KartuKuningPage.vue'), meta: { roles: ['Foreman'] } },
  { path: '/records/surat-peringatan', name: 'SuratPeringatan', component: () => import('@/pages/foreman/SuratPeringatanPage.vue'), meta: { roles: ['Foreman'] } },
  { path: '/operators', name: 'Operators', component: () => import('@/pages/operators/OperatorListPage.vue'), meta: { roles: ['Foreman', 'Section Manager'] } },
  { path: '/operators/:id', name: 'OperatorDetail', component: () => import('@/pages/operators/OperatorDetailPage.vue'), meta: { roles: ['Foreman', 'Section Manager'] } },

  // ---- Operator ----
  { path: '/scan', name: 'Scan', component: () => import('@/pages/operator/ScanPage.vue'), meta: { roles: ['Operator'] } },
  { path: '/voo/submit', name: 'VooSubmit', component: () => import('@/pages/operator/VooSubmitPage.vue'), meta: { roles: ['Operator'] } },
  { path: '/voo/my', name: 'VooMy', component: () => import('@/pages/operator/VooMyPage.vue'), meta: { roles: ['Operator'] } },
  { path: '/performance', name: 'Performance', component: () => import('@/pages/operator/PerformancePage.vue'), meta: { roles: ['Operator'] } },
  { path: '/my-misconduct', name: 'MyMisconduct', component: () => import('@/pages/operator/MyMisconductPage.vue'), meta: { roles: ['Operator'] } },

  // ---- Super Admin ----
  { path: '/admin/users', name: 'AdminUsers', component: () => import('@/pages/admin/UsersPage.vue'), meta: { roles: ['Super Admin'] } },
  { path: '/admin/roles', name: 'AdminRoles', component: () => import('@/pages/admin/RolesPage.vue'), meta: { roles: ['Super Admin'] } },
  { path: '/admin/qr-locations', name: 'AdminQrLocations', component: () => import('@/pages/admin/QrLocationsPage.vue'), meta: { roles: ['Super Admin'] } },

  // ---- Staff Produksi ----
  { path: '/staff/voo-monitor', name: 'StaffVooMonitor', component: () => import('@/pages/staff/VooMonitorPage.vue'), meta: { roles: ['Staff Produksi'] } },
  { path: '/staff/misconduct-monitor', name: 'StaffMisconductMonitor', component: () => import('@/pages/staff/MisconductMonitorPage.vue'), meta: { roles: ['Staff Produksi'] } },

  // ---- Umum (semua role) ----
  { path: '/profile', name: 'Profile', component: () => import('@/pages/ProfilePage.vue') },

  { path: '/:pathMatch(.*)*', redirect: () => landingFor(useAuthStore().role) },
];

// Tujuan default tiap peran setelah login / saat akses ditolak.
export function landingFor(role: string | null): string {
  switch (role) {
    case 'Operator':
      return '/performance';
    case 'Foreman':
      return '/voo/approve';
    case 'Staff Produksi':
      return '/staff/voo-monitor';
    case 'Section Manager':
    case 'Super Admin':
      return '/dashboard';
    default:
      return '/login';
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  const requiresAuth = to.meta.requiresAuth !== false;
  const roles = to.meta.roles as string[] | undefined;

  if (requiresAuth && !auth.isAuthenticated) {
    return { path: '/login' };
  }
  if (to.path === '/login' && auth.isAuthenticated) {
    return { path: landingFor(auth.role) };
  }
  if (roles && !auth.hasAnyRole(roles)) {
    return { path: landingFor(auth.role) };
  }
  return true;
});

export default router;
