import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Halaman yang belum dibangun di fase ini diarahkan ke placeholder agar IA lengkap
// & build tetap hijau. Di fase berikutnya, import-nya diganti komponen asli.
const ComingSoon = () => import('@/pages/ComingSoonPage.vue');

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
  { path: '/voo/final', name: 'VooFinal', component: ComingSoon, meta: { roles: ['Section Manager'] } },
  { path: '/ranking', name: 'Ranking', component: ComingSoon, meta: { roles: ['Section Manager'] } },
  { path: '/trends', name: 'Trends', component: ComingSoon, meta: { roles: ['Section Manager'] } },
  { path: '/reports', name: 'Reports', component: ComingSoon, meta: { roles: ['Section Manager'] } },
  { path: '/blockchain', name: 'Blockchain', component: ComingSoon, meta: { roles: ['Section Manager'] } },
  { path: '/audit', name: 'Audit', component: ComingSoon, meta: { roles: ['Section Manager'] } },

  // ---- Foreman ----
  { path: '/voo/approve', name: 'VooApprove', component: ComingSoon, meta: { roles: ['Foreman'] } },
  { path: '/records/misconduct', name: 'Misconduct', component: ComingSoon, meta: { roles: ['Foreman'] } },
  { path: '/records/counseling', name: 'Counseling', component: ComingSoon, meta: { roles: ['Foreman'] } },
  { path: '/records/kartu-kuning', name: 'KartuKuning', component: ComingSoon, meta: { roles: ['Foreman'] } },
  { path: '/records/surat-peringatan', name: 'SuratPeringatan', component: ComingSoon, meta: { roles: ['Foreman'] } },
  { path: '/operators', name: 'Operators', component: ComingSoon, meta: { roles: ['Foreman', 'Section Manager'] } },
  { path: '/operators/:id', name: 'OperatorDetail', component: ComingSoon, meta: { roles: ['Foreman', 'Section Manager'] } },

  // ---- Operator ----
  { path: '/scan', name: 'Scan', component: ComingSoon, meta: { roles: ['Operator'] } },
  { path: '/voo/submit', name: 'VooSubmit', component: ComingSoon, meta: { roles: ['Operator'] } },
  { path: '/voo/my', name: 'VooMy', component: ComingSoon, meta: { roles: ['Operator'] } },
  { path: '/performance', name: 'Performance', component: ComingSoon, meta: { roles: ['Operator'] } },

  // ---- Super Admin ----
  { path: '/admin/users', name: 'AdminUsers', component: ComingSoon, meta: { roles: ['Super Admin'] } },
  { path: '/admin/roles', name: 'AdminRoles', component: ComingSoon, meta: { roles: ['Super Admin'] } },
  { path: '/admin/qr-locations', name: 'AdminQrLocations', component: ComingSoon, meta: { roles: ['Super Admin'] } },

  // ---- Umum (semua role) ----
  { path: '/profile', name: 'Profile', component: ComingSoon },

  { path: '/:pathMatch(.*)*', redirect: () => landingFor(useAuthStore().role) },
];

// Tujuan default tiap peran setelah login / saat akses ditolak.
export function landingFor(role: string | null): string {
  switch (role) {
    case 'Operator':
      return '/performance';
    case 'Foreman':
      return '/voo/approve';
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
