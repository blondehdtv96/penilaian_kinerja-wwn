<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>User Management</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData" aria-label="Refresh users">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
          <ion-button @click="openCreateModal" v-if="canCreateUser">
            <ion-icon :icon="addOutline"></ion-icon>
            Add User
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Search Bar -->
      <ion-toolbar>
        <ion-searchbar
          v-model="searchQuery"
          placeholder="Search by name, username, or email"
          @ionInput="handleSearch"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading State -->
      <div v-if="loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading users...</p>
      </div>

      <!-- Error State -->
      <ion-card v-else-if="error" color="danger" class="ion-margin">
        <ion-card-content>
          <p>{{ error }}</p>
          <ion-button @click="loadUsers" size="small">Retry</ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Users List -->
      <div v-else>
        <!-- Stats Cards -->
        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="3">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">
                    <ion-icon :icon="peopleOutline" color="primary"></ion-icon>
                  </div>
                  <div class="stat-value">{{ users.length }}</div>
                  <div class="stat-label">Total Users</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-md="3">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">
                    <ion-icon :icon="checkmarkCircleOutline" color="success"></ion-icon>
                  </div>
                  <div class="stat-value">{{ activeUsers }}</div>
                  <div class="stat-label">Active Users</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-md="3">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">
                    <ion-icon :icon="closeCircleOutline" color="danger"></ion-icon>
                  </div>
                  <div class="stat-value">{{ inactiveUsers }}</div>
                  <div class="stat-label">Inactive Users</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-md="3">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">
                    <ion-icon :icon="shieldCheckmarkOutline" color="warning"></ion-icon>
                  </div>
                  <div class="stat-value">{{ rolesCount }}</div>
                  <div class="stat-label">Total Roles</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Users Table -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>All Users ({{ filteredUsers.length }})</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="filteredUsers.length === 0" class="ion-text-center ion-padding">
              <p>No users found</p>
            </div>

            <ion-list v-else>
              <ion-item v-for="user in filteredUsers" :key="user.id">
                <ion-avatar slot="start">
                  <div class="avatar-placeholder" :class="{ inactive: !user.isActive }">
                    {{ user.fullName.charAt(0).toUpperCase() }}
                  </div>
                </ion-avatar>

                <ion-label>
                  <h2>
                    {{ user.fullName }}
                    <ion-badge
                      :color="user.isActive ? 'success' : 'danger'"
                      class="ion-margin-start"
                    >
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </ion-badge>
                  </h2>
                  <p>@{{ user.username }} • {{ user.email }}</p>
                  <p class="roles-list">
                    <ion-icon :icon="shieldCheckmarkOutline" size="small"></ion-icon>
                    <span v-for="(userRole, idx) in user.userRoles" :key="userRole.role.id">
                      <ion-badge :color="getRoleColor(userRole.role.name)">
                        {{ userRole.role.name }}
                      </ion-badge>
                      <span v-if="idx < user.userRoles.length - 1">, </span>
                    </span>
                  </p>
                  <p class="text-small">
                    Created: {{ formatDate(user.createdAt) }}
                  </p>
                </ion-label>

                <div slot="end" class="action-buttons">
                  <ion-button
                    fill="clear"
                    @click="openEditModal(user)"
                    v-if="canEditUser"
                  >
                    <ion-icon :icon="createOutline"></ion-icon>
                  </ion-button>
                  <ion-button
                    fill="clear"
                    :color="user.isActive ? 'warning' : 'success'"
                    @click="toggleUserStatus(user)"
                    v-if="canEditUser"
                  >
                    <ion-icon :icon="user.isActive ? powerOutline : checkmarkCircleOutline"></ion-icon>
                  </ion-button>
                  <ion-button
                    fill="clear"
                    color="danger"
                    @click="confirmDelete(user)"
                    v-if="canDeleteUser && user.id !== authStore.user?.id"
                  >
                    <ion-icon :icon="trashOutline"></ion-icon>
                  </ion-button>
                </div>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>

    <!-- Create/Edit User Modal -->
    <ion-modal :is-open="isModalOpen" @did-dismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editingUser ? 'Edit User' : 'Create User' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <form @submit.prevent="saveUser">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Full Name *</ion-label>
              <ion-input
                v-model="formData.fullName"
                type="text"
                placeholder="Enter full name"
                required
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Username *</ion-label>
              <ion-input
                v-model="formData.username"
                type="text"
                placeholder="Enter username"
                :disabled="!!editingUser"
                required
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Email *</ion-label>
              <ion-input
                v-model="formData.email"
                type="email"
                placeholder="Enter email"
                required
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">
                Password {{ editingUser ? '(leave blank to keep current)' : '*' }}
              </ion-label>
              <ion-input
                v-model="formData.password"
                type="password"
                placeholder="Enter password"
                :required="!editingUser"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Roles *</ion-label>
              <ion-select
                v-model="formData.roleIds"
                multiple
                placeholder="Select roles"
                :required="true"
              >
                <ion-select-option
                  v-for="role in availableRoles"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ role.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item v-if="editingUser">
              <ion-label>Active Status</ion-label>
              <ion-toggle v-model="formData.isActive"></ion-toggle>
            </ion-item>
          </ion-list>

          <ion-button
            expand="block"
            type="submit"
            class="ion-margin-top"
            :disabled="saving"
          >
            <ion-spinner v-if="saving" name="crescent"></ion-spinner>
            <span v-else>{{ editingUser ? 'Update User' : 'Create User' }}</span>
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
  IonSearchbar,
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
  IonAvatar,
  IonLabel,
  IonBadge,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToggle,
  alertController,
  toastController
} from '@ionic/vue';
import {
  refreshOutline,
  addOutline,
  peopleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  shieldCheckmarkOutline,
  createOutline,
  trashOutline,
  powerOutline
} from 'ionicons/icons';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const users = ref<any[]>([]);
const availableRoles = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const searchQuery = ref('');
const isModalOpen = ref(false);
const editingUser = ref<any>(null);

