<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>
          {{ isOperatorView ? 'Dashboard Kinerja Saya' : 'Dashboard KPI' }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refresh">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <ion-spinner color="primary" name="crescent"></ion-spinner>
        <p>Loading dashboard...</p>
      </div>

      <!-- ======================================================= -->
      <!-- OPERATOR PERSONAL DASHBOARD VIEW                         -->
      <!-- ======================================================= -->
      <div v-else-if="isOperatorView" class="dashboard-container">
        <!-- Welcome Header -->
        <div class="dashboard-header">
          <h1>Selamat Datang, {{ authStore.user?.fullName }} 👋</h1>
          <p class="subtitle">{{ currentDate }}</p>
        </div>

        <!-- No Operator Record Warning -->
        <div v-if="!dashboard?.operator" class="no-operator-card">
          <ion-icon :icon="personOutline" style="font-size: 3rem; color: #9ca3af;"></ion-icon>
          <h3>Profil Operator Belum Terdaftar</h3>
          <p>Hubungi administrator untuk mendaftarkan data operator Anda.</p>
        </div>

        <!-- Operator Info Card -->
        <div v-else>
          <div class="operator-info-card">
            <div class="operator-avatar">
              {{ authStore.user?.fullName?.charAt(0).toUpperCase() }}
            </div>
            <div class="operator-details">
              <h2>{{ authStore.user?.fullName }}</h2>
              <p>{{ dashboard.operator.department?.name }} · {{ dashboard.operator.shift?.name }}</p>
              <p class="employee-id">ID: {{ dashboard.operator.employeeId }} · {{ dashboard.operator.position }}</p>
            </div>
            <div class="operator-ranking">
              <div class="rank-number">
                #{{ dashboard.summary.ranking }}
              </div>
              <div class="rank-label">Ranking</div>
            </div>
          </div>

          <!-- Personal KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card green">
              <div class="kpi-icon">
                <ion-icon :icon="trophyOutline"></ion-icon>
              </div>
              <div class="kpi-content">
                <h3>{{ dashboard.summary.totalMerit }}</h3>
                <p>Total Merit Poin</p>
              </div>
            </div>

            <div class="kpi-card red">
              <div class="kpi-icon">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
              </div>
              <div class="kpi-content">
                <h3>{{ dashboard.summary.totalMisconduct }}</h3>
                <p>Total Misconduct</p>
              </div>
            </div>

            <div class="kpi-card blue">
              <div class="kpi-icon">
                <ion-icon :icon="starOutline"></ion-icon>
              </div>
              <div class="kpi-content">
                <h3>{{ dashboard.summary.performanceScore.toFixed(1) }}</h3>
                <p>Skor Kinerja</p>
              </div>
            </div>

            <div class="kpi-card purple">
              <div class="kpi-icon">
                <ion-icon :icon="ribbonOutline"></ion-icon>
              </div>
              <div class="kpi-content">
                <h3>#{{ dashboard.summary.ranking }}</h3>
                <p>Peringkat Anda</p>
              </div>
            </div>
          </div>

          <!-- Personal Activities -->
          <div class="activities-grid">
            <!-- Personal Merits -->
            <div class="activity-card">
              <div class="activity-header">
                <h2>✅ Merit Saya</h2>
                <ion-badge color="success">{{ dashboard.recentMerits?.length || 0 }}</ion-badge>
              </div>
              <div class="activity-list">
                <div v-if="!dashboard.recentMerits?.length" class="empty-state">
                  <p>Belum ada merit tercatat</p>
                </div>
                <div
                  v-for="merit in dashboard.recentMerits"
                  :key="merit.id"
                  class="activity-item merit"
                >
                  <div class="activity-avatar">
                    <ion-icon :icon="trophyOutline"></ion-icon>
                  </div>
                  <div class="activity-info">
                    <h4>{{ merit.meritType }}</h4>
                    <p>{{ merit.description }}</p>
                    <span class="timestamp">{{ formatDate(merit.createdAt) }}</span>
                  </div>
                  <div class="activity-points">+{{ merit.points }}</div>
                </div>
              </div>
            </div>

            <!-- Personal Misconducts -->
            <div class="activity-card">
              <div class="activity-header">
                <h2>⚠️ Misconduct Saya</h2>
                <ion-badge color="danger">{{ dashboard.recentMisconducts?.length || 0 }}</ion-badge>
              </div>
              <div class="activity-list">
                <div v-if="!dashboard.recentMisconducts?.length" class="empty-state">
                  <p>Belum ada misconduct tercatat</p>
                </div>
                <div
                  v-for="misc in dashboard.recentMisconducts"
                  :key="misc.id"
                  class="activity-item misconduct"
                >
                  <div class="activity-avatar">
                    <ion-icon :icon="alertCircleOutline"></ion-icon>
                  </div>
                  <div class="activity-info">
                    <h4>{{ misc.misconductType }}</h4>
                    <p>{{ misc.description }}</p>
                    <span class="timestamp">{{ formatDate(misc.createdAt) }}</span>
                  </div>
                  <div class="activity-points">-{{ misc.points }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- MANAGEMENT KPI DASHBOARD VIEW                            -->
      <!-- ======================================================= -->
      <div v-else class="dashboard-container">
        <!-- Header Section -->
        <div class="dashboard-header">
          <h1>Welcome, {{ authStore.user?.fullName }}</h1>
          <p class="subtitle">{{ currentDate }}</p>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card blue">
            <div class="kpi-icon">
              <ion-icon :icon="peopleOutline"></ion-icon>
            </div>
            <div class="kpi-content">
              <h3>{{ dashboard?.summary.totalOperators || 0 }}</h3>
              <p>Total Operators</p>
            </div>
          </div>

          <div class="kpi-card green">
            <div class="kpi-icon">
              <ion-icon :icon="trophyOutline"></ion-icon>
            </div>
            <div class="kpi-content">
              <h3>{{ dashboard?.summary.totalMerits || 0 }}</h3>
              <p>Total Merits</p>
            </div>
          </div>

          <div class="kpi-card red">
            <div class="kpi-icon">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
            </div>
            <div class="kpi-content">
              <h3>{{ dashboard?.summary.totalMisconducts || 0 }}</h3>
              <p>Total Misconducts</p>
            </div>
          </div>

          <div class="kpi-card purple">
            <div class="kpi-icon">
              <ion-icon :icon="cubeOutline"></ion-icon>
            </div>
            <div class="kpi-content">
              <h3>{{ dashboard?.summary.totalBlocks || 0 }}</h3>
              <p>Blockchain Blocks</p>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <h2>Performance Trend</h2>
              <ion-select v-model="chartPeriod" @ionChange="loadChartData">
                <ion-select-option value="daily">Daily</ion-select-option>
                <ion-select-option value="weekly">Weekly</ion-select-option>
                <ion-select-option value="monthly">Monthly</ion-select-option>
              </ion-select>
            </div>
            <canvas ref="performanceChart"></canvas>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h2>Merit vs Misconduct</h2>
            </div>
            <canvas ref="pieChart"></canvas>
          </div>
        </div>

        <!-- Top Performers Section -->
        <div class="section-card">
          <div class="section-header">
            <h2>🏆 Top 5 Performers</h2>
            <ion-button fill="clear" size="small" @click="viewAllOperators">
              View All
            </ion-button>
          </div>
          <div class="performers-list">
            <div
              v-for="(op, index) in dashboard?.topPerformers"
              :key="op.id"
              class="performer-item"
            >
              <div class="rank" :class="getRankClass(index)">
                {{ index + 1 }}
              </div>
              <div class="performer-info">
                <h3>{{ op.user.fullName }}</h3>
                <p>{{ op.department?.name }} - {{ op.productionLine?.name }}</p>
              </div>
              <div class="performer-score">
                <div class="score">{{ op.performanceScore }}</div>
                <div class="badges">
                  <span class="badge green">+{{ op.totalMerit }}</span>
                  <span class="badge red">-{{ op.totalMisconduct }}</span>
                </div>
              </div>
            </div>
            <div v-if="!dashboard?.topPerformers?.length" class="empty-state">
              <p>Belum ada data operator</p>
            </div>
          </div>
        </div>

        <!-- Recent Activities -->
        <div class="activities-grid">
          <div class="activity-card">
            <div class="activity-header">
              <h2>✅ Recent Merits</h2>
              <ion-badge color="success">
                {{ dashboard?.recentMerits?.length || 0 }}
              </ion-badge>
            </div>
            <div class="activity-list">
              <div v-if="!dashboard?.recentMerits?.length" class="empty-state">
                <p>Belum ada merit tercatat</p>
              </div>
              <div
                v-for="merit in dashboard?.recentMerits"
                :key="merit.id"
                class="activity-item merit"
              >
                <div class="activity-avatar">
                  <ion-icon :icon="trophyOutline"></ion-icon>
                </div>
                <div class="activity-info">
                  <h4>{{ merit.operator.user.fullName }}</h4>
                  <p>{{ merit.meritType }}</p>
                  <span class="timestamp">{{ formatDate(merit.createdAt) }}</span>
                </div>
                <div class="activity-points">+{{ merit.points }}</div>
              </div>
            </div>
          </div>

          <div class="activity-card">
            <div class="activity-header">
              <h2>⚠️ Recent Misconducts</h2>
              <ion-badge color="danger">
                {{ dashboard?.recentMisconducts?.length || 0 }}
              </ion-badge>
            </div>
            <div class="activity-list">
              <div v-if="!dashboard?.recentMisconducts?.length" class="empty-state">
                <p>Belum ada misconduct tercatat</p>
              </div>
              <div
                v-for="misc in dashboard?.recentMisconducts"
                :key="misc.id"
                class="activity-item misconduct"
              >
                <div class="activity-avatar">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                </div>
                <div class="activity-info">
                  <h4>{{ misc.operator.user.fullName }}</h4>
                  <p>{{ misc.misconductType }}</p>
                  <span class="timestamp">{{ formatDate(misc.createdAt) }}</span>
                </div>
                <div class="activity-points">-{{ misc.points }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Approvals -->
        <div class="section-card" v-if="hasPendingApprovals">
          <div class="section-header">
            <h2>⏳ Pending Approvals</h2>
          </div>
          <div class="pending-grid">
            <div class="pending-card" v-if="dashboard?.summary.pendingMerits > 0">
              <ion-icon :icon="timeOutline" color="warning"></ion-icon>
              <h3>{{ dashboard.summary.pendingMerits }}</h3>
              <p>Merit Approvals</p>
              <ion-button size="small" fill="outline">Review</ion-button>
            </div>
            <div class="pending-card" v-if="dashboard?.summary.pendingMisconducts > 0">
              <ion-icon :icon="timeOutline" color="danger"></ion-icon>
              <h3>{{ dashboard.summary.pendingMisconducts }}</h3>
              <p>Misconduct Approvals</p>
              <ion-button size="small" fill="outline">Review</ion-button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonMenuButton
} from '@ionic/vue';
import {
  refreshOutline,
  peopleOutline,
  trophyOutline,
  alertCircleOutline,
  cubeOutline,
  timeOutline,
  personOutline,
  starOutline,
  ribbonOutline
} from 'ionicons/icons';
import { Chart, registerables } from 'chart.js';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/auth';

Chart.register(...registerables);

const router = useRouter();
const authStore = useAuthStore();

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
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Merits',
          data: [12, 19, 15, 25, 22, 30, 28],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: 'Misconducts',
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
      labels: ['Merits', 'Misconducts'],
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
      plugins: { legend: { display: true, position: 'bottom' } }
    }
  });
};

