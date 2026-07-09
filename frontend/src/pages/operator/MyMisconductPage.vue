<template>
  <page-shell title="Pelanggaran Saya" subtitle="Riwayat pelanggaran yang diberikan Foreman / Section Manager">
    <div class="card">
      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else-if="items.length === 0" class="empty">
        <ion-icon :icon="checkmarkCircleOutline" /> Belum ada pelanggaran tercatat. Pertahankan!
      </div>
      <div class="table-wrap" v-else>
        <table>
          <thead>
            <tr>
              <th>Jenis</th>
              <th>Keparahan</th>
              <th>Poin</th>
              <th>Diberikan Oleh</th>
              <th>Status Tindak Lanjut</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in items" :key="m.id">
              <td>
                <div class="ttl">{{ m.type }}</div>
                <div class="muted desc">{{ m.description }}</div>
              </td>
              <td><span class="status" :class="severityMeta(m.severity).cls">{{ severityMeta(m.severity).label }}</span></td>
              <td class="amt neg">{{ m.points > 0 ? '-' + m.points : '—' }}</td>
              <td>
                <div class="who">
                  <div class="t-ava">{{ initials(m.createdBy?.fullName) }}</div>
                  <div>
                    <div>{{ m.createdBy?.fullName || '-' }}</div>
                    <div class="muted role-tag">{{ m.createdBy?.role?.name || '-' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span v-if="m.counseling" class="fu-badge done">
                  <ion-icon :icon="checkmarkCircleOutline" /> Sudah dikonseling
                </span>
                <span v-else class="fu-badge pending">
                  <ion-icon :icon="timeOutline" /> Belum dikonseling
                </span>
              </td>
              <td class="muted">{{ fmtDateShort(m.createdAt) }}</td>
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
import { checkmarkCircleOutline, timeOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { recordsService } from '@/services/records.service';
import { useRealtime } from '@/composables/useRealtime';
import { initials, fmtDateShort, severityMeta } from '@/utils/format';
import type { MisconductItem } from '@/types';

const items = ref<MisconductItem[]>([]);
const loading = ref(true);
const error = ref('');

const load = async () => {
  try {
    const { data } = await recordsService.listMyMisconduct();
    if (data?.success) items.value = data.data;
    else error.value = 'Gagal memuat data pelanggaran.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat data pelanggaran.';
  } finally {
    loading.value = false;
  }
};

onMounted(load);
useRealtime('record:changed', load);
</script>

<style scoped>
.ttl { font-weight: 500; }
.desc {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}
.who { display: flex; align-items: center; gap: 8px; }
.role-tag { font-size: 11px; }
.fu-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.fu-badge ion-icon { font-size: 14px; }
.fu-badge.done { background: #dcfce7; color: #166534; }
.fu-badge.pending { background: #fef3c7; color: #92400e; }
.empty { display: flex; align-items: center; gap: 6px; justify-content: center; }
</style>
