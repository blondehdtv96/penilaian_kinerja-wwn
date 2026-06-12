<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Role & Permission Management</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
          <ion-button @click="openCreateModal" v-if="canCreateRole">
            <ion-icon :icon="addOutline"></ion-icon>
            Add Role
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading State -->
      <div v-if="loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading roles...</p>
      </div>

      <!-- Error State -->
      <ion-card v-else-if="error" color="danger" class="ion-margin">
        <ion-card-content>
          <p>{{ error }}</p>
          <ion-button @click="loadRoles" size="small">Retry</ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Roles Management -->
      <div v-else>
        <!-- Stats Cards -->
        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="4">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">
                    <ion-icon :icon="shieldCheckmarkOutline" color="primary"></ion-icon>
                  </div>
                  <div class="stat-value">{{ roles.length }}</div>
                  <div class="stat-label">Total Roles</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-md="4">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">
                    <ion-icon :icon="keyOutline" color="success"></ion-icon>
                  </div>
                  <div class="stat-value">{{ permissions.length }}</div>
                  <div class="stat-label">Total Permissions</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-md="4">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">
                    <ion-icon :icon="peopleOutline" color="warning"></ion-icon>
                  </div>
                  <div class="stat-value">{{ totalUsers }}</div>
                  <div class="stat-label">Total Users with Roles</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Roles List -->
        <ion-card v-for="role in roles" :key="role.id" class="role-card">
          <ion-card-header>
            <div class="role-header">
              <div class="role-info">
                <ion-icon :icon="shieldCheckmarkOutline" :color="getRoleColor(role.name)"></ion-icon>
                <div>
                  <ion-card-title>{{ role.name }}</ion-card-title>
                  <ion-card-subtitle>{{ role.description }}</ion-card-subtitle>
                </div>
              </div>
              <div class="role-actions">
                <ion-badge :color="getRoleColor(role.name)">
                  {{ role._count.userRoles }} {{ role._count.userRoles === 1 ? 'User' : 'Users' }}
                </ion-badge>
                <ion-button
                  fill="clear"
                  @click="openEditModal(role)"
                  v-if="canEditRole"
                >
                  <ion-icon :icon="createOutline"></ion-icon>
                </ion-button>
                <ion-button
                  fill="clear"
                  color="danger"
                  @click="confirmDelete(role)"
                  v-if="canDeleteRole && !isSystemRole(role.name)"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                </ion-button>
              </div>
            </div>
          </ion-card-header>
          
          <ion-card-content>
            <div class="permissions-section">
              <div class="section-title">
                <ion-icon :icon="keyOutline" size="small"></ion-icon>
                Permissions ({{ role.rolePermissions.length }})
              </div>
              
              <div v-if="role.rolePermissions.length === 0" class="no-permissions">
                No permissions assigned
              </div>
              
              <div v-else class="permissions-grid">
                <div
                  v-for="modules in groupedPermissions(role.rolePermissions)"
                  :key="modules.module"
                  class="permission-module"
                >
                  <div class="module-name">{{ modules.module }}</div>
                  <div class="module-permissions">
                    <ion-chip
                      v-for="rp in modules.permissions"
                      :key="rp.permission.id"
                      :color="getPermissionColor(rp.permission.name)"
                    >
                      <ion-icon :icon="checkmarkCircleOutline" size="small"></ion-icon>
                      <ion-label>{{ rp.permission.name }}</ion-label>
                    </ion-chip>
                  </div>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>

    <!-- Create/Edit Role Modal -->
    <ion-modal :is-open="isModalOpen" @did-dismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editingRole ? 'Edit Role' : 'Create Role' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <form @submit.prevent="saveRole">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Role Name *</ion-label>
              <ion-input
                v-model="formData.name"
                type="text"
                placeholder="Enter role name"
                :disabled="editingRole && isSystemRole(editingRole.name)"
                required
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Description</ion-label>
              <ion-textarea
                v-model="formData.description"
                placeholder="Enter role description"
                :rows="3"
              ></ion-textarea>
            </ion-item>

            <!-- Permissions Selection by Module -->
            <ion-item-divider>
              <ion-label>Permissions</ion-label>
            </ion-item-divider>

            <div class="permissions-selection">
              <div
                v-for="module in permissionsByModule"
                :key="module.name"
                class="module-section"
              >
                <ion-item-divider color="light">
                  <ion-label>{{ module.name }}</ion-label>
                  <ion-button
                    slot="end"
                    size="small"
                    fill="clear"
                    @click="toggleModulePermissions(module)"
                  >
                    {{ isModuleFullySelected(module) ? 'Deselect All' : 'Select All' }}
                  </ion-button>
                </ion-item-divider>

                <ion-item v-for="permission in module.permissions" :key="permission.id">
                  <ion-checkbox
                    v-model="formData.permissionIds"
                    :value="permission.id"
                    slot="start"
                  ></ion-checkbox>
                  <ion-label>
                    <h3>{{ permission.name }}</h3>
                    <p>{{ permission.description }}</p>
                  </ion-label>
                </ion-item>
              </div>
            </div>
          </ion-list>

          <ion-button
            expand="block"
            type="submit"
            class="ion-margin-top"
            :disabled="saving"
          >
            <ion-spinner v-if="saving" name="crescent"></ion-spinner>
            <span v-else>{{ editingRole ? 'Update Role' : 'Create Role' }}</span>
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
  IonBadge,
  IonModal,
  IonList,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonInput,
  IonTextarea,
  IonCheckbox,
  IonChip,
  alertController,
  toastController
} from '@ionic/vue';
import {
  refreshOutline,
  addOutline,
  shieldCheckmarkOutline,
  keyOutline,
  peopleOutline,
  createOutline,
  trashOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const roles = ref<any[]>([]);
const permissions = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const isModalOpen = ref(false);
const editingRole = ref<any>(null);

const formData = ref({
  name: '',
  description: '',
  permissionIds: [] as number[]
});

const systemRoles = ['Super Admin', 'Manager', 'Staff Produksi', 'Foreman', 'Operator'];

const canCreateRole = computed(() => authStore.hasPermission('role.create'));
const canEditRole = computed(() => authStore.hasPermission('role.update'));
const canDeleteRole = computed(() => authStore.hasPermission('role.delete'));

const totalUsers = computed(() => {
  return roles.value.reduce((sum, role) => sum + role._count.userRoles, 0);
});

const permissionsByModule = computed(() => {
  const modules = new Map<string, any[]>();
  
  permissions.value.forEach(permission => {
    if (!modules.has(permission.module)) {
      modules.set(permission.module, []);
    }
    modules.get(permission.module)!.push(permission);
  });

  return Array.from(modules.entries()).map(([name, perms]) => ({
    name,
    permissions: perms
  }));
});

const loadRoles = async () => {
  loading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      roles.value = response.data.data;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load roles';
    console.error('Error loading roles:', err);
  } finally {
    loading.value = false;
  }
};

