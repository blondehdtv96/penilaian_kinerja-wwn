<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/misconduct"></ion-back-button>
        </ion-buttons>
        <ion-title>Input Misconduct</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading operator info -->
      <div v-if="loadingOperator" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading operator info...</p>
      </div>

      <!-- Operator not found -->
      <ion-card v-else-if="!selectedOperator" color="warning" class="ion-margin">
        <ion-card-content>
          <p>Pilih operator terlebih dahulu</p>
          <ion-button @click="goToScanner" size="small">
            <ion-icon :icon="qrCodeOutline" slot="start"></ion-icon>
            Scan QR Code
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Form -->
      <div v-else>
        <!-- Selected Operator Card -->
        <ion-card class="operator-card">
          <ion-card-content>
            <div class="operator-row">
              <div class="avatar-small">{{ selectedOperator.user.fullName.charAt(0) }}</div>
              <div class="operator-info">
                <h3>{{ selectedOperator.user.fullName }}</h3>
                <p>{{ selectedOperator.employeeId }} &bull; {{ selectedOperator.position }}</p>
                <p class="dept-info">{{ selectedOperator.department.name }} | {{ selectedOperator.shift.name }}</p>
              </div>
              <ion-button fill="clear" size="small" @click="clearOperator">
                <ion-icon :icon="closeCircleOutline"></ion-icon>
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Misconduct Form -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Detail Misconduct</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label position="floating">Jenis Pelanggaran *</ion-label>
                <ion-select v-model="form.misconductType" placeholder="Pilih jenis pelanggaran">
                  <ion-select-option value="Late Arrival">Late Arrival</ion-select-option>
                  <ion-select-option value="Early Leave">Early Leave</ion-select-option>
                  <ion-select-option value="Absent Without Notice">Absent Without Notice</ion-select-option>
                  <ion-select-option value="Safety Violation">Safety Violation</ion-select-option>
                  <ion-select-option value="Quality Defect">Quality Defect</ion-select-option>
                  <ion-select-option value="Insubordination">Insubordination</ion-select-option>
                  <ion-select-option value="Equipment Damage">Equipment Damage</ion-select-option>
                  <ion-select-option value="Other">Other</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-label position="floating">Severity *</ion-label>
                <ion-select v-model="form.severity" placeholder="Pilih tingkat keparahan">
                  <ion-select-option value="low">Low</ion-select-option>
                  <ion-select-option value="medium">Medium</ion-select-option>
                  <ion-select-option value="high">High</ion-select-option>
                  <ion-select-option value="critical">Critical</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-label position="floating">Poin *</ion-label>
                <ion-input v-model.number="form.points" type="number" min="1" max="100"></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="floating">Deskripsi *</ion-label>
                <ion-textarea v-model="form.description" :rows="4" placeholder="Jelaskan detail pelanggaran..."></ion-textarea>
              </ion-item>

              <ion-item>
                <ion-label position="floating">Production Line</ion-label>
                <ion-input :value="selectedOperator.productionLine.name" disabled></ion-input>
              </ion-item>
            </ion-list>

            <ion-button
              @click="submitMisconduct"
              expand="block"
              color="danger"
              class="ion-margin-top submit-btn"
              :disabled="!isValid || submitting"
            >
              <ion-spinner v-if="submitting" name="crescent" slot="start"></ion-spinner>
              <ion-icon v-else :icon="alertCircleOutline" slot="start"></ion-icon>
              Submit Misconduct
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonList,
  IonItem, IonLabel, IonInput, IonTextarea, IonSelect,
  IonSelectOption, IonSpinner
} from '@ionic/vue';
import {
  qrCodeOutline, closeCircleOutline, alertCircleOutline
} from 'ionicons/icons';
import { misconductService } from '@/services/misconduct.service';
import { operatorService } from '@/services/operator.service';

const route = useRoute();
const router = useRouter();

const selectedOperator = ref<any>(null);
const loadingOperator = ref(false);
const submitting = ref(false);

const form = ref({
  misconductType: '',
  severity: '',
  points: 0,
  description: ''
});

const isValid = computed(() => {
  return form.value.misconductType &&
    form.value.severity &&
    form.value.points > 0 &&
    form.value.description.trim().length > 0 &&
    selectedOperator.value;
});

const loadOperator = async (operatorId: number) => {
  loadingOperator.value = true;
  try {
    const response = await operatorService.getById(operatorId);
    if (response.success) {
      selectedOperator.value = response.data;
    }
  } catch (err: any) {
    console.error('Failed to load operator:', err);
  } finally {
    loadingOperator.value = false;
  }
};

const clearOperator = () => {
  selectedOperator.value = null;
};

const goToScanner = () => {
  router.push('/scanner');
};

const submitMisconduct = async () => {
  if (!isValid.value || !selectedOperator.value) return;

  submitting.value = true;
  try {
    const response = await misconductService.create({
      operatorId: selectedOperator.value.id,
      productionLineId: selectedOperator.value.productionLineId,
      misconductType: form.value.misconductType,
      severity: form.value.severity,
      points: form.value.points,
      description: form.value.description
    });

    if (response.success) {
      router.push('/misconduct');
    }
  } catch (err: any) {
    console.error('Submit misconduct error:', err);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  const operatorId = route.query.operatorId;
  if (operatorId) {
    loadOperator(parseInt(operatorId as string));
  }
});
</script>

<style scoped>
.operator-card {
  margin: 12px;
}

.operator-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-small {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.operator-info {
  flex: 1;
}

.operator-info h3 {
  margin: 0;
  font-weight: 700;
  font-size: 1rem;
}

.operator-info p {
  margin: 2px 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.dept-info {
  font-size: 0.75rem !important;
  color: var(--ion-color-primary) !important;
}

.submit-btn {
  --border-radius: 12px;
  font-weight: 600;
  margin-top: 16px;
}

ion-spinner {
  display: block;
  margin: 20px auto;
}
</style>
