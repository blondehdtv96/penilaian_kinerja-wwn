<template>
  <ion-app>
    <div class="db-shell">
      <!-- ============ SIDEBAR terang (mockup v3), role-aware ============ -->
      <aside
        v-if="auth.isAuthenticated"
        class="db-side"
        :class="{ collapsed: collapsed && !isMobile, 'mobile-open': mobileOpen }"
      >
        <div class="brand">
          <div class="logo"><img :src="brandLogo" alt="Logo Bridgestone" /></div>
          <div class="b-txt" v-show="!isCollapsed">
            <b>PT Bridgestone</b><small>Tire Curing Indonesia</small>
          </div>
        </div>

        <div class="me" v-if="auth.user">
          <div class="ava"><UserAvatar /></div>
          <div class="me-txt" v-show="!isCollapsed">
            <div class="nm">{{ auth.user.fullName }}</div>
            <div class="em">{{ auth.user.email }}</div>
            <span class="role" :class="roleClass">{{ auth.user.role }}</span>
          </div>
        </div>

        <div class="nav-label" v-show="!isCollapsed">Navigasi Utama</div>
        <a
          v-for="item in menu"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item) }"
          role="link"
          tabindex="0"
          :aria-current="isActive(item) ? 'page' : undefined"
          @click="navigate(item.path)"
          @keydown.enter="navigate(item.path)"
          @keydown.space.prevent="navigate(item.path)"
          @mouseenter="showTip($event, item.title)"
          @mouseleave="hideTip"
        >
          <ion-icon :icon="item.icon" />
          <span v-show="!isCollapsed">{{ item.title }}</span>
        </a>

        <div class="spacer"></div>

        <div class="chain" v-show="!isCollapsed">
          <span class="dot"></span> Blockchain Aktif
        </div>
        <button class="signout" @click="logout" aria-label="Keluar">
          <ion-icon :icon="icons.logout" />
          <span v-show="!isCollapsed">Keluar</span>
        </button>
      </aside>

      <!-- tooltip saat rail diciutkan -->
      <div v-if="tip" class="nav-tip" :style="{ top: tip.y + 'px' }">{{ tip.label }}</div>

      <!-- backdrop drawer mobile -->
      <div
        v-if="auth.isAuthenticated && isMobile && mobileOpen"
        class="db-backdrop"
        @click="closeMobile"
      ></div>

      <ion-router-outlet class="db-outlet" />
    </div>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonIcon } from '@ionic/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { useNotificationsStore } from '@/stores/notifications';
import { useSidebar } from '@/composables/useSidebar';
import brandLogo from '@/assets/bridgestone-logo.png';
import UserAvatar from '@/components/UserAvatar.vue';
import {
  gridOutline, qrCodeOutline, bulbOutline, documentTextOutline,
  checkmarkDoneOutline, alertCircleOutline,
  peopleOutline, trophyOutline, ribbonOutline, trendingUpOutline,
  downloadOutline, cubeOutline, fingerPrintOutline, shieldCheckmarkOutline,
  locationOutline, personOutline, logOutOutline, listOutline, warningOutline,
} from 'ionicons/icons';

const auth = useAuthStore();
const socket = useSocketStore();
const router = useRouter();
const route = useRoute();
const { collapsed, mobileOpen, isMobile, init, teardown, closeMobile } = useSidebar();

const icons = { logout: logOutOutline };

const isCollapsed = computed(() => collapsed.value && !isMobile.value);
const roleClass = computed(() => (auth.user?.role ?? '').toLowerCase().replace(/\s+/g, ''));

interface MenuItem { title: string; path: string; icon: string; roles?: string[] }

