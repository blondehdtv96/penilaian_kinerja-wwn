<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Kinerja Saya</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData" aria-label="Refresh performance data">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading State -->
      <div v-if="loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading performance data...</p>
      </div>

      <!-- Error State -->
      <ion-card v-else-if="error" color="danger" class="ion-margin">
        <ion-card-content>
          <p>{{ error }}</p>
          <ion-button @click="loadMyPerformance" size="small">Retry</ion-button>
        </ion-card-content>
      </ion-card>

      <!-- No Operator Profile -->
      <ion-card v-else-if="!operator" class="ion-margin">
        <ion-card-content>
          <p class="ion-text-center">You don't have an operator profile yet.</p>
        </ion-card-content>
      </ion-card>

      <!-- Operator Performance -->
      <div v-else>
        <!-- Profile Card -->
        <ion-card>
          <ion-card-content>
            <div class="profile-header">
              <div class="avatar-large">
                {{ authStore.user?.fullName.charAt(0) }}
              </div>
              <div class="profile-info">
                <h1>{{ authStore.user?.fullName }}</h1>
                <p class="employee-id">{{ operator.employeeId }}</p>
                <p class="position">{{ operator.position }}</p>
              </div>
            </div>

            <ion-grid>
              <ion-row>
                <ion-col size="4">
                  <div class="info-item">
                    <ion-icon :icon="businessOutline" color="primary"></ion-icon>
                    <div>
                      <div class="info-label">Department</div>
                      <div class="info-value">{{ operator.department.name }}</div>
                    </div>
                  </div>
                </ion-col>
                <ion-col size="4">
                  <div class="info-item">
                    <ion-icon :icon="timeOutline" color="primary"></ion-icon>
                    <div>
                      <div class="info-label">Shift</div>
                      <div class="info-value">{{ operator.shift.name }}</div>
                    </div>
                  </div>
                </ion-col>
                <ion-col size="4">
                  <div class="info-item">
                    <ion-icon :icon="layersOutline" color="primary"></ion-icon>
                    <div>
                      <div class="info-label">Line</div>
                      <div class="info-value">{{ operator.productionLine.name }}</div>
                    </div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Performance Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Performance Overview</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="performance-overview">
              <div class="performance-item">
                <div class="performance-score-large">
                  {{ operator.performanceScore.toFixed(1) }}
                </div>
                <div class="performance-label">Overall Score</div>
              </div>
            </div>

            <ion-grid>
              <ion-row>
                <ion-col>
                  <div class="stat-box success">
                    <ion-icon :icon="trophyOutline" size="large"></ion-icon>
                    <div class="stat-value">{{ operator.totalMerit }}</div>
                    <div class="stat-label">Total Merit</div>
                  </div>
                </ion-col>
                <ion-col>
                  <div class="stat-box danger">
                    <ion-icon :icon="warningOutline" size="large"></ion-icon>
                    <div class="stat-value">{{ operator.totalMisconduct }}</div>
                    <div class="stat-label">Total Misconduct</div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Recent Merit Events -->
        <ion-card v-if="operator.meritEvents && operator.meritEvents.length > 0">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="trophyOutline" color="success"></ion-icon>
              Recent Merit Events
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item v-for="merit in operator.meritEvents" :key="merit.id">
                <ion-icon :icon="trophyOutline" slot="start" color="success"></ion-icon>
                <ion-label>
                  <h3>{{ merit.meritType }}</h3>
                  <p>{{ merit.description }}</p>
                  <p class="text-small">
                    {{ formatDate(merit.eventDate) }}
                    <ion-badge :color="getApprovalColor(merit.approvalStatus)" class="ion-margin-start">
                      {{ merit.approvalStatus }}
                    </ion-badge>
                  </p>
                </ion-label>
                <ion-badge slot="end" color="success">+{{ merit.points }}</ion-badge>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Recent Misconduct Events -->
        <ion-card v-if="operator.misconductEvents && operator.misconductEvents.length > 0">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="warningOutline" color="danger"></ion-icon>
              Recent Misconduct Events
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item v-for="misconduct in operator.misconductEvents" :key="misconduct.id">
                <ion-icon :icon="warningOutline" slot="start" color="danger"></ion-icon>
                <ion-label>
                  <h3>{{ misconduct.misconductType }}</h3>
                  <p>{{ misconduct.description }}</p>
                  <p class="text-small">
                    {{ formatDate(misconduct.eventDate) }}
                    <ion-badge :color="getApprovalColor(misconduct.approvalStatus)" class="ion-margin-start">
                      {{ misconduct.approvalStatus }}
                    </ion-badge>
                  </p>
                </ion-label>
                <div slot="end" class="misconduct-badge">
                  <ion-badge :color="getSeverityColor(misconduct.severity)">
                    {{ misconduct.severity }}
                  </ion-badge>
                  <ion-badge color="danger" class="ion-margin-top">-{{ misconduct.points }}</ion-badge>
                </div>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- QR Code Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>My QR Code</ion-card-title>
          </ion-card-header>
          <ion-card-content class="ion-text-center">
            <img :src="operator.qrCode" alt="Personal QR code for attendance and verification" class="qr-code" loading="lazy" />
            <p class="text-small ion-margin-top">Show this QR code for attendance and verification</p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonBadge
} from '@ionic/vue';
import {
  refreshOutline,
  businessOutline,
  timeOutline,
  layersOutline,
  trophyOutline,
  warningOutline
} from 'ionicons/icons';
import { operatorService } from '@/services/operator.service';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const operator = ref<any>(null);
const loading = ref(false);
const error = ref('');

const loadMyPerformance = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authStore.refreshUser();
    const operatorId = authStore.user?.operator?.id;

    if (operatorId) {
      const response = await operatorService.getById(operatorId);
      if (response.success) {
        operator.value = response.data;
      }
    } else {
      operator.value = null;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load performance data';
    console.error('Error loading performance:', err);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  loadMyPerformance();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    low: 'warning',
    medium: 'warning',
    high: 'danger',
    critical: 'danger'
  };
  return colors[severity] || 'medium';
};

const getApprovalColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  };
  return colors[status] || 'medium';
};

onMounted(() => {
  loadMyPerformance();
});
</script>

<style scoped>
.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
  color: white;
  font-weight: bold;
  font-size: 2rem;
  flex-shrink: 0;
}

.profile-info h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.employee-id {
  color: var(--ion-color-medium);
  margin: 4px 0;
}

.position {
  color: var(--ion-color-primary);
  font-weight: 500;
  margin: 4px 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px;
}

.info-item ion-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.info-label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
}

.info-value {
  font-size: 0.9rem;
  font-weight: 600;
}

.text-small {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.performance-overview {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #1e3a5f 0%, #1a56a0 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.performance-score-large {
  font-size: 3rem;
  font-weight: bold;
  color: white;
}

.performance-label {
  font-size: 1rem;
  color: white;
  margin-top: 8px;
}

.stat-box {
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  background: var(--ion-color-light);
}

.stat-box.success {
  background: var(--ion-color-success-tint);
}

.stat-box.danger {
  background: var(--ion-color-danger-tint);
}

.stat-box ion-icon {
  font-size: 48px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  margin: 12px 0 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.qr-code {
  max-width: 250px;
  width: 100%;
  height: auto;
  border: 2px solid var(--ion-color-light);
  border-radius: 8px;
  padding: 10px;
  background: white;
}

.misconduct-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

ion-spinner {
  display: block;
  margin: 20px auto;
}
</style>