const updatePerformanceChart = (data: any) => {
  if (performanceChartInstance && data) {
    performanceChartInstance.update();
  }
};

const getRankClass = (index: number) => {
  if (index === 0) return 'gold';
  if (index === 1) return 'silver';
  if (index === 2) return 'bronze';
  return '';
};

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

const refresh = () => {
  loadDashboard();
};

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.dashboard-content {
  --background: #f5f7fa;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.dashboard-header .subtitle {
  color: #6b7280;
  font-size: 0.875rem;
}

/* ======================================== */
/* Operator Info Card                        */
/* ======================================== */
.operator-info-card {
  background: linear-gradient(135deg, #1e3a5f 0%, #1a56a0 100%);
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 24px rgba(30, 58, 95, 0.25);
}

.operator-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 3px solid rgba(255,255,255,0.4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.operator-details {
  flex: 1;
  color: white;
}

.operator-details h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.operator-details p {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.85;
}

.employee-id {
  font-size: 0.75rem !important;
  opacity: 0.65 !important;
  margin-top: 0.25rem !important;
}

.operator-ranking {
  text-align: center;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  color: white;
  flex-shrink: 0;
}

.rank-number {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}

.rank-label {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

/* No Operator Card */
.no-operator-card {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.no-operator-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 1rem 0 0.5rem;
}

.no-operator-card p {
  color: #6b7280;
  font-size: 0.875rem;
}

/* ======================================== */
/* KPI Cards                                */
/* ======================================== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.kpi-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.kpi-card.blue .kpi-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.kpi-card.green .kpi-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.kpi-card.red .kpi-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.kpi-card.purple .kpi-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.kpi-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #1f2937;
}

.kpi-content p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* ======================================== */
/* Charts                                   */
/* ======================================== */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.chart-card canvas {
  max-height: 300px;
}

/* ======================================== */
/* Section Cards                            */
/* ======================================== */
.section-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

/* ======================================== */
/* Performers List                          */
/* ======================================== */
.performers-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.performer-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: background 0.2s;
}

.performer-item:hover {
  background: #f3f4f6;
}

.rank {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  background: #e5e7eb;
  color: #6b7280;
}

.rank.gold   { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; }
.rank.silver { background: linear-gradient(135deg, #d1d5db, #9ca3af); color: white; }
.rank.bronze { background: linear-gradient(135deg, #fb923c, #f97316); color: white; }

.performer-info { flex: 1; }
.performer-info h3 { font-size: 1rem; font-weight: 600; color: #1f2937; margin: 0 0 0.25rem 0; }
.performer-info p  { font-size: 0.875rem; color: #6b7280; margin: 0; }

.performer-score { text-align: right; }
.performer-score .score { font-size: 1.5rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem; }
.performer-score .badges { display: flex; gap: 0.5rem; }

.badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
.badge.green { background: #d1fae5; color: #065f46; }
.badge.red   { background: #fee2e2; color: #991b1b; }

/* ======================================== */
/* Activities                               */
/* ======================================== */
.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.activity-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.activity-header h2 { font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0; }

.activity-list { display: flex; flex-direction: column; gap: 0.75rem; }

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
}

.activity-item.merit     { background: #ecfdf5; }
.activity-item.misconduct{ background: #fef2f2; }

.activity-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.activity-item.merit     .activity-avatar { background: #10b981; color: white; }
.activity-item.misconduct .activity-avatar { background: #ef4444; color: white; }

.activity-info { flex: 1; }
.activity-info h4 { font-size: 0.875rem; font-weight: 600; color: #1f2937; margin: 0 0 0.25rem 0; }
.activity-info p  { font-size: 0.75rem; color: #6b7280; margin: 0 0 0.25rem 0; }
.activity-info .timestamp { font-size: 0.625rem; color: #9ca3af; }

.activity-points { font-size: 1rem; font-weight: 700; }
.activity-item.merit     .activity-points { color: #10b981; }
.activity-item.misconduct .activity-points { color: #ef4444; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

/* ======================================== */
/* Pending                                  */
/* ======================================== */
.pending-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }

.pending-card {
  padding: 1.5rem;
  background: #fef3c7;
  border-radius: 8px;
  text-align: center;
}

.pending-card ion-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.pending-card h3 { font-size: 2rem; font-weight: 700; color: #1f2937; margin: 0.5rem 0; }
.pending-card p  { font-size: 0.875rem; color: #6b7280; margin: 0 0 1rem 0; }

/* ======================================== */
/* Responsive                               */
/* ======================================== */
@media (max-width: 768px) {
  .dashboard-container { padding: 1rem; }
  .kpi-grid, .charts-grid, .activities-grid { grid-template-columns: 1fr; }
  .operator-info-card { flex-direction: column; text-align: center; }
}
</style>
