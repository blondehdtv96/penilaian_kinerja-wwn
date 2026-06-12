<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Operators</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Search and Filter Bar -->
      <ion-toolbar>
        <ion-searchbar
          v-model="searchQuery"
          placeholder="Search by name or employee ID"
          @ionInput="handleSearch"
        ></ion-searchbar>
      </ion-toolbar>

      <ion-toolbar>
        <ion-segment v-model="selectedFilter" @ionChange="handleFilterChange">
          <ion-segment-button value="all">
            <ion-label>All</ion-label>
          </ion-segment-button>
          <ion-segment-button value="department">
            <ion-label>Department</ion-label>
          </ion-segment-button>
          <ion-segment-button value="shift">
            <ion-label>Shift</ion-label>
          </ion-segment-button>
          <ion-segment-button value="line">
            <ion-label>Line</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading State -->
      <div v-if="loading" class="ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading operators...</p>
      </div>

      <!-- Error State -->
      <ion-card v-else-if="error" color="danger">
        <ion-card-content>
          <p>{{ error }}</p>
          <ion-button @click="loadOperators" size="small">Retry</ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Operators List -->
      <div v-else>
        <ion-card v-if="filteredOperators.length === 0" class="ion-margin">
          <ion-card-content>
            <p class="ion-text-center">No operators found</p>
          </ion-card-content>
        </ion-card>

        <ion-list v-else>
          <ion-item
            v-for="operator in filteredOperators"
            :key="operator.id"
            button
            @click="viewOperatorDetail(operator.id)"
          >
            <ion-avatar slot="start">
              <div class="avatar-placeholder">
                {{ operator.user.fullName.charAt(0) }}
              </div>
            </ion-avatar>

            <ion-label>
              <h2>{{ operator.user.fullName }}</h2>
              <p>{{ operator.employeeId }} • {{ operator.position }}</p>
              <p class="ion-text-wrap">
                <ion-badge color="primary">{{ operator.department.name }}</ion-badge>
                <ion-badge color="secondary" class="ion-margin-start">{{ operator.shift.name }}</ion-badge>
                <ion-badge color="tertiary" class="ion-margin-start">{{ operator.productionLine.name }}</ion-badge>
              </p>
            </ion-label>

            <div slot="end" class="performance-score">
              <div class="score-value">{{ operator.performanceScore.toFixed(1) }}</div>
              <div class="score-label">Score</div>
              <div class="merit-info">
                <ion-icon :icon="trophyOutline" color="success"></ion-icon>
                {{ operator.totalMerit }}
              </div>
              <div class="misconduct-info">
                <ion-icon :icon="warningOutline" color="danger"></ion-icon>
                {{ operator.totalMisconduct }}
              </div>
            </div>
          </ion-item>
        </ion-list>

        <!-- Stats Summary -->
        <ion-card class="ion-margin">
          <ion-card-header>
            <ion-card-title>Summary</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col>
                  <div class="stat-item">
                    <div class="stat-value">{{ operators.length }}</div>
                    <div class="stat-label">Total Operators</div>
                  </div>
                </ion-col>
                <ion-col>
                  <div class="stat-item">
                    <div class="stat-value">{{ averageScore }}</div>
                    <div class="stat-label">Avg Score</div>
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
import { ref, computed, onMounted } from 'vue';
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
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonAvatar,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/vue';
import { refreshOutline, trophyOutline, warningOutline } from 'ionicons/icons';
import axios from 'axios';

const router = useRouter();

const operators = ref<any[]>([]);
const loading = ref(false);
const error = ref('');
const searchQuery = ref('');
const selectedFilter = ref('all');

const filteredOperators = computed(() => {
  let result = operators.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(op =>
      op.user.fullName.toLowerCase().includes(query) ||
      op.employeeId.toLowerCase().includes(query)
    );
  }

  return result;
});

const averageScore = computed(() => {
  if (operators.value.length === 0) return '0.0';
  const total = operators.value.reduce((sum, op) => sum + op.performanceScore, 0);
  return (total / operators.value.length).toFixed(1);
});

const loadOperators = async () => {
  loading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/operators`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      operators.value = response.data.data;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load operators';
    console.error('Error loading operators:', err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  // Search is reactive through computed property
};

const handleFilterChange = () => {
  // Can be extended for more filtering options
};

const refreshData = () => {
  loadOperators();
};

const viewOperatorDetail = (id: number) => {
  router.push(`/operators/${id}`);
};

onMounted(() => {
  loadOperators();
});
</script>

<style scoped>
.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.performance-score {
  text-align: center;
  padding: 8px;
}

.score-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.score-label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-bottom: 8px;
}

.merit-info,
.misconduct-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.85rem;
  margin-top: 4px;
}

.stat-item {
  text-align: center;
  padding: 12px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin-top: 4px;
}

ion-spinner {
  display: block;
  margin: 20px auto;
}
</style>
