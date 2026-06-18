<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>QR Identity</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData" aria-label="Refresh">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading -->
      <div v-if="loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading QR Identity...</p>
      </div>

      <!-- No operator profile -->
      <ion-card v-else-if="!operator" color="warning" class="ion-margin">
        <ion-card-content>
          <p class="ion-text-center">You don't have an operator profile yet.</p>
        </ion-card-content>
      </ion-card>

      <!-- QR Identity -->
      <div v-else class="qr-identity-container">
        <!-- QR Code Card -->
        <ion-card class="qr-card">
          <ion-card-content class="ion-text-center">
            <div class="qr-header">
              <div class="company-logo">B</div>
              <h2>PT Bridgestone Tire Indonesia</h2>
              <p class="subtitle">Operator Identity Card</p>
            </div>

            <div class="qr-code-wrapper">
              <img
                v-if="operator.qrCode"
                :src="operator.qrCode"
                alt="Personal QR Code"
                class="qr-code-image"
              />
              <div v-else class="qr-placeholder">
                <ion-icon :icon="qrCodeOutline" class="placeholder-icon"></ion-icon>
                <p>QR Code belum tersedia</p>
              </div>
            </div>

            <div class="operator-details">
              <div class="name-section">
                <h1>{{ operator.user.fullName }}</h1>
                <p class="employee-id">{{ operator.employeeId }}</p>
              </div>

              <ion-grid>
                <ion-row>
                  <ion-col size="6">
                    <div class="detail-item">
                      <div class="detail-label">Position</div>
                      <div class="detail-value">{{ operator.position }}</div>
                    </div>
                  </ion-col>
                  <ion-col size="6">
                    <div class="detail-item">
                      <div class="detail-label">Job</div>
                      <div class="detail-value">{{ operator.job || 'Operator' }}</div>
                    </div>
                  </ion-col>
                  <ion-col size="6">
                    <div class="detail-item">
                      <div class="detail-label">Department</div>
                      <div class="detail-value">{{ operator.department.name }}</div>
                    </div>
                  </ion-col>
                  <ion-col size="6">
                    <div class="detail-item">
                      <div class="detail-label">Shift</div>
                      <div class="detail-value">{{ operator.shift.name }}</div>
                    </div>
                  </ion-col>
                  <ion-col size="6">
                    <div class="detail-item">
                      <div class="detail-label">Line</div>
                      <div class="detail-value">{{ operator.productionLine.name }}</div>
                    </div>
                  </ion-col>
                  <ion-col size="6">
                    <div class="detail-item">
                      <div class="detail-label">Group</div>
                      <div class="detail-value">{{ operator.group?.name || '-' }}</div>
                    </div>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </div>

            <div class="qr-instructions">
              <ion-icon :icon="informationCircleOutline" color="primary"></ion-icon>
              <p>Tunjukkan QR Code ini kepada <strong>Foreman</strong> untuk proses scanning sebelum input Merit/Misconduct</p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Quick Stats -->
        <ion-card class="stats-card">
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col size="4">
                  <div class="stat-item">
                    <div class="stat-value score">{{ operator.performanceScore.toFixed(1) }}</div>
                    <div class="stat-label">Score</div>
                  </div>
                </ion-col>
                <ion-col size="4">
                  <div class="stat-item">
                    <div class="stat-value merit">{{ operator.totalMerit }}</div>
                    <div class="stat-label">Merit</div>
                  </div>
                </ion-col>
                <ion-col size="4">
                  <div class="stat-item">
                    <div class="stat-value misconduct">{{ operator.totalMisconduct }}</div>
                    <div class="stat-label">Misconduct</div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonButton, IonIcon, IonCard,
  IonCardContent, IonSpinner, IonGrid, IonRow, IonCol
} from '@ionic/vue';
import {
  refreshOutline, qrCodeOutline, informationCircleOutline
} from 'ionicons/icons';
import { operatorService } from '@/services/operator.service';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const operator = ref<any>(null);
const loading = ref(false);

const loadData = async () => {
  loading.value = true;
  try {
    await authStore.refreshUser();
    const operatorId = authStore.user?.operator?.id;
    if (operatorId) {
      const response = await operatorService.getById(operatorId);
      if (response.success) {
        operator.value = response.data;
      }
    }
  } catch (err: any) {
    console.error('Load QR Identity error:', err);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => loadData();

onMounted(() => loadData());
</script>

<style scoped>
.qr-identity-container {
  padding: 12px;
}

.qr-card {
  border-radius: 16px;
  overflow: hidden;
}

.qr-header {
  margin-bottom: 20px;
}

.company-logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  font-weight: 800;
  font-size: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.qr-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.subtitle {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.qr-code-wrapper {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 2px solid var(--ion-color-light);
  margin: 0 auto 20px;
  max-width: 280px;
}

.qr-code-image {
  width: 100%;
  max-width: 240px;
  height: auto;
}

.qr-placeholder {
  padding: 40px;
  text-align: center;
  color: var(--ion-color-medium);
}

.placeholder-icon {
  font-size: 64px;
  opacity: 0.4;
}

.operator-details {
  text-align: center;
}

.name-section h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.employee-id {
  color: var(--ion-color-primary);
  font-weight: 600;
  font-size: 0.95rem;
  margin: 4px 0 16px;
}

.detail-item {
  padding: 8px;
  background: var(--ion-color-light);
  border-radius: 8px;
  margin-bottom: 4px;
}

.detail-label {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 2px;
}

.qr-instructions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--ion-color-primary-tint);
  border-radius: 8px;
  margin-top: 16px;
}

.qr-instructions ion-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.qr-instructions p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ion-color-dark);
}

.stats-card {
  border-radius: 12px;
  margin-top: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-value.score { color: var(--ion-color-primary); }
.stat-value.merit { color: var(--ion-color-success); }
.stat-value.misconduct { color: var(--ion-color-danger); }

.stat-label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-top: 4px;
}

ion-spinner {
  display: block;
  margin: 20px auto;
}
</style>