const allMenu: MenuItem[] = [
  { title: 'Dashboard KPI', path: '/dashboard', icon: gridOutline, roles: ['Section Manager'] },
  { title: 'Dashboard', path: '/performance', icon: gridOutline, roles: ['Operator'] },
  { title: 'Scan Area QR', path: '/scan', icon: qrCodeOutline, roles: ['Operator'] },
  { title: 'Ajukan VoO / Ide Kaizen', path: '/voo/submit', icon: bulbOutline, roles: ['Operator'] },
  { title: 'Pengajuan Saya', path: '/voo/my', icon: documentTextOutline, roles: ['Operator'] },
  { title: 'Pelanggaran Saya', path: '/my-misconduct', icon: warningOutline, roles: ['Operator'] },
  { title: 'Persetujuan VoO', path: '/voo/approve', icon: checkmarkDoneOutline, roles: ['Foreman'] },
  { title: 'Pembinaan & Pelanggaran', path: '/records/pembinaan', icon: alertCircleOutline, roles: ['Foreman', 'Section Manager'] },
  { title: 'Monitor Operator', path: '/operators', icon: peopleOutline, roles: ['Foreman', 'Section Manager'] },
  { title: 'Persetujuan Final', path: '/voo/final', icon: ribbonOutline, roles: ['Section Manager'] },
  { title: 'Ranking Operator', path: '/ranking', icon: trophyOutline, roles: ['Section Manager'] },
  { title: 'Analisis Tren', path: '/trends', icon: trendingUpOutline, roles: ['Section Manager'] },
  { title: 'Export Laporan', path: '/reports', icon: downloadOutline, roles: ['Section Manager'] },
  { title: 'Blockchain', path: '/blockchain', icon: cubeOutline, roles: ['Section Manager'] },
  { title: 'Log Audit', path: '/audit', icon: fingerPrintOutline, roles: ['Section Manager'] },
  { title: 'Katalog Pelanggaran', path: '/violation-types', icon: listOutline, roles: ['Section Manager'] },
  { title: 'Monitor VoO / Kaizen', path: '/staff/voo-monitor', icon: bulbOutline, roles: ['Staff Produksi'] },
  { title: 'Monitor Pelanggaran', path: '/staff/misconduct-monitor', icon: alertCircleOutline, roles: ['Staff Produksi'] },
  { title: 'Kelola Operator', path: '/staff/operators', icon: peopleOutline, roles: ['Staff Produksi'] },
  { title: 'Kelola User', path: '/admin/users', icon: peopleOutline, roles: ['Super Admin'] },
  { title: 'Kelola Role', path: '/admin/roles', icon: shieldCheckmarkOutline, roles: ['Super Admin'] },
  { title: 'Lokasi QR', path: '/admin/qr-locations', icon: locationOutline, roles: ['Super Admin'] },
  { title: 'Profil Saya', path: '/profile', icon: personOutline },
];

const menu = computed(() =>
  allMenu.filter((m) => !m.roles || auth.hasAnyRole(m.roles))
);

const isActive = (item: MenuItem) =>
  route.path === item.path || route.path.startsWith(item.path + '/');

const navigate = (path: string) => {
  router.push(path);
  closeMobile();
};

const logout = () => {
  auth.logout();
  closeMobile();
  router.push('/login');
};

// tooltip rail ciut
const tip = ref<{ label: string; y: number } | null>(null);
const showTip = (e: MouseEvent, label: string) => {
  if (!isCollapsed.value) return;
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  tip.value = { label, y: r.top + r.height / 2 };
};
const hideTip = () => { tip.value = null; };

// Heartbeat validitas sesi: token bisa jadi basi (mis. setelah database
// di-reset/di-seed ulang, userId di token lama sudah tidak ada) tanpa user
// pernah melihat error apa pun sampai request berikutnya gagal. Alih-alih
// menunggu itu terjadi di halaman manapun lalu menampilkan pesan yang
// membingungkan, validasi sesi secara berkala di latar belakang — begitu
// backend membalas 401, interceptor di services/api.ts otomatis membersihkan
// sesi & redirect ke /login, tanpa user perlu me-refresh halaman.
let sessionCheck: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  init();
  if (auth.isAuthenticated) {
    socket.connect();
    useNotificationsStore().fetch();
    auth.refreshUser();
    sessionCheck = setInterval(() => {
      if (auth.isAuthenticated) auth.refreshUser();
    }, 30000);
  }
});
onUnmounted(() => {
  teardown();
  if (sessionCheck) clearInterval(sessionCheck);
});
</script>

<style scoped>
.db-shell {
  display: flex;
  height: 100%;
  width: 100%;
  background: var(--db-canvas);
}

/* ---------- Sidebar terang ---------- */
.db-side {
  flex-shrink: 0;
  width: 252px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: var(--db-canvas);
  transition: width 0.18s ease;
}
.db-side::-webkit-scrollbar { width: 0; }
.db-side.collapsed { width: 74px; }