const formData = ref({
  fullName: '',
  username: '',
  email: '',
  password: '',
  roleIds: [] as number[],
  isActive: true
});

const canCreateUser = computed(() => authStore.hasPermission('user.create'));
const canEditUser = computed(() => authStore.hasPermission('user.update'));
const canDeleteUser = computed(() => authStore.hasPermission('user.delete'));

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(user =>
    user.fullName.toLowerCase().includes(query) ||
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query)
  );
});

const activeUsers = computed(() => users.value.filter(u => u.isActive).length);
const inactiveUsers = computed(() => users.value.filter(u => !u.isActive).length);
const rolesCount = computed(() => {
  const roles = new Set();
  users.value.forEach(user => {
    user.userRoles.forEach((ur: any) => roles.add(ur.role.name));
  });
  return roles.size;
});

const loadUsers = async () => {
  loading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      users.value = response.data.data;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load users';
    console.error('Error loading users:', err);
  } finally {
    loading.value = false;
  }
};

const loadRoles = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      availableRoles.value = response.data.data;
    }
  } catch (err) {
    console.error('Error loading roles:', err);
  }
};

const handleSearch = () => {
  // Search is reactive through computed property
};

const refreshData = () => {
  loadUsers();
};

const openCreateModal = () => {
  editingUser.value = null;
  formData.value = {
    fullName: '',
    username: '',
    email: '',
    password: '',
    roleIds: [],
    isActive: true
  };
  isModalOpen.value = true;
};

const openEditModal = (user: any) => {
  editingUser.value = user;
  formData.value = {
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    password: '',
    roleIds: user.userRoles.map((ur: any) => ur.role.id),
    isActive: user.isActive
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingUser.value = null;
};

const saveUser = async () => {
  saving.value = true;

  try {
    const token = localStorage.getItem('token');
    const url = editingUser.value
      ? `${import.meta.env.VITE_API_URL}/users/${editingUser.value.id}`
      : `${import.meta.env.VITE_API_URL}/users`;
    
    const method = editingUser.value ? 'put' : 'post';
    
    const data: any = {
      fullName: formData.value.fullName,
      email: formData.value.email,
      roleIds: formData.value.roleIds
    };

    if (!editingUser.value) {
      data.username = formData.value.username;
      data.password = formData.value.password;
    } else {
      if (formData.value.password) {
        data.password = formData.value.password;
      }
      data.isActive = formData.value.isActive;
    }

    const response = await axios[method](url, data, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const toast = await toastController.create({
        message: editingUser.value ? 'User updated successfully' : 'User created successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      closeModal();
      loadUsers();
    }
  } catch (err: any) {
    const toast = await toastController.create({
      message: err.response?.data?.message || 'Failed to save user',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    saving.value = false;
  }
};

const toggleUserStatus = async (user: any) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `${import.meta.env.VITE_API_URL}/users/${user.id}/toggle-status`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.data.success) {
      const toast = await toastController.create({
        message: `User ${response.data.data.isActive ? 'activated' : 'deactivated'} successfully`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      loadUsers();
    }
  } catch (err: any) {
    const toast = await toastController.create({
      message: err.response?.data?.message || 'Failed to toggle user status',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  }
};

const confirmDelete = async (user: any) => {
  const alert = await alertController.create({
    header: 'Confirm Delete',
    message: `Are you sure you want to delete user "${user.fullName}"? This action cannot be undone.`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => deleteUser(user.id)
      }
    ]
  });

  await alert.present();
};

const deleteUser = async (userId: number) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `${import.meta.env.VITE_API_URL}/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.data.success) {
      const toast = await toastController.create({
        message: 'User deleted successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      loadUsers();
    }
  } catch (err: any) {
    const toast = await toastController.create({
      message: err.response?.data?.message || 'Failed to delete user',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getRoleColor = (roleName: string) => {
  const colors: Record<string, string> = {
    'Super Admin': 'warning',
    'HRD': 'success',
    'Manager': 'secondary',
    'Supervisor': 'tertiary',
    'Operator': 'primary'
  };
  return colors[roleName] || 'medium';
};

onMounted(() => {
  loadUsers();
  loadRoles();
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

.avatar-placeholder.inactive {
  background: linear-gradient(135deg, var(--ion-color-medium), var(--ion-color-light));
}

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

.roles-list {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.roles-list ion-badge {
  font-size: 0.7rem;
}

.text-small {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

ion-spinner {
  display: inline-block;
  margin-right: 8px;
}
</style>
