<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Permission Management</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="loadPermissions">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
          <ion-button @click="openCreateModal">
            <ion-icon :icon="addOutline"></ion-icon>
            Add Permission
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading State -->
      <div v-if="loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading permissions...</p>
      </div>

      <!-- Error State -->
      <ion-card v-else-if="error" color="danger" class="ion-margin">
        <ion-card-content>
          <p>{{ error }}</p>
          <ion-button @click="loadPermissions" size="small">Retry</ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Permissions by Module -->
      <div v-else class="permissions-container">
        <!-- Stats -->
        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">
                    <ion-icon :icon="keyOutline" color="primary"></ion-icon>
                  </div>
                  <div class="stat-value">{{ permissions.length }}</div>
                  <div class="stat-label">Total Permissions</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-md="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">
                    <ion-icon :icon="appsOutline" color="success"></ion-icon>
                  </div>
                  <div class="stat-value">{{ moduleList.length }}</div>
                  <div class="stat-label">Modules</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Module Sections -->
        <ion-card v-for="mod in permissionsByModule" :key="mod.module" class="module-card">
          <ion-card-header>
            <div class="module-header">
              <div class="module-title">
                <ion-icon :icon="appsOutline" color="primary"></ion-icon>
                <div>
                  <ion-card-title>{{ mod.module }}</ion-card-title>
                  <ion-card-subtitle>{{ mod.permissions.length }} permissions</ion-card-subtitle>
                </div>
              </div>
            </div>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item v-for="perm in mod.permissions" :key="perm.id">
                <ion-icon :icon="getPermissionIcon(perm.name)" slot="start" :color="getPermissionColor(perm.name)"></ion-icon>
                <ion-label>
                  <h3>{{ perm.name }}</h3>
                  <p>{{ perm.description }}</p>
                </ion-label>
                <ion-button fill="clear" size="small" @click="openEditModal(perm)" slot="end">
                  <ion-icon :icon="createOutline"></ion-icon>
                </ion-button>
                <ion-button fill="clear" size="small" color="danger" @click="confirmDelete(perm)" slot="end">
                  <ion-icon :icon="trashOutline"></ion-icon>
                </ion-button>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>

    <!-- Create/Edit Permission Modal -->
    <ion-modal :is-open="isModalOpen" @did-dismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editingPermission ? 'Edit Permission' : 'Create Permission' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <form @submit.prevent="savePermission">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Permission Name *</ion-label>
              <ion-input
                v-model="formData.name"
                type="text"
                placeholder="e.g. user.create"
                required
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Description *</ion-label>
              <ion-input
                v-model="formData.description"
                type="text"
                placeholder="e.g. Create new users"
                required
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Module *</ion-label>
              <ion-input
                v-model="formData.module"
                type="text"
                placeholder="e.g. User Management"
                required
              ></ion-input>
            </ion-item>
          </ion-list>

          <ion-button
            expand="block"
            type="submit"
            class="ion-margin-top"
            :disabled="saving"
          >
            <ion-spinner v-if="saving" name="crescent"></ion-spinner>
            <span v-else>{{ editingPermission ? 'Update Permission' : 'Create Permission' }}</span>
          </ion-button>
        </form>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
  IonCardSubtitle,
  IonCardContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  alertController,
  toastController
} from '@ionic/vue';
import {
  refreshOutline,
  addOutline,
  keyOutline,
  appsOutline,
  createOutline,
  trashOutline,
  eyeOutline,
  addCircleOutline,
  create as createIcon,
  trashBinOutline
} from 'ionicons/icons';
import axios from 'axios';

const permissions = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const isModalOpen = ref(false);
const editingPermission = ref<any>(null);

const formData = ref({
  name: '',
  description: '',
  module: ''
});

const moduleList = computed(() => {
  return [...new Set(permissions.value.map(p => p.module))];
});

const permissionsByModule = computed(() => {
  const groups = new Map<string, any[]>();
  permissions.value.forEach(p => {
    if (!groups.has(p.module)) {
      groups.set(p.module, []);
    }
    groups.get(p.module)!.push(p);
  });
  return Array.from(groups.entries()).map(([module, perms]) => ({
    module,
    permissions: perms
  }));
});

const loadPermissions = async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/permissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      permissions.value = response.data.data;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load permissions';
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  editingPermission.value = null;
  formData.value = { name: '', description: '', module: '' };
  isModalOpen.value = true;
};

const openEditModal = (perm: any) => {
  editingPermission.value = perm;
  formData.value = {
    name: perm.name,
    description: perm.description || '',
    module: perm.module
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingPermission.value = null;
};

const savePermission = async () => {
  saving.value = true;
  try {
    const token = localStorage.getItem('token');
    const url = editingPermission.value
      ? `${import.meta.env.VITE_API_URL}/permissions/${editingPermission.value.id}`
      : `${import.meta.env.VITE_API_URL}/permissions`;
    const method = editingPermission.value ? 'put' : 'post';

    const response = await axios[method](url, formData.value, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const toast = await toastController.create({
        message: editingPermission.value ? 'Permission updated' : 'Permission created',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      closeModal();
      loadPermissions();
    }
  } catch (err: any) {
    const toast = await toastController.create({
      message: err.response?.data?.message || 'Failed to save permission',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (perm: any) => {
  const alert = await alertController.create({
    header: 'Confirm Delete',
    message: `Delete permission "${perm.name}"?`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Delete', role: 'destructive', handler: () => deletePermission(perm.id) }
    ]
  });
  await alert.present();
};

const deletePermission = async (id: number) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `${import.meta.env.VITE_API_URL}/permissions/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.data.success) {
      const toast = await toastController.create({
        message: 'Permission deleted',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      loadPermissions();
    }
  } catch (err: any) {
    const toast = await toastController.create({
      message: err.response?.data?.message || 'Failed to delete',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  }
};

const getPermissionIcon = (name: string) => {
  if (name.includes('view')) return eyeOutline;
  if (name.includes('create')) return addCircleOutline;
  if (name.includes('delete')) return trashBinOutline;
  return createIcon;
};

const getPermissionColor = (name: string) => {
  if (name.includes('delete')) return 'danger';
  if (name.includes('create')) return 'success';
  if (name.includes('update') || name.includes('approve')) return 'warning';
  if (name.includes('view')) return 'primary';
  return 'medium';
};

onMounted(() => {
  loadPermissions();
});
</script>

<style scoped>
.permissions-container {
  padding: 0;
}

.stat-card ion-card-content {
  text-align: center;
  padding: 20px;
}

.stat-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--ion-color-primary);
  margin: 8px 0;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.module-card {
  margin: 16px;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.module-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.module-title ion-icon {
  font-size: 32px;
}

ion-spinner {
  display: inline-block;
  margin-right: 8px;
}
</style>
