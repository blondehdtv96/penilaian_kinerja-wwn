<template>
  <ion-page>
    <ion-content class="dashboard-content">
      <!-- ================= Glassmorphism Topbar ================= -->
      <div class="topbar">
        <div class="topbar-inner mx-auto flex max-w-[1400px] items-center justify-between gap-3">
          <!-- Left: panel toggle + page title -->
          <div class="flex items-center gap-3">
            <button
              @click="toggle"
              :aria-label="(isMobile ? !mobileOpen : collapsed) ? 'Perluas sidebar' : 'Ciutkan sidebar'"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f1f5f9] hover:text-[#111827]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
                <path :d="(isMobile ? !mobileOpen : collapsed) ? 'M14 9l3 3-3 3' : 'M15 9l-3 3 3 3'" />
              </svg>
            </button>
            <h1 class="text-lg font-semibold text-[#111827]">
              {{ isOperatorView ? 'Dashboard Kinerja Saya' : 'Dashboard KPI' }}
            </h1>
          </div>

          <!-- Right: date pill + utilities -->
          <div class="flex items-center gap-1">
            <div class="mr-1 inline-flex w-fit items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#6b7280] shadow-sm">
              <ion-icon :icon="calendarOutline" class="text-base text-[#6b7280]"></ion-icon>
              {{ currentDate }}
            </div>

            <!-- Notifications (no route yet — static placeholder with unread dot) -->
            <button
              aria-label="Notifikasi"
              class="relative flex items-center justify-center rounded-lg p-2 text-[#6b7280] transition-colors hover:text-[#111827]"
            >
              <ion-icon :icon="notificationsOutline" class="text-xl"></ion-icon>
              <span class="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ef4444]"></span>
            </button>

            <!-- Dark mode (static placeholder) -->
            <button
              aria-label="Mode gelap"
              class="flex items-center justify-center rounded-lg p-2 text-[#6b7280] transition-colors hover:text-[#111827]"
            >
              <ion-icon :icon="moonOutline" class="text-xl"></ion-icon>
            </button>

            <!-- Theme (static placeholder) -->
            <button
              aria-label="Tema warna"
              class="flex items-center justify-center rounded-lg p-2 text-[#6b7280] transition-colors hover:text-[#111827]"
            >
              <ion-icon :icon="colorPaletteOutline" class="text-xl"></ion-icon>
            </button>

            <!-- Divider -->
            <span class="mx-1 h-5 w-px bg-[#e5e7eb]"></span>

            <!-- User avatar -->
            <button
              @click="goToProfile"
              aria-label="Profil saya"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#ef4444] text-sm font-semibold text-white"
            >
              {{ userInitial }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div class="h-9 w-9 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#ef4444]"></div>
        <p class="text-sm text-[#6b7280]">Memuat dashboard…</p>
      </div>

      <div v-else class="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6">
        <p class="text-sm text-[#6b7280]">Selamat datang, {{ authStore.user?.fullName }}</p>

        <!-- ======================================================= -->
        <!-- OPERATOR PERSONAL DASHBOARD VIEW                         -->
        <!-- ======================================================= -->
        <template v-if="isOperatorView">
          <!-- No Operator Record Warning -->
          <div v-if="!dashboard?.operator" class="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center shadow-sm">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f8fafc] text-[#6b7280]">
              <ion-icon :icon="personOutline" class="text-2xl"></ion-icon>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-[#111827]">Profil Operator Belum Terdaftar</h3>
            <p class="mt-1 text-sm text-[#6b7280]">Hubungi administrator untuk mendaftarkan data operator Anda.</p>
          </div>

          <template v-else>
            <!-- Operator Identity Card -->
            <div class="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#f8fafc] text-xl font-bold text-[#111827] ring-1 ring-[#e5e7eb]">
                {{ getInitial(authStore.user?.fullName) }}
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="text-lg font-bold text-[#111827]">{{ authStore.user?.fullName }}</h2>
                <p class="text-sm text-[#6b7280]">{{ dashboard.operator.department?.name }} · {{ dashboard.operator.shift?.name }}</p>
                <p class="mt-0.5 text-xs text-[#6b7280]">ID: {{ dashboard.operator.employeeId }} · {{ dashboard.operator.position }}</p>
              </div>
              <div class="flex-shrink-0 rounded-lg bg-[#f8fafc] px-5 py-3 text-center">
                <div class="text-2xl font-bold leading-none text-[#111827]">#{{ dashboard.summary.ranking }}</div>
                <div class="mt-1 text-xs text-[#6b7280]">Peringkat</div>
              </div>
            </div>

            <!-- Personal Stat Cards -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div
                v-for="stat in operatorStats"
                :key="stat.label"
                class="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f8fafc] text-[#6b7280] ring-1 ring-[#e5e7eb]">
                    <ion-icon :icon="stat.icon" class="text-[18px]"></ion-icon>
                  </div>
                  <span class="text-sm font-medium text-[#6b7280]">{{ stat.label }}</span>
                </div>
                <div class="mt-4 text-3xl font-bold text-[#111827]">{{ stat.value }}</div>
                <p class="mt-1 text-xs text-[#6b7280]">{{ stat.hint }}</p>
              </div>
            </div>

            <!-- Personal Activity Feed -->
            <div class="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-base font-semibold text-[#111827]">Aktivitas Terbaru</h2>
              </div>
              <div v-if="!activityFeed.length" class="py-10 text-center text-sm text-[#6b7280]">
                Belum ada aktivitas tercatat
              </div>
              <div v-else>
                <!-- column header -->
                <div class="-mx-5 hidden items-center gap-3 border-b border-[#e5e7eb] px-5 pb-2 text-xs font-medium text-[#6b7280] sm:flex">
                  <span class="w-9"></span>
                  <span class="flex-1">Aktivitas</span>
                  <span class="w-28">Tanggal</span>
                  <span class="w-24">Jenis</span>
                  <span class="w-16 text-right">Poin</span>
                </div>
                <div
                  v-for="item in activityFeed"
                  :key="item.id"
                  class="-mx-5 flex items-center gap-3 border-b border-[#e5e7eb] px-5 py-3 transition-colors last:border-0 hover:bg-[#f8fafc]"
                >
                  <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#f8fafc] text-sm font-semibold text-[#6b7280] ring-1 ring-[#e5e7eb]">
                    {{ getInitial(item.name) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-[#111827]">{{ item.name }}</div>
                    <div v-if="item.detail" class="truncate text-xs text-[#6b7280]">{{ item.detail }}</div>
                  </div>
                  <span class="hidden w-28 text-xs text-[#6b7280] sm:block">{{ formatDate(item.createdAt) }}</span>
                  <span class="w-24">
                    <span
                      class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="item.kind === 'Merit' ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#fef2f2] text-[#ef4444]'"
                    >{{ item.kind }}</span>
                  </span>
                  <span
                    class="w-16 text-right text-sm font-semibold"
                    :class="item.kind === 'Merit' ? 'text-[#10b981]' : 'text-[#ef4444]'"
                  >{{ item.kind === 'Merit' ? '+' : '-' }}{{ item.points }}</span>
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- ======================================================= -->
        <!-- MANAGEMENT KPI DASHBOARD VIEW                            -->
        <!-- ======================================================= -->
        <template v-else>
          <!-- Stat Cards -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="stat in managementStats"
              :key="stat.label"
              class="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f8fafc] text-[#6b7280] ring-1 ring-[#e5e7eb]">
                  <ion-icon :icon="stat.icon" class="text-[18px]"></ion-icon>
                </div>
                <span class="text-sm font-medium text-[#6b7280]">{{ stat.label }}</span>
              </div>
              <div class="mt-4 text-3xl font-bold text-[#111827]">{{ stat.value }}</div>
              <p class="mt-1 text-xs text-[#6b7280]">{{ stat.hint }}</p>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <!-- Performance Trend -->
            <div class="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:col-span-2">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-base font-semibold text-[#111827]">Tren Kinerja</h2>
                <select
                  v-model="chartPeriod"
                  @change="loadChartData"
                  class="rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#111827] outline-none focus:ring-2 focus:ring-[#ef4444]/30"
                >
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                </select>
              </div>
              <div class="relative h-[280px]">
                <canvas ref="performanceChart"></canvas>
              </div>
            </div>

            <!-- Merit vs Misconduct Donut -->
            <div class="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:col-span-1">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-base font-semibold text-[#111827]">Merit vs Misconduct</h2>
              </div>
              <div class="relative h-[280px]">
                <canvas ref="pieChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Activity Feed + Top Performers -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <!-- Activity Feed (Transactions style) -->
            <div class="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:col-span-2">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-base font-semibold text-[#111827]">Aktivitas Terbaru</h2>
                <button
                  @click="viewAllOperators"
                  class="text-sm font-medium text-[#6b7280] transition-colors hover:text-[#111827]"
                >
                  Lihat Semua
                </button>
              </div>
              <div v-if="!activityFeed.length" class="py-10 text-center text-sm text-[#6b7280]">
                Belum ada aktivitas tercatat
              </div>
              <div v-else>
                <div class="-mx-5 hidden items-center gap-3 border-b border-[#e5e7eb] px-5 pb-2 text-xs font-medium text-[#6b7280] sm:flex">
                  <span class="w-9"></span>
                  <span class="flex-1">Operator</span>
                  <span class="w-28">Tanggal</span>
                  <span class="w-24">Jenis</span>
                  <span class="w-16 text-right">Poin</span>
                </div>
                <div
                  v-for="item in activityFeed"
                  :key="item.id"
                  class="-mx-5 flex items-center gap-3 border-b border-[#e5e7eb] px-5 py-3 transition-colors last:border-0 hover:bg-[#f8fafc]"
                >
                  <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#f8fafc] text-sm font-semibold text-[#6b7280] ring-1 ring-[#e5e7eb]">
                    {{ getInitial(item.name) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-[#111827]">{{ item.name }}</div>
                    <div v-if="item.detail" class="truncate text-xs text-[#6b7280]">{{ item.detail }}</div>
                  </div>
                  <span class="hidden w-28 text-xs text-[#6b7280] sm:block">{{ formatDate(item.createdAt) }}</span>
                  <span class="w-24">
                    <span
                      class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="item.kind === 'Merit' ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#fef2f2] text-[#ef4444]'"
                    >{{ item.kind }}</span>
                  </span>
                  <span
                    class="w-16 text-right text-sm font-semibold"
                    :class="item.kind === 'Merit' ? 'text-[#10b981]' : 'text-[#ef4444]'"
                  >{{ item.kind === 'Merit' ? '+' : '-' }}{{ item.points }}</span>
                </div>
              </div>
            </div>

            <!-- Top Performers (Income Sources style list) -->
            <div class="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:col-span-1">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-base font-semibold text-[#111827]">5 Operator Terbaik</h2>
                <button
                  @click="viewAllOperators"
                  class="text-sm font-medium text-[#6b7280] transition-colors hover:text-[#111827]"
                >
                  Lihat Semua
                </button>
              </div>
              <div v-if="!dashboard?.topPerformers?.length" class="py-10 text-center text-sm text-[#6b7280]">
                Belum ada data operator
              </div>
              <div v-else class="space-y-4">
                <div
                  v-for="(op, index) in dashboard.topPerformers"
                  :key="op.id"
                  class="flex flex-col gap-2"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#f8fafc] text-xs font-semibold text-[#6b7280] ring-1 ring-[#e5e7eb]">
                      {{ index + 1 }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="truncate text-sm font-medium text-[#111827]">{{ op.user.fullName }}</div>
                      <div class="truncate text-xs text-[#6b7280]">{{ op.department?.name }} · {{ op.productionLine?.name }}</div>
                    </div>
                    <span class="text-sm font-semibold text-[#111827]">{{ op.performanceScore }}</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
                    <div
                      class="h-full rounded-full bg-[#111827]"
                      :style="{ width: Math.round((op.performanceScore / maxPerformerScore) * 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pending Approvals -->
          <div v-if="hasPendingApprovals" class="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center gap-2">
              <ion-icon :icon="timeOutline" class="text-base text-[#6b7280]"></ion-icon>
              <h2 class="text-base font-semibold text-[#111827]">Menunggu Persetujuan</h2>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                v-if="dashboard?.summary.pendingMerits > 0"
                class="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4"
              >
                <div>
                  <div class="text-2xl font-bold text-[#111827]">{{ dashboard.summary.pendingMerits }}</div>
                  <p class="mt-0.5 text-sm text-[#6b7280]">Persetujuan Merit</p>
                </div>
                <button class="rounded-lg bg-[#ef4444] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#dc2626]">
                  Tinjau
                </button>
              </div>
              <div
                v-if="dashboard?.summary.pendingMisconducts > 0"
                class="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4"
              >
                <div>
                  <div class="text-2xl font-bold text-[#111827]">{{ dashboard.summary.pendingMisconducts }}</div>
                  <p class="mt-0.5 text-sm text-[#6b7280]">Persetujuan Misconduct</p>
                </div>
                <button class="rounded-lg bg-[#ef4444] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#dc2626]">
                  Tinjau
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonIcon
} from '@ionic/vue';
import {
  peopleOutline,
  trophyOutline,
  alertCircleOutline,
  cubeOutline,
  timeOutline,
  personOutline,
  starOutline,
  ribbonOutline,
  calendarOutline,
  notificationsOutline,
  moonOutline,
  colorPaletteOutline
} from 'ionicons/icons';
import { Chart, registerables } from 'chart.js';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/auth';
import { useSidebar } from '@/composables/useSidebar';

Chart.register(...registerables);

const router = useRouter();
const authStore = useAuthStore();

// Sidebar toggle lives in this topbar now (shared state with App.vue's rail).
const { collapsed, mobileOpen, isMobile, toggle } = useSidebar();

const userInitial = computed(() =>
  authStore.user?.fullName?.charAt(0)?.toUpperCase() || '?'
);

const goToProfile = () => router.push('/profile');

const dashboard = ref<any>(null);
const loading = ref(false);
const chartPeriod = ref('daily');
const performanceChart = ref<HTMLCanvasElement>();
const pieChart = ref<HTMLCanvasElement>();
let performanceChartInstance: Chart | null = null;
let pieChartInstance: Chart | null = null;

// Determine which dashboard view to show based on roles
const isOperatorView = computed(() => {
  const roles = authStore.user?.roles || [];
  const managementRoles = ['Super Admin', 'Manager', 'Staff Produksi'];
  return !roles.some(r => managementRoles.includes(r));
});

const currentDate = computed(() => {
  const now = new Date();
  return now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const hasPendingApprovals = computed(() => {
  return (
    (dashboard.value?.summary.pendingMerits || 0) > 0 ||
    (dashboard.value?.summary.pendingMisconducts || 0) > 0
  );
});

const managementStats = computed(() => [
  { label: 'Total Operator', value: dashboard.value?.summary.totalOperators || 0, hint: 'Operator terdaftar', icon: peopleOutline },
  { label: 'Total Merit', value: dashboard.value?.summary.totalMerits || 0, hint: 'Penghargaan tercatat', icon: trophyOutline },
  { label: 'Total Misconduct', value: dashboard.value?.summary.totalMisconducts || 0, hint: 'Pelanggaran tercatat', icon: alertCircleOutline },
  { label: 'Blok Blockchain', value: dashboard.value?.summary.totalBlocks || 0, hint: 'Jejak audit terverifikasi', icon: cubeOutline }
]);

const operatorStats = computed(() => [
  { label: 'Total Poin Merit', value: dashboard.value?.summary.totalMerit ?? 0, hint: 'Akumulasi penghargaan', icon: trophyOutline },
  { label: 'Total Poin Misconduct', value: dashboard.value?.summary.totalMisconduct ?? 0, hint: 'Akumulasi pelanggaran', icon: alertCircleOutline },
  { label: 'Skor Kinerja', value: (dashboard.value?.summary.performanceScore ?? 0).toFixed(1), hint: 'Skor periode berjalan', icon: starOutline },
  { label: 'Peringkat Anda', value: '#' + (dashboard.value?.summary.ranking ?? 0), hint: 'Posisi di antara operator', icon: ribbonOutline }
]);

// Unified Merit + Misconduct activity feed (works for both operator and management payloads)
const activityFeed = computed(() => {
  const merits = (dashboard.value?.recentMerits || []).map((m: any) => ({
    id: 'merit-' + m.id,
    kind: 'Merit' as const,
    name: m.operator?.user?.fullName || m.meritType,
    detail: m.operator?.user?.fullName ? m.meritType : (m.description || ''),
    points: m.points,
    createdAt: m.createdAt
  }));
  const misconducts = (dashboard.value?.recentMisconducts || []).map((m: any) => ({
    id: 'misc-' + m.id,
    kind: 'Misconduct' as const,
    name: m.operator?.user?.fullName || m.misconductType,
    detail: m.operator?.user?.fullName ? m.misconductType : (m.description || ''),
    points: m.points,
    createdAt: m.createdAt
  }));
  return [...merits, ...misconducts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

const maxPerformerScore = computed(() => {
  const scores = (dashboard.value?.topPerformers || []).map((o: any) => o.performanceScore || 0);
  return Math.max(1, ...scores);
});

const loadDashboard = async () => {
  loading.value = true;
  try {
    const response = await dashboardService.getKPI();
    dashboard.value = response.data;

    loading.value = false;

    // Only initialize charts for management KPI view
    if (!isOperatorView.value) {
      await nextTick();
      initCharts();
    }
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    loading.value = false;
  }
};

const loadChartData = async () => {
  try {
    const response = await dashboardService.getPerformanceChart(chartPeriod.value);
    updatePerformanceChart(response.data);
  } catch (error) {
    console.error('Failed to load chart data:', error);
  }
};

const initCharts = () => {
  if (performanceChart.value) {
    createPerformanceChart();
  }
  if (pieChart.value) {
    createPieChart();
  }
};

const createPerformanceChart = () => {
  if (!performanceChart.value) return;

  if (performanceChartInstance) {
    performanceChartInstance.destroy();
  }

  const ctx = performanceChart.value.getContext('2d');
  if (!ctx) return;

  performanceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      datasets: [
        {
          label: 'Merit',
          data: [12, 19, 15, 25, 22, 30, 28],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: 'Misconduct',
          data: [5, 8, 6, 10, 7, 12, 9],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'bottom' }
      },
      scales: { y: { beginAtZero: true } }
    }
  });
};

const createPieChart = () => {
  if (!pieChart.value) return;

  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  const ctx = pieChart.value.getContext('2d');
  if (!ctx) return;

  const totalMerits = dashboard.value?.summary.totalMerits || 0;
  const totalMisconducts = dashboard.value?.summary.totalMisconducts || 0;

  pieChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Merit', 'Misconduct'],
      datasets: [
        {
          data: [totalMerits, totalMisconducts],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { display: true, position: 'bottom' } }
    }
  });
};

const updatePerformanceChart = (data: any) => {
  if (!performanceChartInstance || !data) return;
  if (Array.isArray(data.labels)) {
    performanceChartInstance.data.labels = data.labels;
  }
  if (Array.isArray(data.merits)) {
    performanceChartInstance.data.datasets[0].data = data.merits;
  }
  if (Array.isArray(data.misconducts)) {
    performanceChartInstance.data.datasets[1].data = data.misconducts;
  }
  performanceChartInstance.update();
};

const getInitial = (name?: string) => (name?.charAt(0)?.toUpperCase() || '?');

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short'
  });
};

const viewAllOperators = () => {
  router.push('/operators');
};

onMounted(() => {
  loadDashboard();
});

onUnmounted(() => {
  performanceChartInstance?.destroy();
  pieChartInstance?.destroy();
});
</script>

<style scoped>
/* Ionic owns the scroll-host background; this is the one thing Tailwind can't set
   (the section canvas behind the white cards). Everything else is Tailwind. */
.dashboard-content {
  --background: #f8fafc;
}

/* Glassmorphism topbar — sticky to the top of the ion-content scroll area. */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.topbar-inner {
  padding: 0.75rem 1rem;
}

@media (min-width: 768px) {
  .topbar-inner {
    padding: 0.75rem 1.5rem;
  }
}
</style>
