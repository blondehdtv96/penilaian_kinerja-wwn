<template>
  <page-shell title="Pengajuan Saya" subtitle="Riwayat VoO / Ide Kaizen Anda">
    <template #actions>
      <button class="btn-primary" @click="go('/voo/submit')"><ion-icon :icon="addOutline" /> Ajukan Baru</button>
    </template>

    <div class="card">
      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else-if="items.length === 0" class="empty">
        Belum ada pengajuan. Klik “Ajukan Baru” untuk mengirim VoO / Ide Kaizen pertama Anda.
      </div>
      <div class="table-wrap" v-else>
        <table>
          <thead>
            <tr><th>Pengajuan</th><th>Tipe</th><th>Tanggal</th><th>Status</th><th class="amt">Poin</th></tr>
          </thead>
          <tbody>
            <tr v-for="v in items" :key="v.id">
              <td>
                <div class="ttl">{{ v.title }}</div>
                <div class="muted desc">{{ v.description }}</div>
                <div class="muted gs" v-if="v.groupShift">Group/Shift: {{ v.groupShift }}</div>
                <div class="rej" v-if="v.status === 'rejected' && v.rejectionReason">Alasan: {{ v.rejectionReason }}</div>
              </td>
              <td class="muted">{{ vooTypeLabel(v.type) }}</td>
              <td class="muted">{{ fmtDateShort(v.createdAt) }}</td>
              <td><span class="status" :class="vooStatusMeta(v.status).cls">{{ vooStatusMeta(v.status).label }}</span></td>
              <td class="amt" :class="v.points > 0 ? 'pos' : ''">{{ v.points > 0 ? '+' + v.points : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { addOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { vooService } from '@/services/voo.service';
import { useRealtime } from '@/composables/useRealtime';
import { fmtDateShort, vooTypeLabel, vooStatusMeta } from '@/utils/format';
import type { VooSubmission } from '@/types';

const router = useRouter();
const go = (p: string) => router.push(p);
const items = ref<VooSubmission[]>([]);
const loading = ref(true);
const error = ref('');

const load = async () => {
  try {
    const { data } = await vooService.getMy();
    if (data?.success) items.value = data.data;
    else error.value = 'Gagal memuat pengajuan.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat pengajuan.';
  } finally {
    loading.value = false;
  }
};

onMounted(load);
useRealtime('voo:changed', load);
</script>

<style scoped>
.ttl { font-weight: 500; }
.desc {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}
.gs { font-size: 12px; margin-top: 3px; }
.rej { font-size: 12px; color: var(--db-red); margin-top: 3px; }
</style>
