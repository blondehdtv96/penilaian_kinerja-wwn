<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Scan QR Operator</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Scanner Section -->
      <div v-if="!scannedOperator" class="scanner-section">
        <div class="scanner-instructions">
          <ion-icon :icon="qrCodeOutline" class="scanner-icon"></ion-icon>
          <h2>Scan Operator QR Code</h2>
          <p>Arahkan kamera ke QR Code operator untuk mengidentifikasi</p>
        </div>

        <div id="qr-reader" class="qr-reader-container"></div>

        <div v-if="scanError" class="scan-error">
          <ion-icon :icon="alertCircleOutline" color="danger"></ion-icon>
          <p>{{ scanError }}</p>
          <ion-button @click="resetScanner" size="small" fill="outline">
            <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
            Scan Ulang
          </ion-button>
        </div>

        <!-- Manual Input Fallback -->
        <div class="manual-input-section">
          <ion-card>
            <ion-card-header>
              <ion-card-title class="manual-title">
                <ion-icon :icon="keypadOutline"></ion-icon>
                Input Manual
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label position="floating">Employee ID</ion-label>
                <ion-input v-model="manualEmployeeId" type="text"></ion-input>
              </ion-item>
              <ion-button
                @click="lookupByEmployeeId"
                expand="block"
                class="ion-margin-top"
                :disabled="!manualEmployeeId"
              >
                <ion-icon :icon="searchOutline" slot="start"></ion-icon>
                Cari Operator
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>
      </div>

      <!-- Operator Found Section -->
      <div v-else class="operator-found-section">
        <ion-card class="success-card">
          <ion-card-content>
            <div class="success-icon-wrapper">
              <ion-icon :icon="checkmarkCircleOutline" class="success-icon"></ion-icon>
            </div>
            <h2 class="ion-text-center">Operator Ditemukan!</h2>

            <div class="operator-profile">
              <div class="avatar-large">
                {{ scannedOperator.user.fullName.charAt(0) }}
              </div>
              <div class="profile-info">
                <h1>{{ scannedOperator.user.fullName }}</h1>
                <p class="employee-id">{{ scannedOperator.employeeId }}</p>
                <p class="position">{{ scannedOperator.position }}</p>
              </div>
            </div>

            <ion-grid>
              <ion-row>
                <ion-col size="6">
                  <div class="info-box">
                    <ion-icon :icon="businessOutline" color="primary"></ion-icon>
                    <div class="info-label">Department</div>
                    <div class="info-value">{{ scannedOperator.department.name }}</div>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div class="info-box">
                    <ion-icon :icon="timeOutline" color="primary"></ion-icon>
                    <div class="info-label">Shift</div>
                    <div class="info-value">{{ scannedOperator.shift.name }}</div>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div class="info-box">
                    <ion-icon :icon="layersOutline" color="primary"></ion-icon>
                    <div class="info-label">Line</div>
                    <div class="info-value">{{ scannedOperator.productionLine.name }}</div>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div class="info-box">
                    <ion-icon :icon="starOutline" color="primary"></ion-icon>
                    <div class="info-label">Score</div>
                    <div class="info-value">{{ scannedOperator.performanceScore.toFixed(1) }}</div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>

            <div class="action-buttons">
              <ion-button
                @click="goToCreateMerit"
                expand="block"
                color="success"
                class="action-btn"
              >
                <ion-icon :icon="trophyOutline" slot="start"></ion-icon>
                Input Merit
              </ion-button>

              <ion-button
                @click="goToCreateMisconduct"
                expand="block"
                color="danger"
                class="action-btn"
              >
                <ion-icon :icon="alertCircleOutline" slot="start"></ion-icon>
                Input Misconduct
              </ion-button>

              <ion-button
                @click="resetScanner"
                expand="block"
                fill="outline"
                class="action-btn"
              >
                <ion-icon :icon="qrCodeOutline" slot="start"></ion-icon>
                Scan Operator Lain
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
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
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  alertController
} from '@ionic/vue';
import {
  qrCodeOutline,
  alertCircleOutline,
  refreshOutline,
  searchOutline,
  keypadOutline,
  checkmarkCircleOutline,
  businessOutline,
  timeOutline,
  layersOutline,
  starOutline,
  trophyOutline
} from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { operatorService } from '@/services/operator.service';

const router = useRouter();

const scannedOperator = ref<any>(null);
const scanError = ref('');
const manualEmployeeId = ref('');
const loading = ref(false);

let html5QrcodeScanner: Html5Qrcode | null = null;

