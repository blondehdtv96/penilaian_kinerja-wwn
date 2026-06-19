<template>
  <page-shell title="Segera Hadir" :subtitle="`Modul: ${pageLabel}`">
    <div class="card">
      <div class="cs">
        <div class="cs-ico"><ion-icon :icon="constructOutline" /></div>
        <h2>Halaman ini sedang dibangun</h2>
        <p>
          Modul <b>{{ pageLabel }}</b> akan tersedia pada fase berikutnya dari migrasi.
          Kerangka aplikasi, navigasi, dan desain sudah siap.
        </p>
        <button class="btn-primary" @click="goHome">
          <ion-icon :icon="arrowBackOutline" /> Ke Beranda
        </button>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { constructOutline, arrowBackOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { useAuthStore } from '@/stores/auth';
import { landingFor } from '@/router';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const pageLabel = computed(() => String(route.name ?? route.path));
const goHome = () => router.push(landingFor(auth.role));
</script>

<style scoped>
.cs {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 48px 20px;
}
.cs-ico {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--db-icon-bg);
  color: var(--db-ink-2);
  display: grid;
  place-items: center;
  font-size: 30px;
}
.cs h2 {
  font-size: 19px;
  font-weight: 700;
}
.cs p {
  font-size: 13.5px;
  color: var(--db-ink-2);
  max-width: 460px;
  line-height: 1.6;
}
.cs .btn-primary {
  margin-top: 8px;
}
</style>