const loadPermissions = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/permissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      permissions.value = response.data.data;
    }
  } catch (err) {
    console.error('Error loading permissions:', err);
  }
};

const refreshData = () => {
  loadRoles();
  loadPermissions();
};

const openCreateModal = () => {
  editingRole.value = null;
  formData.value = {
    name: '',
    description: '',
    permissionIds: []
  };
  isModalOpen.value = true;
};

const openEditModal = (role: any) => {
  editingRole.value = role;
  formData.value = {
    name: role.name,
    description: role.description || '',
    permissionIds: role.rolePermissions.map((rp: any) => rp.permission.id)
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingRole.value = null;
};

const saveRole = async () => {
  saving.value = true;

  try {
    const token = localStorage.getItem('token');
    const url = editingRole.value
      ? `${import.meta.env.VITE_API_URL}/roles/${editingRole.value.id}`
      : `${import.meta.env.VITE_API_URL}/roles`;
    
    const method = editingRole.value ? 'put' : 'post';

    const response = await axios[method](url, formData.value, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const toast = await toastController.create({
        message: editingRole.value ? 'Role updated successfully' : 'Role created successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      closeModal();
      loadRoles();
    }
  } catch (err: any) {
    const toast = await toastController.create({
      message: err.response?.data?.message || 'Failed to save role',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (role: any) => {
  const alert = await alertController.create({
    header: 'Confirm Delete',
    message: `Are you sure you want to delete role "${role.name}"? This will affect ${role._count.userRoles} user(s).`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => deleteRole(role.id)
      }
    ]
  });

  await alert.present();
};

const deleteRole = async (roleId: number) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `${import.meta.env.VITE_API_URL}/roles/${roleId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.data.success) {
      const toast = await toastController.create({
        message: 'Role deleted successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      loadRoles();
    }
  } catch (err: any) {
    const toast = await toastController.create({
      message: err.response?.data?.message || 'Failed to delete role',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  }
};

const groupedPermissions = (rolePermissions: any[]) => {
  const groups = new Map<string, any[]>();
  
  rolePermissions.forEach(rp => {
    const module = rp.permission.module;
    if (!groups.has(module)) {
      groups.set(module, []);
    }
    groups.get(module)!.push(rp);
  });

  return Array.from(groups.entries()).map(([module, perms]) => ({
    module,
    permissions: perms
  }));
};

const isModuleFullySelected = (module: any) => {
  return module.permissions.every((p: any) => 
    formData.value.permissionIds.includes(p.id)
  );
};

const toggleModulePermissions = (module: any) => {
  const isFullySelected = isModuleFullySelected(module);
  
  if (isFullySelected) {
    // Deselect all in this module
    formData.value.permissionIds = formData.value.permissionIds.filter(
      id => !module.permissions.some((p: any) => p.id === id)
    );
  } else {
    // Select all in this module
    const modulePermissionIds = module.permissions.map((p: any) => p.id);
    formData.value.permissionIds = [
      ...formData.value.permissionIds.filter(
        id => !module.permissions.some((p: any) => p.id === id)
      ),
      ...modulePermissionIds
    ];
  }
};

const isSystemRole = (roleName: string) => {
  return systemRoles.includes(roleName);
};

const getRoleColor = (roleName: string) => {
  const colors: Record<string, string> = {
    'Super Admin': 'warning',
    'Manager': 'secondary',
    'Staff Produksi': 'success',
    'Foreman': 'tertiary',
    'Operator': 'primary'
  };
  return colors[roleName] || 'medium';
};

const getPermissionColor = (permissionName: string) => {
  if (permissionName.includes('delete')) return 'danger';
  if (permissionName.includes('create')) return 'success';
  if (permissionName.includes('update')) return 'warning';
  if (permissionName.includes('view')) return 'primary';
  return 'medium';
};

onMounted(() => {
  loadRoles();
  loadPermissions();
});
</script>

<style scoped>
.stat-card {
  margin: 0;
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

.role-card {
  margin: 16px;
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-info ion-icon {
  font-size: 32px;
}

.role-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.permissions-section {
  margin-top: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.no-permissions {
  padding: 20px;
  text-align: center;
  color: var(--ion-color-medium);
  font-style: italic;
}

.permissions-grid {
  display: grid;
  gap: 16px;
}

.permission-module {
  border-left: 3px solid var(--ion-color-primary);
  padding-left: 12px;
}

.module-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--ion-color-dark);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.module-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.permissions-selection {
  max-height: 400px;
  overflow-y: auto;
}

.module-section {
  margin-bottom: 16px;
}

ion-spinner {
  display: inline-block;
  margin-right: 8px;
}
</style>
