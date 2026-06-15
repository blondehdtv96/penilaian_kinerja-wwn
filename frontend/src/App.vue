<template>
  <ion-app>
    <div class="app-shell">
      <!-- ============ Collapsible Sidebar (custom, replaces ion-menu) ============ -->
      <aside
        v-if="authStore.isAuthenticated"
        class="sidebar"
        :class="{ collapsed: collapsed && !isMobile, 'mobile-open': mobileOpen }"
      >
        <!-- Brand (toggle now lives in the topbar) -->
        <div class="brand-header">
          <div class="brand-row">
            <div class="logo-circle">B</div>
            <div class="brand-info">
              <h2>PT Bridgestone</h2>
              <p>Tire Indonesia</p>
            </div>
          </div>
        </div>

        <!-- User Profile -->
        <div class="user-profile-section" v-if="authStore.user">
          <div class="user-avatar">
            {{ authStore.user.fullName.charAt(0).toUpperCase() }}
          </div>
          <div class="user-details">
            <h3>{{ authStore.user.fullName }}</h3>
            <p class="user-email">{{ authStore.user.email }}</p>
            <div class="badge-container">
              <span
                v-for="role in authStore.user.roles"
                :key="role"
                class="role-badge"
                :class="getRoleBadgeClass(role)"
              >
                {{ role }}
              </span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="nav-content">
          <div class="menu-section-title">MAIN NAVIGATION</div>
          <div class="nav-list">
            <div
              v-for="item in filteredMenuItems"
              :key="item.path"
              class="nav-item"
              :class="{ active: router.currentRoute.value.path === item.path }"
              :aria-current="router.currentRoute.value.path === item.path ? 'page' : undefined"
              tabindex="0"
              role="link"
              @click="navigateTo(item.path)"
              @keydown.enter="navigateTo(item.path)"
              @keydown.space.prevent="navigateTo(item.path)"
              @mouseenter="showTip($event, item.title)"
              @mouseleave="hideTip"
            >
              <ion-icon :icon="item.icon" class="nav-icon"></ion-icon>
              <span class="nav-label">{{ item.title }}</span>
              <div class="active-indicator"></div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="sidebar-footer">
          <div
            class="logout-btn"
            @click="handleLogout"
            @mouseenter="showTip($event, 'Sign Out')"
            @mouseleave="hideTip"
          >
            <ion-icon :icon="logOutOutline" class="logout-icon"></ion-icon>
            <span class="logout-label">Sign Out</span>
          </div>
          <div class="system-status">
            <div class="status-dot"></div>
            <span class="status-label">Blockchain: Connected</span>
          </div>
        </div>
      </aside>

      <!-- Collapsed-rail hover tooltip (rendered outside the clipping scroll area) -->
      <div v-if="tip" class="nav-tooltip" :style="{ top: tip.y + 'px' }">{{ tip.label }}</div>

      <!-- Mobile backdrop -->
      <div
        v-if="authStore.isAuthenticated && isMobile && mobileOpen"
        class="sidebar-backdrop"
        @click="closeMobile"
      ></div>

      <!-- Main Content Outlet -->
      <main class="main-area" :class="{ 'main-area--flush': isDashboard }">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonIcon } from '@ionic/vue';
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { useSidebar } from '@/composables/useSidebar';
import {
  gridOutline,
  peopleOutline,
  shieldCheckmarkOutline,
  cubeOutline,
  barChartOutline,
  alertCircleOutline,
  documentTextOutline,
  addCircleOutline,
  listOutline,
  personOutline,
  ribbonOutline,
  logOutOutline
} from 'ionicons/icons';

const authStore = useAuthStore();
const socketStore = useSocketStore();
const router = useRouter();

// DashboardPage renders its own paper-scroll panel (single rounded surface on a light
// canvas). Flatten the shell frame for that route only so corners/backgrounds don't stack.
const isDashboard = computed(() => router.currentRoute.value.name === 'Dashboard');

// ---- Sidebar collapse / responsive state (shared with the topbar toggle) ----
const { collapsed, mobileOpen, isMobile, init: initSidebar, teardown: teardownSidebar, closeMobile } = useSidebar();
const tip = ref<{ label: string; y: number } | null>(null);

const showTip = (e: MouseEvent, label: string) => {
  if (!collapsed.value || isMobile.value) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  tip.value = { label, y: rect.top + rect.height / 2 };
};
const hideTip = () => { tip.value = null; };

