<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/operators"></ion-back-button>
        </ion-buttons>
        <ion-title>Operator Detail</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading State -->
      <div v-if="loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading operator details...</p>
      </div>

      <!-- Error State -->
      <ion-card v-else-if="error" color="danger" class="ion-margin">
        <ion-card-content>
          <p>{{ error }}</p>
          <ion-button @click="loadOperatorDetail" size="small">Retry</ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Operator Details -->
      <div v-else-if="operator">
        <!-- Profile Card -->
        <ion-card>
          <ion-card-content>
            <div class="profile-header">
              <div class="avatar-large">
                {{ operator.user.fullName.charAt(0) }}
              </div>
              <div class="profile-info">
                <h1>{{ operator.user.fullName }}</h1>
                <p class="employee-id">{{ operator.employeeId }}</p>
                <p class="position">{{ operator.position }}</p>
              </div>
            </div>

            <ion-grid>
              <ion-row>
                <ion-col size="6">
                  <div class="info-item">
                    <ion-icon :icon="mailOutline" color="primary"></ion-icon>
                    <div>
                      <div class="info-label">Email</div>
                      <div class="info-value">{{ operator.user.email }}</div>
                    </div>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div class="info-item">
                    <ion-icon :icon="personOutline" color="primary"></ion-icon>
                    <div>
                      <div class="info-label">Username</div>
                      <div class="info-value">{{ operator.user.username }}</div>
                    </div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Work Info Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Work Information</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-icon :icon="businessOutline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <p>Department</p>
                  <h3>{{ operator.department.name }}</h3>
                  <p class="text-small">Division: {{ operator.department.division.name }}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-icon :icon="timeOutline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <p>Shift</p>
                  <h3>{{ operator.shift.name }}</h3>
                  <p class="text-small">{{ operator.shift.startTime }} - {{ operator.shift.endTime }}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-icon :icon="layersOutline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <p>Production Line</p>
                  <h3>{{ operator.productionLine.name }}</h3>
                  <p class="text-small">Code: {{ operator.productionLine.code }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Performance Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Performance</ion-card-title>
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

        <!-- QR Code Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>QR Code</ion-card-title>
          </ion-card-header>
          <ion-card-content class="ion-text-center">
            <img :src="operator.qrCode" alt="QR Code" class="qr-code" />
            <p class="text-small ion-margin-top">Scan this QR code for quick access</p>
          </ion-card-content>
        </ion-card>

        <!-- Recent Merit Events -->
        <ion-card v-if="operator.meritEvents && operator.meritEvents.length > 0">
          <ion-card-header>
            <ion-card-title>Recent Merit Events</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item v-for="merit in operator.meritEvents" :key="merit.id">
                <ion-icon :icon="trophyOutline" slot="start" color="success"></ion-icon>
                <ion-label>
                  <h3>{{ merit.meritType }}</h3>
                  <p>{{ merit.description }}</p>
                  <p class="text-small">{{ formatDate(merit.eventDate) }}</p>
                </ion-label>
                <ion-badge slot="end" color="success">+{{ merit.points }}</ion-badge>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Recent Misconduct Events -->
        <ion-card v-if="operator.misconductEvents && operator.misconductEvents.length > 0">
          <ion-card-header>
            <ion-card-title>Recent Misconduct Events</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item v-for="misconduct in operator.misconductEvents" :key="misconduct.id">
                <ion-icon :icon="warningOutline" slot="start" color="danger"></ion-icon>
                <ion-label>
                  <h3>{{ misconduct.misconductType }}</h3>
                  <p>{{ misconduct.description }}</p>
                  <p class="text-small">{{ formatDate(misconduct.eventDate) }}</p>
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
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
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
  mailOutline,
  personOutline,
  businessOutline,
  timeOutline,
  layersOutline,
  trophyOutline,
  warningOutline
} from 'ionicons/icons';
import axios from 'axios';

const route = useRoute();

const operator = ref<any>(null);
const loading = ref(false);
const error = ref('');

const loadOperatorDetail = async () => {
  loading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('token');
    const operatorId = route.params.id;
    
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/operators/${operatorId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.data.success) {
      operator.value = response.data.data;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load operator details';
    console.error('Error loading operator:', err);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  loadOperatorDetail();
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

onMounted(() => {
  loadOperatorDetail();
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
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}

.info-item ion-icon {
  font-size: 24px;
  margin-top: 4px;
}

.info-label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  margin-top: 2px;
}

.text-small {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.performance-overview {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, var(--ion-color-primary-tint), var(--ion-color-secondary-tint));
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
