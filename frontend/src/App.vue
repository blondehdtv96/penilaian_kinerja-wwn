<template>
  <ion-app>
    <ion-split-pane content-id="main-content" when="lg">
      <!-- Sidemenu (Only visible when authenticated) -->
      <ion-menu v-if="authStore.isAuthenticated" content-id="main-content" type="overlay">
        <div class="sidebar-container">
          <!-- Top Brand Header (PT Bridgestone style) -->
          <div class="brand-header">
            <div class="logo-circle">B</div>
            <div class="brand-info">
              <h2>PT Bridgestone</h2>
              <p>Tire Indonesia</p>
            </div>
            <div class="red-bar"></div>
          </div>

          <!-- User Profile Section -->
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

          <!-- Navigation Items List -->
          <div class="nav-content">
            <div class="menu-section-title">MAIN NAVIGATION</div>
            <div class="nav-list">
              <ion-menu-toggle :auto-hide="false" v-for="item in filteredMenuItems" :key="item.path">
                <div
                  class="nav-item"
                  :class="{ active: router.currentRoute.value.path === item.path }"
                  :aria-current="router.currentRoute.value.path === item.path ? 'page' : undefined"
                  tabindex="0"
                  role="link"
                  @click="navigateTo(item.path)"
                  @keydown.enter="navigateTo(item.path)"
                  @keydown.space.prevent="navigateTo(item.path)"
                >
                  <ion-icon :icon="item.icon" class="nav-icon"></ion-icon>
                  <span class="nav-label">{{ item.title }}</span>
                  <div class="active-indicator"></div>
                </div>
              </ion-menu-toggle>
            </div>
          </div>

          <!-- Sidebar Footer -->
          <div class="sidebar-footer">
            <ion-menu-toggle :auto-hide="false">
              <div class="logout-btn" @click="handleLogout">
                <ion-icon :icon="logOutOutline" class="logout-icon"></ion-icon>
                <span>Sign Out</span>
              </div>
            </ion-menu-toggle>
            <div class="system-status">
              <div class="status-dot"></div>
              <span>Blockchain: Connected</span>
            </div>
          </div>
        </div>
      </ion-menu>

      <!-- Main Content Outlet -->
      <div id="main-content" class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </ion-split-pane>
  </ion-app>
</template>

<script setup lang="ts">
import { 
  IonApp, 
  IonSplitPane, 
  IonMenu, 
  IonIcon, 
  IonMenuToggle 
} from '@ionic/vue';
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { 
  gridOutline, 
  peopleOutline, 
  shieldCheckmarkOutline, 
  cubeOutline, 
  barChartOutline, 
  checkmarkCircleOutline, 
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

// Seeding all possible menu items
const allMenuItems = [
  {
    title: 'Dashboard KPI',
    path: '/dashboard',
    icon: gridOutline,
    roles: ['Super Admin', 'Manager', 'Staff Produksi', 'Operator']
  },
  {
    title: 'Kelola User',
    path: '/users',
    icon: peopleOutline,
    roles: ['Super Admin']
  },
  {
    title: 'Kelola Role',
    path: '/roles',
    icon: shieldCheckmarkOutline,
    roles: ['Super Admin']
  },
  {
    title: 'Kelola Permission',
    path: '/permissions',
    icon: shieldCheckmarkOutline,
    roles: ['Super Admin']
  },
  {
    title: 'Monitoring Kinerja',
    path: '/operators',
    icon: barChartOutline,
    roles: ['Staff Produksi']
  },
  {
    title: 'Kinerja Saya',
    path: '/my-performance',
    icon: barChartOutline,
    roles: ['Operator']
  },
  {
    title: 'Merit List',
    path: '/merit',
    icon: listOutline,
    roles: ['Staff Produksi', 'Foreman', 'Operator']
  },
  {
    title: 'Input Merit',
    path: '/merit/create',
    icon: addCircleOutline,
    roles: ['Foreman']
  },
  {
    title: 'Misconduct List',
    path: '/misconduct',
    icon: listOutline,
    roles: ['Staff Produksi', 'Foreman', 'Operator']
  },
  {
    title: 'Input Misconduct',
    path: '/misconduct/create',
    icon: alertCircleOutline,
    roles: ['Foreman']
  },
  {
    title: 'Blockchain Integrity',
    path: '/blockchain',
    icon: cubeOutline,
    roles: ['Super Admin', 'Manager']
  },
  {
    title: 'Export Laporan',
    path: '/reports',
    icon: documentTextOutline,
    roles: ['Staff Produksi', 'Super Admin']
  },
  {
    title: 'Ranking Kinerja',
    path: '/ranking',
    icon: ribbonOutline,
    roles: ['Operator', 'Super Admin', 'Staff Produksi']
  },
  {
    title: 'My Profile',
    path: '/profile',
    icon: personOutline,
    roles: ['Super Admin', 'Manager', 'Staff Produksi', 'Foreman', 'Operator']
  }
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
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(() => {
  // Auth is already initialized in main.ts before router resolves
  // Just connect socket if already authenticated
  if (authStore.isAuthenticated) {
    socketStore.connect();
  }
});
</script>

<style>
/* Import global style variables if any */
@import './assets/styles/global.css';

/* Custom Sidemenu Styling */
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #111827; /* Dark charcoal */
  color: #f3f4f6;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  border-right: 1px solid #1f2937;
}

/* Brand Header */
.brand-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #1f2937;
}

.logo-circle {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #ef4444; /* Bridgestone Red */
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.25rem;
  color: white;
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
}

.brand-info h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: white;
  line-height: 1.2;
}

.brand-info p {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.red-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #ef4444; /* Bridgestone red strip */
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

.role-badge.superadmin {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.role-badge.hrd {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.role-badge.manager {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.role-badge.supervisor {
  background: rgba(249, 115, 22, 0.15);
  color: #ff9736;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.role-badge.operator {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Navigation Content */
.nav-content {
  flex: 1;
  padding: 1.5rem 0;
  overflow-y: auto;
}

.menu-section-title {
  padding: 0 1.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #4b5563;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
}

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
  transition: all 0.25s ease;
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
  padding-left: 1.75rem; /* Micro slide */
}

.nav-item.active {
  background: rgba(239, 68, 68, 0.08);
  color: #ffffff;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.25rem;
  transition: transform 0.25s ease;
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-item.active .nav-icon {
  color: #ef4444; /* active indicator icon */
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

.nav-item.active .active-indicator {
  opacity: 1;
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
  transition: all 0.25s ease;
}

.logout-btn:hover {
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.logout-icon {
  font-size: 1.2rem;
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
}

/* Main Content Area */
.main-content {
  position: relative;
  height: 100%;
  overflow-y: auto;
  background: #f5f7fa;
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