.brand { display: flex; align-items: center; gap: 11px; padding: 6px 8px 12px; }
.brand .logo {
  width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px;
  background: #fff; display: grid; place-items: center; overflow: hidden;
  border: 1px solid var(--db-line); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.brand .logo img { width: 100%; height: 100%; object-fit: contain; display: block; }
.b-txt b { font-size: 14.5px; font-weight: 700; line-height: 1.15; display: block; }
.b-txt small { font-size: 11px; color: var(--db-ink-3); }

.me {
  display: flex; align-items: center; gap: 11px; padding: 11px 8px;
  border-radius: 12px; background: var(--db-card); box-shadow: var(--db-shadow); margin-bottom: 6px;
}
.me .ava {
  width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%;
  background: var(--db-brand); color: #fff; display: grid; place-items: center;
  font-weight: 700; font-size: 14px; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}
.me .nm { font-size: 13px; font-weight: 700; line-height: 1.2; }
.me .em { font-size: 10.5px; color: var(--db-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
.me .role {
  display: inline-block; margin-top: 3px; font-size: 9px; font-weight: 700;
  letter-spacing: 0.05em; padding: 2px 7px; border-radius: 5px; text-transform: uppercase;
  color: var(--db-role-admin-ink); background: var(--db-role-admin-bg);
}
.role.sectionmanager { color: var(--db-role-manager-ink); background: var(--db-role-manager-bg); }
.role.foreman { color: var(--db-role-foreman-ink); background: var(--db-role-foreman-bg); }
.role.operator { color: var(--db-role-operator-ink); background: var(--db-role-operator-bg); }
.role.staffproduksi { color: #065f46; background: #d1fae5; }

.nav-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: var(--db-ink-3);
  text-transform: uppercase; padding: 14px 10px 6px;
}
.nav-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 11px;
  color: var(--db-ink-2); font-weight: 500; font-size: 13.5px; cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease; white-space: nowrap; outline: none;
}
.nav-item ion-icon { font-size: 20px; flex-shrink: 0; opacity: 0.85; }
.nav-item:hover { background: rgba(120, 120, 130, 0.1); color: var(--db-ink); }
.nav-item:focus-visible { outline: 2px solid var(--db-brand); outline-offset: -2px; }
.nav-item.active { background: var(--db-card); color: var(--db-ink); font-weight: 600; box-shadow: var(--db-shadow); }
.nav-item.active ion-icon { color: var(--db-brand); opacity: 1; }

.spacer { flex: 1; min-height: 8px; }
.chain { display: flex; align-items: center; gap: 8px; padding: 10px 12px; font-size: 12px; color: var(--db-ink-2); }
.chain .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--db-green); box-shadow: 0 0 8px var(--db-green); }
.signout {
  display: flex; align-items: center; gap: 10px; justify-content: center; padding: 11px;
  border-radius: 11px; background: var(--db-red-bg); color: var(--db-red-ink);
  font-weight: 600; font-size: 13px; border: 1px solid rgba(239, 68, 68, 0.18);
}
.signout ion-icon { font-size: 18px; }

/* Collapsed */
.db-side.collapsed .brand { justify-content: center; }
.db-side.collapsed .me { justify-content: center; padding: 11px 0; }
.db-side.collapsed .nav-item { justify-content: center; gap: 0; padding: 10px 0; }
.db-side.collapsed .signout { padding: 11px 0; }

/* Tooltip rail ciut */
.nav-tip {
  position: fixed; left: 84px; transform: translateY(-50%); background: var(--db-ink);
  color: var(--db-canvas); padding: 0.35rem 0.6rem; border-radius: 6px; font-size: 0.75rem;
  font-weight: 500; white-space: nowrap; z-index: 70; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

/* Outlet (kertas yang digulir ada di dalam tiap halaman via PageShell) */
.db-outlet { position: relative; flex: 1; min-width: 0; height: 100%; }

/* Mobile drawer */
.db-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); z-index: 55; }
@media (max-width: 767px) {
  .db-side {
    position: fixed; top: 0; left: 0; bottom: 0; width: 252px;
    transform: translateX(-100%); z-index: 60;
  }
  .db-side.mobile-open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0, 0, 0, 0.25); }
}
</style>