// Seeding all possible menu items
const allMenuItems = [
  { title: 'Dashboard KPI', path: '/dashboard', icon: gridOutline, roles: ['Super Admin', 'Manager', 'Staff Produksi', 'Operator'] },
  { title: 'Kelola User', path: '/users', icon: peopleOutline, roles: ['Super Admin'] },
  { title: 'Kelola Role', path: '/roles', icon: shieldCheckmarkOutline, roles: ['Super Admin'] },
  { title: 'Kelola Permission', path: '/permissions', icon: shieldCheckmarkOutline, roles: ['Super Admin'] },
  { title: 'Monitoring Kinerja', path: '/operators', icon: barChartOutline, roles: ['Staff Produksi'] },
  { title: 'Kinerja Saya', path: '/my-performance', icon: barChartOutline, roles: ['Operator'] },
  { title: 'Merit List', path: '/merit', icon: listOutline, roles: ['Staff Produksi', 'Foreman', 'Operator'] },
  { title: 'Input Merit', path: '/merit/create', icon: addCircleOutline, roles: ['Foreman'] },
  { title: 'Misconduct List', path: '/misconduct', icon: listOutline, roles: ['Staff Produksi', 'Foreman', 'Operator'] },
  { title: 'Input Misconduct', path: '/misconduct/create', icon: alertCircleOutline, roles: ['Foreman'] },
  { title: 'Blockchain Integrity', path: '/blockchain', icon: cubeOutline, roles: ['Super Admin', 'Manager'] },
  { title: 'Export Laporan', path: '/reports', icon: documentTextOutline, roles: ['Staff Produksi', 'Super Admin'] },
  { title: 'Ranking Kinerja', path: '/ranking', icon: ribbonOutline, roles: ['Operator', 'Super Admin', 'Staff Produksi'] },
  { title: 'My Profile', path: '/profile', icon: personOutline, roles: ['Super Admin', 'Manager', 'Staff Produksi', 'Foreman', 'Operator'] }
];

// Computed list filtered by authenticated user's roles
const filteredMenuItems = computed(() => {
  if (!authStore.user) return [];
  return allMenuItems.filter(item => {
    return authStore.user?.roles.some(role => item.roles.includes(role));
  });
});

const getRoleBadgeClass = (role: string) => {
  return role.toLowerCase().replace(/\s+/g, '');
};

const navigateTo = (path: string) => {
  router.push(path);
  closeMobile();
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
  closeMobile();
};

onMounted(() => {
  initSidebar();

  // Auth is already initialized in main.ts before router resolves
  if (authStore.isAuthenticated) {
    socketStore.connect();
  }
});

onUnmounted(() => {
  teardownSidebar();
});
</script>

<style>
/* Import global style variables if any */
@import './assets/styles/global.css';

/* ============ App Shell ============ */
.app-shell {
  position: absolute;
  inset: 0;
  display: flex;
  /* Dark rail color fills the gap around the floating content panel. */
  background: #111827;
}

/* Main content area floats above the dark rail as a rounded panel, and is the
   positioned containing block for the routed .ion-page (position:absolute inset:0). */
.main-area {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.10);
  background: #f8fafc;
  margin: 8px;
  z-index: 1;
}

/* Dashboard route only: neutralize the shell's frame so the page's own .db-panel is the
   single rounded surface, floating on a LIGHT canvas (not the dark rail showing through a
   margin). Keeps overflow:hidden from the base rule, so .db-main remains the sole scroller. */
.app-shell .main-area--flush {
  margin: 0;
  border-radius: 0;
  box-shadow: none;
  background: #ffffff;
}

/* ============ Sidebar ============ */
.sidebar {
  flex-shrink: 0;
  width: 240px;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #111827; /* Dark rail */
  color: #f3f4f6;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  border-right: 1px solid #1f2937;
  transition: width 200ms ease, transform 200ms ease;
  /* Desktop: behind the floating content panel. Mobile overrides to overlay. */
  z-index: 0;
}

.sidebar.collapsed {
  width: 64px;
}

/* Brand Header */
.brand-header {
  position: relative;
  padding: 1rem;
  background: #1f2937;
}

.brand-header::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  background: #ef4444; /* Bridgestone red strip */
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-circle {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.25rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
  transition: width 200ms ease, height 200ms ease, font-size 200ms ease;
}

