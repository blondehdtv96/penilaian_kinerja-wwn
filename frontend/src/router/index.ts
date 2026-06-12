import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/operators',
    name: 'Operators',
    component: () => import('@/pages/operators/OperatorListPage.vue'),
    meta: { requiresAuth: true, roles: ['Super Admin', 'Staff Produksi'] }
  },
  {
    path: '/operators/:id',
    name: 'OperatorDetail',
    component: () => import('@/pages/operators/OperatorDetailPage.vue'),
    meta: { requiresAuth: true, roles: ['Super Admin', 'Staff Produksi', 'Operator'] }
  },
  {
    path: '/my-performance',
    name: 'MyPerformance',
    component: () => import('@/pages/MyPerformancePage.vue'),
    meta: { requiresAuth: true, roles: ['Operator'] }
  },
  {
    path: '/merit',
    name: 'Merit',
    component: () => import('@/pages/merit/MeritListPage.vue'),
    meta: { requiresAuth: true, roles: ['Staff Produksi', 'Foreman', 'Operator'] }
  },
  {
    path: '/merit/create',
    name: 'CreateMerit',
    component: () => import('@/pages/merit/CreateMeritPage.vue'),
    meta: { requiresAuth: true, roles: ['Foreman'] }
  },
  {
    path: '/misconduct',
    name: 'Misconduct',
    component: () => import('@/pages/misconduct/MisconductListPage.vue'),
    meta: { requiresAuth: true, roles: ['Staff Produksi', 'Foreman', 'Operator'] }
  },
  {
    path: '/misconduct/create',
    name: 'CreateMisconduct',
    component: () => import('@/pages/misconduct/CreateMisconductPage.vue'),
    meta: { requiresAuth: true, roles: ['Foreman'] }
  },
  {
    path: '/blockchain',
    name: 'Blockchain',
    component: () => import('@/pages/blockchain/BlockchainPage.vue'),
    meta: { requiresAuth: true, roles: ['Super Admin', 'Manager'] }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/pages/reports/ReportsPage.vue'),
    meta: { requiresAuth: true, roles: ['Staff Produksi', 'Super Admin'] }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('@/pages/RankingPage.vue'),
    meta: { requiresAuth: true, roles: ['Operator', 'Super Admin', 'Staff Produksi'] }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/pages/admin/UsersPage.vue'),
    meta: { requiresAuth: true, roles: ['Super Admin'] }
  },
  {
    path: '/roles',
    name: 'Roles',
    component: () => import('@/pages/admin/RolesPage.vue'),
    meta: { requiresAuth: true, roles: ['Super Admin'] }
  },
  {
    path: '/permissions',
    name: 'Permissions',
    component: () => import('@/pages/admin/PermissionsPage.vue'),
    meta: { requiresAuth: true, roles: ['Super Admin'] }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth !== false;
  const requiredRoles = to.meta.roles as string[] | undefined;

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (requiredRoles && !authStore.hasAnyRole(requiredRoles)) {
    next('/dashboard');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