const startScanner = async () => {
  await nextTick();
  const qrReaderEl = document.getElementById('qr-reader');
  if (!qrReaderEl) return;

  try {
    html5QrcodeScanner = new Html5Qrcode('qr-reader');

    const cameras = await Html5Qrcode.getCameras();
    if (!cameras || cameras.length === 0) {
      scanError.value = 'Tidak ada kamera yang tersedia';
      return;
    }

    // Prefer back camera
    const backCamera = cameras.find(c =>
      c.label.toLowerCase().includes('back') ||
      c.label.toLowerCase().includes('rear') ||
      c.label.toLowerCase().includes('environment')
    );
    const cameraId = backCamera ? backCamera.id : cameras[0].id;

    await html5QrcodeScanner.start(
      cameraId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      onScanSuccess,
      () => { /* ignore scan failures, keep scanning */ }
    );
  } catch (err: any) {
    scanError.value = 'Gagal mengakses kamera: ' + (err.message || err);
    console.error('Scanner error:', err);
  }
};

const stopScanner = async () => {
  if (html5QrcodeScanner) {
    try {
      const state = html5QrcodeScanner.getState();
      if (state === 2 /* SCANNING */) {
        await html5QrcodeScanner.stop();
      }
    } catch (err) {
      console.error('Stop scanner error:', err);
    }
  }
};

const onScanSuccess = async (decodedText: string) => {
  await stopScanner();

  try {
    const response = await operatorService.scanQR(decodedText);
    if (response.success) {
      scannedOperator.value = response.data;
      scanError.value = '';
    } else {
      scanError.value = response.message || 'Operator tidak ditemukan';
    }
  } catch (err: any) {
    scanError.value = err.response?.data?.message || 'Gagal memproses QR Code';
  }
};

const lookupByEmployeeId = async () => {
  if (!manualEmployeeId.value) return;

  loading.value = true;
  scanError.value = '';

  try {
    const qrData = JSON.stringify({ employeeId: manualEmployeeId.value });
    const response = await operatorService.scanQR(qrData);
    if (response.success) {
      scannedOperator.value = response.data;
    } else {
      scanError.value = response.message || 'Operator tidak ditemukan';
    }
  } catch (err: any) {
    scanError.value = err.response?.data?.message || 'Operator tidak ditemukan';
  } finally {
    loading.value = false;
  }
};

const resetScanner = () => {
  scannedOperator.value = null;
  scanError.value = '';
  manualEmployeeId.value = '';
  startScanner();
};

const goToCreateMerit = () => {
  router.push({
    path: '/merit/create',
    query: { operatorId: scannedOperator.value.id.toString() }
  });
};

const goToCreateMisconduct = () => {
  router.push({
    path: '/misconduct/create',
    query: { operatorId: scannedOperator.value.id.toString() }
  });
};

onMounted(() => {
  startScanner();
});

onBeforeUnmount(() => {
  stopScanner();
});
</script>

<style scoped>
.scanner-section {
  padding: 16px;
}

.scanner-instructions {
  text-align: center;
  padding: 24px 16px;
}

.scanner-icon {
  font-size: 64px;
  color: var(--ion-color-primary);
  margin-bottom: 12px;
}

.scanner-instructions h2 {
  margin: 0 0 8px;
  font-size: 1.3rem;
  font-weight: 700;
}

.scanner-instructions p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.qr-reader-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.scan-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  margin: 16px 0;
  background: var(--ion-color-danger-tint);
  border-radius: 12px;
  color: var(--ion-color-danger);
}

.scan-error ion-icon {
  font-size: 32px;
}

.manual-input-section {
  margin-top: 24px;
}

.manual-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

/* Operator Found Section */
.operator-found-section {
  padding: 16px;
}

.success-card {
  border-radius: 16px;
}

.success-icon-wrapper {
  text-align: center;
  margin-bottom: 8px;
}

.success-icon {
  font-size: 56px;
  color: var(--ion-color-success);
}

.operator-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--ion-color-light);
  margin-bottom: 16px;
}

.avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.profile-info h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.employee-id {
  color: var(--ion-color-medium);
  margin: 4px 0;
  font-size: 0.9rem;
}

.position {
  color: var(--ion-color-primary);
  font-weight: 500;
  font-size: 0.85rem;
}

.info-box {
  text-align: center;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.info-box ion-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.info-label {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  margin-bottom: 2px;
}

.info-value {
  font-size: 0.85rem;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.action-btn {
  --border-radius: 12px;
  font-weight: 600;
}
</style>
