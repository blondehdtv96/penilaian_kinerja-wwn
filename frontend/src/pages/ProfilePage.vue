<template>
  <page-shell title="Profil Saya" subtitle="Informasi akun dan peran Anda">
    <div class="grid g-bottom">
      <div class="card">
        <div class="prof-head">
          <div class="prof-ava">{{ initials(auth.user?.fullName) }}</div>
          <div class="prof-id">
            <h2>{{ auth.user?.fullName }}</h2>
            <span class="badge-muted">{{ auth.user?.role }}</span>
          </div>
        </div>
        <div class="info-list">
          <div class="info-row"><span>Nama Pengguna</span><b>{{ auth.user?.username }}</b></div>
          <div class="info-row"><span>Email</span><b>{{ auth.user?.email }}</b></div>
          <div class="info-row"><span>NIP</span><b>{{ auth.user?.nip || '-' }}</b></div>
          <div class="info-row"><span>Status Akun</span><b>{{ auth.user?.isActive ? 'Aktif' : 'Nonaktif' }}</b></div>
        </div>
        <button class="btn-ghost btn-block" style="margin-top: 18px" @click="logout">
          <ion-icon :icon="logOutOutline" /> Keluar dari Akun
        </button>
      </div>

      <div class="card" v-if="op">
        <div class="card-head"><h3>Data Operator</h3></div>
        <div class="info-list">
          <div class="info-row"><span>ID Karyawan</span><b>{{ op.employeeId }}</b></div>
          <div class="info-row"><span>Section</span><b>{{ op.section }}</b></div>
          <div class="info-row"><span>Line</span><b>{{ op.line }}</b></div>
          <div class="info-row"><span>Group</span><b>{{ op.group }}</b></div>
          <div class="info-row"><span>Posisi</span><b>{{ op.position }}</b></div>
        </div>
        <div class="qr-wrap" v-if="op.qrCode">
          <img :src="op.qrCode" alt="QR Identitas Operator" />
          <span class="muted">QR Identitas — tunjukkan ke Foreman</span>
        </div>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { logOutOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { useAuthStore } from '@/stores/auth';
import { initials } from '@/utils/format';

const auth = useAuthStore();
const router = useRouter();
const op = computed(() => auth.user?.operator ?? null);
const logout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<style scoped>
.prof-head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.prof-ava {
  width: 60px; height: 60px; border-radius: 50%; background: var(--db-brand); color: #fff;
  display: grid; place-items: center; font-weight: 700; font-size: 24px;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}
.prof-id h2 { font-size: 19px; font-weight: 700; }
.prof-id .badge-muted { margin-top: 6px; }
.qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 18px; }
.qr-wrap img {
  width: 180px; height: 180px; border-radius: 12px; border: 1px solid var(--db-line);
  background: #fff; padding: 8px;
}
</style>
