<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <div class="flex items-center justify-center min-h-screen">
        <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800">Merit-Misconduct</h1>
            <p class="text-gray-600 mt-2">PT Bridgestone Tire Indonesia</p>
          </div>

          <form @submit.prevent="handleLogin">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">
                Username
              </label>
              <input
                v-model="form.username"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Enter username"
                required
              />
            </div>

            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                v-model="form.password"
                type="password"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ loading ? 'Loading...' : 'Login' }}
            </button>

            <div v-if="error" class="mt-4 text-red-600 text-center text-sm">
              {{ error }}
            </div>
          </form>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  username: '',
  password: ''
});

const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authStore.login(form.value.username, form.value.password);
    router.push('/dashboard');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed';
  } finally {
    loading.value = false;
  }
};
</script>