.brand-info {
  flex: 1;
  overflow: hidden;
}

.brand-info h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: white;
  line-height: 1.2;
  white-space: nowrap;
}

.brand-info p {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
  letter-spacing: 0.05em;
  font-weight: 500;
  white-space: nowrap;
}

/* Collapsed brand: center the logo, hide text (toggle lives in the topbar now) */
.sidebar.collapsed .brand-row {
  justify-content: center;
}
.sidebar.collapsed .brand-info { display: none; }
.sidebar.collapsed .logo-circle {
  width: 32px;
  height: 32px;
  font-size: 1.1rem;
}

/* User Profile Section */
.user-profile-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #1f2937;
  background: #111827;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}

.user-details {
  flex: 1;
  overflow: hidden;
}

.user-details h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.15rem 0;
  color: #f3f4f6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0 0 0.4rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.role-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.role-badge.superadmin { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
.role-badge.hrd        { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
.role-badge.manager    { background: rgba(139, 92, 246, 0.15); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.3); }
.role-badge.supervisor { background: rgba(249, 115, 22, 0.15); color: #ff9736; border: 1px solid rgba(249, 115, 22, 0.3); }
.role-badge.operator   { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }

/* Collapsed profile: avatar only */
.sidebar.collapsed .user-profile-section {
  justify-content: center;
  padding: 1rem 0;
}
.sidebar.collapsed .user-details { display: none; }

/* Navigation Content */
.nav-content {
  flex: 1;
  padding: 1.5rem 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.menu-section-title {
  padding: 0 1.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #4b5563;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
}
.sidebar.collapsed .menu-section-title { display: none; }

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  transition: background 0.25s ease, color 0.25s ease, padding 0.25s ease;
  font-size: 0.9rem;
  font-weight: 500;
  outline: none;
}

.nav-item:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: -2px;
  border-radius: 4px;
}

.nav-item:hover {
  background: rgba(31, 41, 55, 0.5);
  color: #ffffff;
  padding-left: 1.75rem;
}

.nav-item.active {
  background: rgba(239, 68, 68, 0.08);
  color: #ffffff;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.nav-item:hover .nav-icon { transform: scale(1.1); }
.nav-item.active .nav-icon { color: #ef4444; }

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  max-width: 180px;
  opacity: 1;
  /* fade in on expand, after the width has opened up */
  transition: opacity 150ms ease 150ms, max-width 200ms ease;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #ef4444;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.nav-item.active .active-indicator { opacity: 1; }

/* Collapsed nav: center icons, clip labels */
.sidebar.collapsed .nav-item {
  justify-content: center;
  gap: 0;
  padding: 0.85rem 0;
}
.sidebar.collapsed .nav-item:hover { padding-left: 0; }
.sidebar.collapsed .nav-label {
  max-width: 0;
  opacity: 0;
  transition: opacity 80ms ease, max-width 200ms ease;
}

/* Collapsed-rail hover tooltip */
.nav-tooltip {
  position: fixed;
  left: 72px;
  transform: translateY(-50%);
  background: #1f2937;
  color: #ffffff;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  z-index: 70;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid #1f2937;
  background: #111827;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #fca5a5;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}

.logout-btn:hover {
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.logout-icon { font-size: 1.2rem; flex-shrink: 0; }

.logout-label {
  white-space: nowrap;
  overflow: hidden;
  max-width: 120px;
  opacity: 1;
  transition: opacity 150ms ease 150ms, max-width 200ms ease;
}

.system-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.7rem;
  color: #6b7280;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  flex-shrink: 0;
}

.status-label { white-space: nowrap; }

/* Collapsed footer */
.sidebar.collapsed .sidebar-footer { padding: 1rem 0.5rem; }
.sidebar.collapsed .logout-btn { padding: 0.75rem 0; }
.sidebar.collapsed .logout-label {
  max-width: 0;
  opacity: 0;
  transition: opacity 80ms ease, max-width 200ms ease;
}
.sidebar.collapsed .status-label { display: none; }

/* ============ Mobile drawer ============ */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 55;
}

@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 240px;
    transform: translateX(-100%);
    z-index: 60; /* overlay above the backdrop + content on mobile */
  }
  .sidebar.mobile-open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.35);
  }
}

/* Page Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
